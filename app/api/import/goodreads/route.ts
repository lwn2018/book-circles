import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logUserEvent } from '@/lib/gamification/events'
import { getRetailPrice } from '@/lib/gamification/retail-price'
import { sendEmail, queueUpdateEmail } from '@/lib/email'
import { fetchBookMetadata, delay } from '@/lib/bookMetadata'

export async function POST(request: NextRequest) {
  try {
    const { userId, fileUrl } = await request.json()

    if (!userId || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing userId or fileUrl' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Fetch the CSV file
    const response = await fetch(fileUrl)
    const csvText = await response.text()

    // Parse CSV (simple parsing - assumes Goodreads standard format)
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // Find column indices
    const titleIdx = headers.indexOf('Title')
    const authorIdx = headers.indexOf('Author')
    const isbnIdx = headers.indexOf('ISBN13') !== -1 ? headers.indexOf('ISBN13') : headers.indexOf('ISBN')
    const bindingIdx = headers.indexOf('Binding')

    if (titleIdx === -1) {
      throw new Error('Invalid CSV format - missing Title column')
    }

    // Get user's circles to create visibility entries
    const { data: userCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', userId)

    const circleIds = userCircles?.map(c => c.circle_id) || []

    let imported = 0
    let failed = 0
    const booksToImport = []

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))

        const title = values[titleIdx]?.trim()
        if (!title) continue

        const author = authorIdx !== -1 ? values[authorIdx]?.trim() : null
        const isbn = isbnIdx !== -1 ? values[isbnIdx]?.trim() : null
        const binding = bindingIdx !== -1 ? values[bindingIdx]?.trim() : null

        booksToImport.push({ title, author, isbn, binding })
      } catch (err) {
        console.error('Failed to parse row:', err)
        failed++
      }
    }

    // Import books in batches
    for (const bookData of booksToImport) {
      try {
        // Fetch comprehensive metadata if ISBN available
        let metadata: any = null
        if (bookData.isbn) {
          try {
            metadata = await fetchBookMetadata(bookData.isbn)
            // Rate limiting: 300ms between calls
            await delay(300)
          } catch (err) {
            console.error('Metadata fetch failed:', err)
          }
        }

        // Use metadata if available, otherwise use CSV data
        const retailPrice = metadata?.retail_price_cad || await getRetailPrice(bookData.isbn, bookData.binding)

        // Create book with full metadata
        const { data: book, error: bookError } = await supabase
          .from('books')
          .insert({
            title: metadata?.title || bookData.title,
            author: metadata?.author || bookData.author || null,
            isbn: metadata?.isbn13 || bookData.isbn || null,
            isbn10: metadata?.isbn10 || null,
            cover_url: metadata?.cover_url || null,
            cover_source: metadata?.cover_source || null,
            format: metadata?.format || bookData.binding || null,
            page_count: metadata?.page_count || null,
            publish_date: metadata?.publish_date || null,
            publisher: metadata?.publisher || null,
            description: metadata?.description || null,
            language: metadata?.language || null,
            metadata_sources: metadata?.metadata_sources || [],
            metadata_updated_at: metadata?.metadata_updated_at || new Date().toISOString(),
            owner_id: userId,
            status: 'available',
            retail_price_cad: retailPrice
          })
          .select()
          .single()

        if (bookError) {
          console.error('Failed to create book:', bookError)
          failed++
          continue
        }

        // Create visibility entries
        if (circleIds.length > 0) {
          const visibilityEntries = circleIds.map(circleId => ({
            book_id: book.id,
            circle_id: circleId,
            is_visible: true // Make all imported books visible by default
          }))

          await supabase
            .from('book_circle_visibility')
            .insert(visibilityEntries)
        }

        // Log gamification event
        await logUserEvent(userId, 'book_added', {
          book_id: book.id,
          source: 'goodreads',
          retail_price: retailPrice
        })

        imported++
      } catch (err) {
        console.error('Failed to import book:', err)
        failed++
      }
    }

    // Update import record
    await supabase
      .from('goodreads_imports')
      .update({
        status: 'completed',
        total_books: booksToImport.length,
        imported_books: imported,
        failed_books: failed,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('file_url', fileUrl)

    // Get user's email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    const userEmail = user?.email

    // Send completion email
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: 'Your Goodreads import is complete! 📚',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Import Complete!</h1>
              <p>Your Goodreads library has been imported to PagePass.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Successfully imported:</strong> ${imported} books</p>
                ${failed > 0 ? `<p style="margin: 10px 0 0 0;"><strong>Failed:</strong> ${failed} books</p>` : ''}
              </div>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/library" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Your Library
                </a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Happy reading!<br/>
                The PagePass Team
              </p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send completion email:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      total: booksToImport.length
    })
  } catch (error: any) {
    console.error('Goodreads import error:', error)

    // Mark import as failed
    try {
      const { userId, fileUrl } = await request.json()
      const supabase = await createServerSupabaseClient()

      await supabase
        .from('goodreads_imports')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('file_url', fileUrl)
    } catch (updateErr) {
      console.error('Failed to update import status:', updateErr)
    }

    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}
