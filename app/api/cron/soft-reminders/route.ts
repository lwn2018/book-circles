import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Soft Reminder Cron Job
 * 
 * Sends gentle "Still enjoying?" reminders to borrowers:
 * - First reminder: 3 weeks (21 days) after borrow starts
 * - Subsequent reminders: Every 2 weeks (14 days) after last reminder
 * 
 * Run daily via Vercel cron
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    // Find books that need soft reminders
    // Books must be:
    // 1. Status = 'borrowed' (actively borrowed, not awaiting handoff)
    // 2. Either:
    //    - No last_soft_reminder_at AND borrowed_at >= 21 days ago
    //    - OR last_soft_reminder_at >= 14 days ago
    
    const threeWeeksAgo = new Date()
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
    
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const { data: booksNeedingReminders, error: queryError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        current_borrower_id,
        borrowed_at,
        last_soft_reminder_at
      `)
      .eq('status', 'borrowed')
      .not('current_borrower_id', 'is', null)
      .or(`last_soft_reminder_at.is.null,last_soft_reminder_at.lte.${twoWeeksAgo.toISOString()}`)

    if (queryError) {
      console.error('Failed to query books:', queryError)
      return NextResponse.json(
        { error: queryError.message },
        { status: 500 }
      )
    }

    if (!booksNeedingReminders || booksNeedingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No books need soft reminders',
        count: 0
      })
    }

    // Filter books based on timing logic
    const booksToRemind = booksNeedingReminders.filter(book => {
      const borrowedAt = new Date(book.borrowed_at)
      const lastReminder = book.last_soft_reminder_at 
        ? new Date(book.last_soft_reminder_at)
        : null

      // First reminder: 3 weeks after borrow
      if (!lastReminder) {
        return borrowedAt <= threeWeeksAgo
      }

      // Subsequent reminders: 2 weeks after last reminder
      return lastReminder <= twoWeeksAgo
    })

    const notifications = []
    const updates = []

    for (const book of booksToRemind) {
      // Create notification
      const notificationData = {
        user_id: book.current_borrower_id,
        type: 'soft_reminder',
        book_id: book.id,
        message: `Still enjoying ${book.title}?`,
        metadata: {
          action_buttons: [
            { label: 'Still reading', action: 'still_reading' },
            { label: 'Ready to pagepass', action: 'ready_to_pagepass' }
          ]
        },
        read: false
      }

      notifications.push(notificationData)

      // Update book's last_soft_reminder_at
      updates.push({
        book_id: book.id,
        timestamp: new Date().toISOString()
      })
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.error('Failed to create notifications:', notifError)
        return NextResponse.json(
          { error: notifError.message },
          { status: 500 }
        )
      }
    }

    // Update last_soft_reminder_at for all books
    for (const update of updates) {
      await supabase
        .from('books')
        .update({ last_soft_reminder_at: update.timestamp })
        .eq('id', update.book_id)
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${notifications.length} soft reminders`,
      count: notifications.length,
      books: booksToRemind.map(b => ({
        id: b.id,
        title: b.title,
        borrower_id: b.current_borrower_id
      }))
    })
  } catch (error: any) {
    console.error('Soft reminders cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process soft reminders' },
      { status: 500 }
    )
  }
}
