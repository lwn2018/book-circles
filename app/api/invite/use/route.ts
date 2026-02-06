import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    // Get invite
    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Only decrement if uses_remaining is not -1 (unlimited)
    if (invite.uses_remaining !== -1 && invite.uses_remaining > 0) {
      const { error: updateError } = await supabase
        .from('invites')
        .update({ uses_remaining: invite.uses_remaining - 1 })
        .eq('code', code.toUpperCase())

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to use invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to use invite' },
      { status: 500 }
    )
  }
}
