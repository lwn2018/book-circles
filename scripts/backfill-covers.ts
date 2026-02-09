/**
 * One-time backfill script to fetch covers for existing books
 * Run with: npx tsx scripts/backfill-covers.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { fetchBookCover, isValidISBN } from '../lib/fetch-book-cover'

// Load .env.local explicitly
config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Book = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
}

async function backfillCovers() {
  console.log('🔍 Fetching books without covers...\n')

  // Get all books missing covers
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, isbn, cover_url')
    .or('cover_url.is.null,cover_url.eq.')
    .order('title')

  if (error) {
    console.error('❌ Error fetching books:', error)
    process.exit(1)
  }

  if (!books || books.length === 0) {
    console.log('✅ No books need cover art!')
    return
  }

  console.log(`Found ${books.length} books without covers\n`)

  const results = {
    success: [] as { book: Book; source: string }[],
    failed: [] as Book[],
    fixed_isbn: [] as { book: Book; old_isbn: string; new_isbn: string }[]
  }

  for (let i = 0; i < books.length; i++) {
    const book = books[i]
    console.log(`📖 [${i + 1}/${books.length}] Processing: ${book.title}${book.author ? ` by ${book.author}` : ''}`)
    
    // Add a small delay to be respectful to APIs
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Special handling for known bad ISBNs
    if (book.title === 'The Nightingale' && book.author?.includes('Hannah')) {
      console.log('  ⚠️  Invalid ISBN detected, searching by title+author...')
      const result = await fetchBookCover(null, 'The Nightingale', 'Kristin Hannah')
      
      if (result.coverUrl) {
        // Also try to get correct ISBN from Google Books
        try {
          const apiKey = process.env.GOOGLE_BOOKS_API_KEY
          const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:The+Nightingale+inauthor:Kristin+Hannah${apiKey ? `&key=${apiKey}` : ''}`
          
          const response = await fetch(url)
          const data = await response.json()
          if (data.items && data.items[0]) {
            const volume = data.items[0].volumeInfo
            const correctISBN = volume.industryIdentifiers?.find((id: any) => 
              id.type === 'ISBN_13' || id.type === 'ISBN_10'
            )?.identifier
            
            await supabase
              .from('books')
              .update({ 
                cover_url: result.coverUrl,
                isbn: correctISBN || book.isbn
              })
              .eq('id', book.id)
            
            console.log(`  ✅ Updated cover + ISBN (${correctISBN}) via ${result.source}`)
            results.fixed_isbn.push({
              book,
              old_isbn: book.isbn || 'none',
              new_isbn: correctISBN || 'none'
            })
            results.success.push({ book, source: result.source! })
            continue
          }
        } catch (err) {
          console.error('  Failed to fetch correct ISBN:', err)
        }
        
        await supabase
          .from('books')
          .update({ cover_url: result.coverUrl })
          .eq('id', book.id)
        
        console.log(`  ✅ Updated cover via ${result.source}`)
        results.success.push({ book, source: result.source! })
        continue
      }
    }

    if (book.title === 'The River Is Waiting' && book.author?.includes('Lamb')) {
      console.log('  ⚠️  Invalid ISBN detected, searching by title+author...')
      const result = await fetchBookCover(null, 'The River Is Waiting', 'Wally Lamb')
      
      if (result.coverUrl) {
        try {
          const apiKey = process.env.GOOGLE_BOOKS_API_KEY
          const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:The+River+Is+Waiting+inauthor:Wally+Lamb${apiKey ? `&key=${apiKey}` : ''}`
          
          const response = await fetch(url)
          const data = await response.json()
          if (data.items && data.items[0]) {
            const volume = data.items[0].volumeInfo
            const correctISBN = volume.industryIdentifiers?.find((id: any) => 
              id.type === 'ISBN_13' || id.type === 'ISBN_10'
            )?.identifier
            
            await supabase
              .from('books')
              .update({ 
                cover_url: result.coverUrl,
                isbn: correctISBN || book.isbn
              })
              .eq('id', book.id)
            
            console.log(`  ✅ Updated cover + ISBN (${correctISBN}) via ${result.source}`)
            results.fixed_isbn.push({
              book,
              old_isbn: book.isbn || 'none',
              new_isbn: correctISBN || 'none'
            })
            results.success.push({ book, source: result.source! })
            continue
          }
        } catch (err) {
          console.error('  Failed to fetch correct ISBN:', err)
        }
        
        await supabase
          .from('books')
          .update({ cover_url: result.coverUrl })
          .eq('id', book.id)
        
        console.log(`  ✅ Updated cover via ${result.source}`)
        results.success.push({ book, source: result.source! })
        continue
      }
    }

    // Normal flow: try ISBN first if valid
    if (isValidISBN(book.isbn)) {
      const result = await fetchBookCover(book.isbn, book.title, book.author)
      
      if (result.coverUrl) {
        await supabase
          .from('books')
          .update({ cover_url: result.coverUrl })
          .eq('id', book.id)
        
        console.log(`  ✅ Updated via ${result.source}`)
        results.success.push({ book, source: result.source! })
        continue
      }
    } else if (book.isbn) {
      console.log(`  ⚠️  Invalid ISBN: ${book.isbn}`)
    }

    // Fallback to title+author search
    if (book.title) {
      const result = await fetchBookCover(null, book.title, book.author)
      
      if (result.coverUrl) {
        await supabase
          .from('books')
          .update({ cover_url: result.coverUrl })
          .eq('id', book.id)
        
        console.log(`  ✅ Updated via ${result.source}`)
        results.success.push({ book, source: result.source! })
        continue
      }
    }

    console.log('  ❌ No cover found')
    results.failed.push(book)
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 BACKFILL SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${results.success.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log(`🔧 Fixed ISBNs: ${results.fixed_isbn.length}`)

  if (results.success.length > 0) {
    console.log('\n✅ Successfully updated:')
    for (const { book, source } of results.success) {
      console.log(`   - ${book.title} (${source})`)
    }
  }

  if (results.fixed_isbn.length > 0) {
    console.log('\n🔧 Fixed ISBNs:')
    for (const { book, old_isbn, new_isbn } of results.fixed_isbn) {
      console.log(`   - ${book.title}: ${old_isbn} → ${new_isbn}`)
    }
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Still need covers:')
    for (const book of results.failed) {
      console.log(`   - ${book.title}${book.author ? ` by ${book.author}` : ''}`)
    }
  }

  console.log('\n✨ Backfill complete!')
}

backfillCovers().catch(console.error)
