import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logUserEvent } from '@/lib/gamification/events'
import { fetchBookCover } from '@/lib/fetch-book-cover'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient() // Bypasses RLS
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      author,
      isbn,
      isbn10,
      cover_url,
      cover_source,
      retail_price_cad,
      format,
      page_count,
      publish_date,
      publisher,
      description,
      language,
      metadata_sources,
      metadata_updated_at,
      selectedCircles,
      userCircles,
      source // 'manual', 'search', or 'barcode'
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Use default price if not provided
    const finalPrice = retail_price_cad || 20.0

    // Fetch cover from Google Books if not provided (for Goodreads imports)
    let finalCoverUrl = cover_url || null
    let finalCoverSource = cover_source || null
    
    if (!finalCoverUrl && (isbn || isbn10)) {
      try {
        const coverResult = await fetchBookCover(isbn || isbn10)
        if (coverResult) {
          finalCoverUrl = coverResult.url
          finalCoverSource = coverResult.source
        }
      } catch (err) {
        console.log('Cover fetch failed for ISBN:', isbn || isbn10, err)
        // Continue without cover - not a blocking error
      }
    }

    // Create the book (use service role to bypass RLS)
    const { data: book, error: bookError } = await adminClient
      .from('books')
      .insert({
        title: title.trim(),
        author: author?.trim() || null,
        isbn: isbn?.trim() || null,
        isbn10: isbn10 || null,
        cover_url: finalCoverUrl,
        cover_source: finalCoverSource,
        owner_id: user.id,
        status: 'available',
        retail_price_cad: finalPrice,
        format: format || null,
        page_count: page_count || null,
        publish_date: publish_date || null,
        publisher: publisher || null,
        description: description || null,
        language: language || null,
        metadata_sources: metadata_sources || [],
        metadata_updated_at: metadata_updated_at || new Date().toISOString()
      })
      .select()
      .single()

    if (bookError) {
      console.error('Book insert error:', bookError)
      return NextResponse.json(
        { error: bookError.message },
        { status: 500 }
      )
    }

    // Create visibility entries for all circles
    if (userCircles && userCircles.length > 0) {
      const visibilityEntries = userCircles.map((circle: any) => ({
        book_id: book.id,
        circle_id: circle.id,
        is_visible: selectedCircles?.includes(circle.id) ?? true
      }))

      const { error: visError } = await adminClient
        .from('book_circle_visibility')
        .insert(visibilityEntries)

      if (visError) {
        console.error('Visibility insert error:', visError)
        // Don't fail the whole request for this
      }
    }

    // Log gamification event
    await logUserEvent(user.id, 'book_added', {
      book_id: book.id,
      source: source || 'manual',
      retail_price_cad: finalPrice
    })

    return NextResponse.json({
      success: true,
      book
    })

  } catch (error: any) {
    console.error('Add book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add book' },
      { status: 500 }
    )
  }
}
