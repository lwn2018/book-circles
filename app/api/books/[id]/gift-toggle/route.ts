import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookId } = await params
  const { gift } = await request.json()

  try {
    const adminClient = createServiceRoleClient()

    // Get the book and verify ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('owner_id, status')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can change gift status' }, { status: 403 })
    }

    // Update gift status
    const { error: updateError } = await adminClient
      .from('books')
      .update({ gift_on_borrow: gift })
      .eq('id', bookId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      gift_on_borrow: gift,
      message: gift ? 'Book marked as gift - next borrower will keep it!' : 'Gift status removed'
    })
  } catch (error: any) {
    console.error('Gift toggle error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}
