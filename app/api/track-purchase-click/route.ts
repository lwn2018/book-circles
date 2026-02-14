import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logUserEvent } from '@/lib/gamification/events'

/**
 * Track a purchase click before redirecting to Amazon
 * Called before opening Amazon affiliate link
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const {
      book_id,
      isbn,
      book_title,
      book_author,
      click_context,
      circle_id,
      search_query,
      affiliate_url
    } = body

    // Validate required fields
    if (!book_title || !click_context || !affiliate_url) {
      return NextResponse.json(
        { error: 'Missing required fields: book_title, click_context, affiliate_url' },
        { status: 400 }
      )
    }

    // Check if user previously borrowed this book
    let previously_borrowed = false
    if (book_id) {
      const { data: previousBorrow } = await supabase
        .from('borrow_history')
        .select('id')
        .eq('borrower_id', user.id)
        .eq('book_id', book_id)
        .limit(1)
      
      previously_borrowed = (previousBorrow?.length ?? 0) > 0
    }

    // Log the click
    const { error: insertError } = await supabase
      .from('purchase_clicks')
      .insert({
        user_id: user.id,
        book_id: book_id || null,
        isbn: isbn || null,
        book_title,
        book_author: book_author || null,
        click_context,
        previously_borrowed,
        circle_id: circle_id || null,
        search_query: search_query || null,
        affiliate_tag: 'pagepass04-20',
        affiliate_url
      })

    if (insertError) {
      console.error('Failed to log purchase click:', insertError)
      // Don't block the user - still return the URL
    }

    // Log affiliate_click event (spec requirement)
    await logUserEvent(user.id, 'affiliate_click', {
      book_id: book_id || undefined,
      context: click_context as 'unavailable' | 'post_read' | 'browse' | 'gift',
      previously_borrowed
    })

    // Return the Amazon URL
    return NextResponse.json({ 
      success: true,
      url: affiliate_url 
    })
  } catch (error: any) {
    console.error('Track purchase click error:', error)
    // Don't block the user - return a fallback
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
