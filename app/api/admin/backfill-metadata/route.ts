import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchBookMetadata, delay } from '@/lib/bookMetadata'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is beta tester or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_beta_tester')
      .eq('id', user.id)
      .single()

    if (!profile?.is_beta_tester) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Query books that need metadata backfill
    const { data: books, error: queryError } = await supabase
      .from('books')
      .select('id, isbn, isbn10, title, author, cover_url, cover_source, retail_price_cad')
      .or('cover_url.is.null,cover_source.is.null,retail_price_cad.is.null')
      .order('created_at', { ascending: false })

    if (queryError) throw queryError

    const results = {
      total: books?.length || 0,
      processed: 0,
      coversFound: 0,
      coversBySource: {
        google: 0,
        isbndb: 0,
        openlibrary: 0
      },
      pricesFound: 0,
      descriptionsFound: 0,
      errors: [] as string[],
      noCoverISBNs: [] as string[]
    }

    if (!books || books.length === 0) {
      return NextResponse.json({
        message: 'No books need backfill',
        results
      })
    }

    // Process each book
    for (const book of books) {
      try {
        const isbn = book.isbn || book.isbn10
        if (!isbn) {
          results.errors.push(`Book ${book.id} has no ISBN`)
          continue
        }

        // Fetch comprehensive metadata
        const metadata = await fetchBookMetadata(isbn)

        // Build update object (only non-null values)
        const updates: any = {
          metadata_updated_at: metadata.metadata_updated_at
        }

        if (metadata.isbn13) updates.isbn = metadata.isbn13
        if (metadata.isbn10) updates.isbn10 = metadata.isbn10
        if (metadata.title) updates.title = metadata.title
        if (metadata.author) updates.author = metadata.author
        
        if (metadata.cover_url && !book.cover_url) {
          updates.cover_url = metadata.cover_url
          updates.cover_source = metadata.cover_source
          results.coversFound++
          if (metadata.cover_source) {
            results.coversBySource[metadata.cover_source]++
          }
        }

        if (metadata.retail_price_cad && !book.retail_price_cad) {
          updates.retail_price_cad = metadata.retail_price_cad
          results.pricesFound++
        }

        if (metadata.format) updates.format = metadata.format
        if (metadata.page_count) updates.page_count = metadata.page_count
        if (metadata.publish_date) updates.publish_date = metadata.publish_date
        if (metadata.publisher) updates.publisher = metadata.publisher
        
        if (metadata.description) {
          updates.description = metadata.description
          results.descriptionsFound++
        }
        
        if (metadata.language) updates.language = metadata.language
        if (metadata.metadata_sources.length > 0) {
          updates.metadata_sources = metadata.metadata_sources
        }

        // Update the book
        const { error: updateError } = await supabase
          .from('books')
          .update(updates)
          .eq('id', book.id)

        if (updateError) {
          results.errors.push(`Failed to update book ${book.id}: ${updateError.message}`)
        } else {
          results.processed++

          // Track ISBNs with no cover from any source
          if (!metadata.cover_url || metadata.cover_source === 'placeholder') {
            results.noCoverISBNs.push(isbn)
          }
        }

        // Rate limiting: 300ms between ISBNdb calls
        await delay(300)

      } catch (error: any) {
        results.errors.push(`Error processing book ${book.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: 'Backfill completed',
      results
    })

  } catch (error: any) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { error: error.message || 'Backfill failed' },
      { status: 500 }
    )
  }
}
