import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleNoResponse } from '@/lib/queue-actions'

// This runs as a cron job to check for expired book offers (>48h)
export async function GET(request: Request) {
  // Verify this is being called by Vercel Cron (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Find books that have been in 'ready_for_next' for >48 hours
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    const { data: expiredOffers, error } = await supabase
      .from('books')
      .select('id, title, next_recipient, ready_for_pass_on_date')
      .eq('status', 'ready_for_next')
      .lt('ready_for_pass_on_date', fortyEightHoursAgo.toISOString())

    if (error) {
      console.error('Error fetching expired offers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      return NextResponse.json({ 
        message: 'No expired offers found',
        checked: new Date().toISOString()
      })
    }

    // Process each expired offer
    const results = []
    for (const book of expiredOffers) {
      if (book.next_recipient) {
        console.log(`⏰ Timeout: Book "${book.title}" (${book.id}) - no response from user ${book.next_recipient}`)
        
        // Call handleNoResponse which will:
        // - Increment pass count
        // - Move to next person in queue or back to owner
        const result = await handleNoResponse(book.id, book.next_recipient)
        
        results.push({
          bookId: book.id,
          title: book.title,
          userId: book.next_recipient,
          result
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} expired offers`,
      results,
      checked: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
