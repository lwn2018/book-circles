import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

/**
 * Cron job to send handoff confirmation reminders
 * - After 48h with only one confirmation: send first reminder
 * - After 96h: send final reminder
 * - After that: stop (owner can follow up personally)
 */
export async function GET(request: Request) {
  // Verify this is being called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const now = new Date()
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000)

    // Get pending handoffs (not both confirmed)
    const { data: pendingHandoffs, error } = await supabase
      .from('handoff_confirmations')
      .select(`
        id,
        created_at,
        giver_id,
        receiver_id,
        giver_confirmed_at,
        receiver_confirmed_at,
        reminder_48h_sent_at,
        reminder_96h_sent_at,
        book:books(id, title),
        giver:giver_id(id, full_name),
        receiver:receiver_id(id, full_name)
      `)
      .is('both_confirmed_at', null)

    if (error) {
      console.error('Error fetching pending handoffs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = {
      checked: now.toISOString(),
      reminders48h: 0,
      reminders96h: 0,
      skipped: 0
    }

    for (const handoff of pendingHandoffs || []) {
      const createdAt = new Date(handoff.created_at)
      const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      // Determine who needs reminding
      const giverConfirmed = !!handoff.giver_confirmed_at
      const receiverConfirmed = !!handoff.receiver_confirmed_at

      // Skip if both confirmed or neither confirmed (no one to nudge)
      if ((giverConfirmed && receiverConfirmed) || (!giverConfirmed && !receiverConfirmed)) {
        results.skipped++
        continue
      }

      const unconfirmedUserId = giverConfirmed ? handoff.receiver_id : handoff.giver_id
      const confirmedUserName = giverConfirmed 
        ? (handoff.giver as any).full_name 
        : (handoff.receiver as any).full_name
      const bookTitle = (handoff.book as any).title

      // 96-hour reminder (final)
      if (hoursSinceCreated >= 96 && !handoff.reminder_96h_sent_at) {
        await createNotification({
          userId: unconfirmedUserId,
          type: 'pass_reminder',
          title: '⏰ Final handoff reminder',
          message: `Still need to confirm the handoff of "${bookTitle}". ${confirmedUserName} is waiting!`,
          link: `/handoff/${handoff.id}`,
          data: { handoffId: handoff.id }
        })

        await supabase
          .from('handoff_confirmations')
          .update({ reminder_96h_sent_at: now.toISOString() })
          .eq('id', handoff.id)

        results.reminders96h++
        console.log(`📧 Sent 96h reminder for handoff ${handoff.id}`)
      }
      // 48-hour reminder (first)
      else if (hoursSinceCreated >= 48 && !handoff.reminder_48h_sent_at) {
        await createNotification({
          userId: unconfirmedUserId,
          type: 'pass_reminder',
          title: '👋 Handoff confirmation needed',
          message: `${confirmedUserName} confirmed the handoff of "${bookTitle}". Can you confirm too?`,
          link: `/handoff/${handoff.id}`,
          data: { handoffId: handoff.id }
        })

        await supabase
          .from('handoff_confirmations')
          .update({ reminder_48h_sent_at: now.toISOString() })
          .eq('id', handoff.id)

        results.reminders48h++
        console.log(`📧 Sent 48h reminder for handoff ${handoff.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error: any) {
    console.error('Handoff reminders cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
