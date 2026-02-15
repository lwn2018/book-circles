import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Load user's stored Goodreads library
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient() // Bypass RLS to ensure we can read
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Use admin client to bypass RLS (same as POST)
    const { data: books, error } = await adminClient
      .from('goodreads_library')
      .select('*')
      .eq('user_id', user.id)
      .order('title')

    console.log('[goodreads/library GET] user:', user.id, 'books found:', books?.length, 'error:', error)

    if (error) {
      console.error('Failed to load goodreads library:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ books: books || [] })
  } catch (err: any) {
    console.error('Goodreads library GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - Save parsed Goodreads CSV (replace all - simpler and more reliable)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { books } = await request.json()
    
    if (!Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ error: 'No books provided' }, { status: 400 })
    }

    console.log('[goodreads/library POST] Saving', books.length, 'books for user', user.id)

    // First, get existing records to preserve imported_book_id
    const { data: existing } = await adminClient
      .from('goodreads_library')
      .select('title, author, imported_book_id, imported_at')
      .eq('user_id', user.id)

    // Create lookup map for previously imported books
    const importedMap = new Map<string, { imported_book_id: string, imported_at: string }>()
    if (existing) {
      existing.forEach(e => {
        if (e.imported_book_id) {
          const key = `${e.title?.toLowerCase()}|${e.author?.toLowerCase()}`
          importedMap.set(key, { imported_book_id: e.imported_book_id, imported_at: e.imported_at })
        }
      })
    }

    // Delete all existing records for this user
    const { error: deleteError } = await adminClient
      .from('goodreads_library')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[goodreads/library POST] Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to clear existing library' }, { status: 500 })
    }

    // Prepare records, preserving import status
    const records = books.map(book => {
      const key = `${book.title?.toLowerCase()}|${(book.author || '').toLowerCase()}`
      const imported = importedMap.get(key)
      return {
        user_id: user.id,
        title: book.title,
        author: book.author || null,
        isbn: book.isbn || null,
        isbn13: book.isbn13 || null,
        my_rating: book.myRating || null,
        date_read: book.dateRead || null,
        bookshelves: book.bookshelves || null,
        exclusive_shelf: book.exclusiveShelf || null,
        imported_book_id: imported?.imported_book_id || null,
        imported_at: imported?.imported_at || null,
        updated_at: new Date().toISOString()
      }
    })

    // Insert in batches of 100
    let savedCount = 0
    const batchSize = 100
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      const { error } = await adminClient
        .from('goodreads_library')
        .insert(batch)

      if (error) {
        console.error('[goodreads/library POST] Batch insert error:', error)
      } else {
        savedCount += batch.length
      }
    }

    console.log('[goodreads/library POST] Saved', savedCount, 'books')
    return NextResponse.json({ saved: savedCount })
  } catch (err: any) {
    console.error('Goodreads library POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH - Mark a book as imported
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { goodreadsId, importedBookId } = await request.json()

    const { error } = await supabase
      .from('goodreads_library')
      .update({ 
        imported_book_id: importedBookId,
        imported_at: new Date().toISOString()
      })
      .eq('id', goodreadsId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Goodreads library PATCH error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
