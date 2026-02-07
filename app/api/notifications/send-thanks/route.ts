import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { recipientId, bookTitle } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get sender info
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Send thank you notification
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'book_returned',
        title: '💝 Thank you!',
        message: `${senderProfile?.full_name || 'Someone'} says thanks for "${bookTitle}"!`,
        data: { bookTitle }
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send thanks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
