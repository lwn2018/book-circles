import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const adminClient = createServiceRoleClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { confirmation } = body

    // Verify confirmation text
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text must be "DELETE"' },
        { status: 400 }
      )
    }

    // Double-check for active obligations
    const { data: borrowedBooks } = await supabase
      .from('books')
      .select('id')
      .eq('current_borrower_id', user.id)
      .in('status', ['borrowed', 'in_transit'])

    const { data: lentBooks } = await supabase
      .from('books')
      .select('id')
      .eq('owner_id', user.id)
      .in('status', ['borrowed', 'in_transit'])

    const { data: pendingHandoffs } = await supabase
      .from('handoff_confirmations')
      .select('id')
      .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .is('both_confirmed_at', null)

    if ((borrowedBooks?.length || 0) > 0 || (lentBooks?.length || 0) > 0 || (pendingHandoffs?.length || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with active borrows or handoffs' },
        { status: 400 }
      )
    }

    // BEGIN SOFT DELETE PROCESS

    const now = new Date().toISOString()

    // 1. Soft-delete profile (set deleted_at)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ 
        deleted_at: now,
        full_name: 'Deleted User' // Anonymize immediately
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Failed to soft-delete profile:', profileError)
      throw new Error('Failed to delete profile')
    }

    // 2. Remove from all circles
    const { error: circleError } = await adminClient
      .from('circle_members')
      .delete()
      .eq('user_id', user.id)

    if (circleError) {
      console.error('Failed to remove from circles:', circleError)
      // Continue anyway
    }

    // 3. Hide all books from all circles (set all to hidden)
    const { data: userBooks } = await supabase
      .from('books')
      .select('id')
      .eq('owner_id', user.id)

    if (userBooks && userBooks.length > 0) {
      const bookIds = userBooks.map(b => b.id)
      
      // Get all circles to hide books from
      const { data: allCircles } = await supabase
        .from('circles')
        .select('id')

      if (allCircles && allCircles.length > 0) {
        const hideEntries = allCircles.flatMap(circle =>
          bookIds.map(bookId => ({
            book_id: bookId,
            circle_id: circle.id,
            is_visible: false
          }))
        )

        // Upsert to hide books
        const { error: hideError } = await adminClient
          .from('book_circle_visibility')
          .upsert(hideEntries, { onConflict: 'book_id,circle_id' })

        if (hideError) {
          console.error('Failed to hide books:', hideError)
          // Continue anyway
        }
      }
    }

    // 4. Anonymize name in borrow history (already done in profile, but update any existing records)
    // Note: Borrow history references profiles.full_name via foreign key, so it will auto-update

    // 5. Sign out the user
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('Failed to sign out:', signOutError)
      // Continue anyway - account is soft-deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. Your data will be permanently removed in 30 days.'
    })

  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
