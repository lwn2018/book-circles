import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { type, recipientId, bookId, senderId, metadata } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get book details
    const { data: book } = await supabase
      .from('books')
      .select('title, author')
      .eq('id', bookId)
      .single()

    // Get sender details if applicable
    let senderName = 'Someone'
    if (senderId) {
      const { data: sender } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', senderId)
        .single()
      senderName = sender?.full_name || 'Someone'
    }

    // Create notification message based on type
    let message = ''
    let actionUrl = ''

    switch (type) {
      case 'book_offered':
        message = `${senderName} is ready to pass "${book?.title}" to you! Accept to receive it.`
        actionUrl = `/dashboard/borrowed`
        break
      
      case 'handoff_accepted':
        message = `${senderName} has accepted "${book?.title}". Confirm when you hand it off.`
        actionUrl = `/dashboard/borrowed`
        break
      
      case 'handoff_confirmed':
        message = `You now have "${book?.title}" from ${senderName}. Enjoy!`
        actionUrl = `/dashboard/borrowed`
        break
      
      case 'queue_position_changed':
        message = `You're now #${metadata?.position} in line for "${book?.title}"`
        actionUrl = `/dashboard`
        break
      
      case 'book_available':
        message = `"${book?.title}" is now available to borrow!`
        actionUrl = `/dashboard`
        break
      
      default:
        message = `Update about "${book?.title}"`
    }

    // Store notification in database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type,
        message,
        book_id: bookId,
        sender_id: senderId,
        action_url: actionUrl,
        metadata,
        read: false
      })

    if (error) {
      console.error('Notification error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Send push notification or email if user preferences allow

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Notification GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
