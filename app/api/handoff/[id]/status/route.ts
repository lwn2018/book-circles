import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: handoffId } = await params

  try {
    const { data: handoff, error } = await supabase
      .from('handoff_confirmations')
      .select('giver_id, receiver_id, giver_confirmed_at, receiver_confirmed_at, both_confirmed_at')
      .eq('id', handoffId)
      .single()

    if (error || !handoff) {
      return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
    }

    // Verify user is part of this handoff
    if (handoff.giver_id !== user.id && handoff.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const isGiver = handoff.giver_id === user.id
    const otherConfirmed = isGiver 
      ? !!handoff.receiver_confirmed_at 
      : !!handoff.giver_confirmed_at

    return NextResponse.json({
      bothConfirmed: !!handoff.both_confirmed_at,
      otherConfirmed,
      giverConfirmed: !!handoff.giver_confirmed_at,
      receiverConfirmed: !!handoff.receiver_confirmed_at
    })
  } catch (error: any) {
    console.error('Failed to fetch handoff status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
