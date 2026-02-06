import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { notifyPassReminder, notifyBookDueSoon } from '@/lib/notifications'

export async function GET(request: Request) {
  // Verify this is coming from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const now = new Date()

    // Check for pass reminders (24 hours before timeout)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const { data: booksNeedingReminder } = await supabase
      .from('books')
      .select(`
        id,
        title,
        next_recipient,
        offered_at
      `)
      .eq('status', 'ready_for_next')
      .not('next_recipient', 'is', null)
      .gte('offered_at', fortyEightHoursAgo.toISOString())
      .lt('offered_at', twentyFourHoursFromNow.toISOString())

    // Send pass reminders
    for (const book of booksNeedingReminder || []) {
      if (book.next_recipient && book.offered_at) {
        const offeredTime = new Date(book.offered_at).getTime()
        const hoursElapsed = Math.floor((now.getTime() - offeredTime) / (1000 * 60 * 60))
        const hoursRemaining = 48 - hoursElapsed

        if (hoursRemaining <= 24 && hoursRemaining > 0) {
          await notifyPassReminder(book.next_recipient, book.id, book.title, hoursRemaining)
        }
      }
    }

    // Check for books due in 2 days
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const { data: booksDueSoon } = await supabase
      .from('books')
      .select(`
        id,
        title,
        current_borrower_id,
        due_date
      `)
      .eq('status', 'borrowed')
      .not('current_borrower_id', 'is', null)
      .gte('due_date', twoDaysFromNow.toISOString())
      .lt('due_date', threeDaysFromNow.toISOString())

    // Send due soon reminders
    for (const book of booksDueSoon || []) {
      if (book.current_borrower_id && book.due_date) {
        const dueDate = new Date(book.due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        await notifyBookDueSoon(book.current_borrower_id, book.id, book.title, daysUntilDue)
      }
    }

    return NextResponse.json({
      success: true,
      passReminders: booksNeedingReminder?.length || 0,
      dueSoonReminders: booksDueSoon?.length || 0
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check notifications' },
      { status: 500 }
    )
  }
}
