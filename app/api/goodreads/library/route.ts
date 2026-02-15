import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Parse Goodreads CSV content into book objects
function parseGoodreadsCSV(csvContent: string): Array<{
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  myRating: number | null
  dateRead: string | null
  bookshelves: string | null
  exclusiveShelf: string | null
}> {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title')
  const authorIdx = headers.findIndex(h => h.toLowerCase() === 'author')
  const isbnIdx = headers.findIndex(h => h.toLowerCase() === 'isbn')
  const isbn13Idx = headers.findIndex(h => h.toLowerCase() === 'isbn13')
  const ratingIdx = headers.findIndex(h => h.toLowerCase() === 'my rating')
  const dateReadIdx = headers.findIndex(h => h.toLowerCase() === 'date read')
  const bookshelvesIdx = headers.findIndex(h => h.toLowerCase() === 'bookshelves')
  const exclusiveShelfIdx = headers.findIndex(h => h.toLowerCase() === 'exclusive shelf')

  if (titleIdx === -1) return []

  const books: ReturnType<typeof parseGoodreadsCSV> = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line handling quoted values
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const title = values[titleIdx]?.replace(/"/g, '') || ''
    if (!title) continue

    // Strip Goodreads ISBN formatting: ="0123456789" -> 0123456789
    const cleanIsbn = (val: string | undefined) => {
      if (!val) return null
      return val.replace(/"/g, '').replace(/^=/, '').trim() || null
    }

    books.push({
      title,
      author: values[authorIdx]?.replace(/"/g, '') || 'Unknown',
      isbn: cleanIsbn(values[isbnIdx]),
      isbn13: cleanIsbn(values[isbn13Idx]),
      myRating: ratingIdx !== -1 ? parseInt(values[ratingIdx]?.replace(/"/g, '')) || null : null,
      dateRead: dateReadIdx !== -1 ? values[dateReadIdx]?.replace(/"/g, '') || null : null,
      bookshelves: bookshelvesIdx !== -1 ? values[bookshelvesIdx]?.replace(/"/g, '').toLowerCase() || null : null,
      exclusiveShelf: exclusiveShelfIdx !== -1 ? values[exclusiveShelfIdx]?.replace(/"/g, '').toLowerCase() || null : null
    })
  }

  return books
}

// Generate dedup key for a book (ISBN or title::author)
function getBookKey(book: { isbn?: string | null, isbn13?: string | null, title: string, author: string }): string {
  if (book.isbn13) return book.isbn13.toLowerCase()
  if (book.isbn) return book.isbn.toLowerCase()
  return `${book.title.toLowerCase()}::${book.author.toLowerCase()}`
}

// GET - Load user's stored Goodreads library (from CSV in storage)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has a stored CSV
    const { data: profile } = await adminClient
      .from('profiles')
      .select('goodreads_csv_path, goodreads_imported_isbns')
      .eq('id', user.id)
      .single()

    if (!profile?.goodreads_csv_path) {
      return NextResponse.json({ books: [], hasStoredCSV: false })
    }

    // Download CSV from storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('goodreads-imports')
      .download(profile.goodreads_csv_path)

    if (downloadError || !fileData) {
      console.error('[goodreads/library GET] Download error:', downloadError)
      return NextResponse.json({ books: [], hasStoredCSV: false })
    }

    // Parse CSV
    const csvContent = await fileData.text()
    const allBooks = parseGoodreadsCSV(csvContent)

    // Get imported ISBNs set
    const importedSet = new Set(profile.goodreads_imported_isbns || [])

    // Mark which books are already imported
    const books = allBooks.map(book => ({
      ...book,
      imported: importedSet.has(getBookKey(book))
    }))

    console.log('[goodreads/library GET] Returning', books.length, 'books,', importedSet.size, 'already imported')

    return NextResponse.json({ 
      books, 
      hasStoredCSV: true,
      totalBooks: books.length,
      importedCount: books.filter(b => b.imported).length
    })
  } catch (err: any) {
    console.error('Goodreads library GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - Upload new CSV to storage
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate it's a CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Validate CSV content
    const csvContent = await file.text()
    const books = parseGoodreadsCSV(csvContent)
    
    if (books.length === 0) {
      return NextResponse.json({ 
        error: "This doesn't look like a Goodreads export. Make sure you're uploading the CSV file from Goodreads." 
      }, { status: 400 })
    }

    // Upload to storage (overwrites existing)
    const storagePath = `${user.id}/${user.id}.csv`
    
    const { error: uploadError } = await adminClient.storage
      .from('goodreads-imports')
      .upload(storagePath, csvContent, {
        contentType: 'text/csv',
        upsert: true
      })

    if (uploadError) {
      console.error('[goodreads/library POST] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to store CSV' }, { status: 500 })
    }

    // Update profile with path
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ goodreads_csv_path: storagePath })
      .eq('id', user.id)

    if (updateError) {
      console.error('[goodreads/library POST] Profile update error:', updateError)
    }

    console.log('[goodreads/library POST] Stored CSV with', books.length, 'books')

    return NextResponse.json({ 
      success: true, 
      booksFound: books.length 
    })
  } catch (err: any) {
    console.error('Goodreads library POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH - Mark books as imported (add to imported ISBNs array)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { importedKeys } = await request.json()

    if (!Array.isArray(importedKeys) || importedKeys.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 })
    }

    // Get current imported ISBNs
    const { data: profile } = await adminClient
      .from('profiles')
      .select('goodreads_imported_isbns')
      .eq('id', user.id)
      .single()

    const currentImported = new Set(profile?.goodreads_imported_isbns || [])
    
    // Add new keys
    importedKeys.forEach((key: string) => currentImported.add(key))

    // Update profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ goodreads_imported_isbns: Array.from(currentImported) })
      .eq('id', user.id)

    if (updateError) {
      console.error('[goodreads/library PATCH] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, totalImported: currentImported.size })
  } catch (err: any) {
    console.error('Goodreads library PATCH error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
