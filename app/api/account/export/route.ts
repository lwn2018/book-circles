import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Books owned
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('owner_id', user.id)

    // 3. Circle memberships
    const { data: circleMemberships } = await supabase
      .from('circle_members')
      .select(`
        joined_at,
        circles (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', user.id)

    // 4. Borrow history (as borrower)
    const { data: borrowHistory } = await supabase
      .from('borrow_history')
      .select(`
        borrowed_at,
        returned_at,
        due_date,
        books (
          id,
          title,
          author
        )
      `)
      .eq('borrower_id', user.id)

    // 5. Books lent out (as owner)
    const { data: lendingHistory } = await supabase
      .from('borrow_history')
      .select(`
        borrowed_at,
        returned_at,
        due_date,
        borrower_id,
        books!inner (
          id,
          title,
          author,
          owner_id
        )
      `)
      .eq('books.owner_id', user.id)

    // 6. Queue entries
    const { data: queueEntries } = await supabase
      .from('book_queue')
      .select(`
        position,
        joined_queue_at,
        pass_count,
        books (
          id,
          title,
          author
        )
      `)
      .eq('user_id', user.id)

    // 7. Beta feedback submitted
    const { data: feedback } = await supabase
      .from('beta_feedback')
      .select('*')
      .eq('user_id', user.id)

    // 8. Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    // Package everything
    const exportData = {
      export_date: new Date().toISOString(),
      export_version: '1.0',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || {},
      books: books || [],
      circle_memberships: circleMemberships || [],
      borrow_history: borrowHistory || [],
      lending_history: lendingHistory || [],
      queue_entries: queueEntries || [],
      feedback: feedback || [],
      notifications: notifications || []
    }

    // Return as JSON download
    const filename = `pagepass-data-export-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    )
  }
}
