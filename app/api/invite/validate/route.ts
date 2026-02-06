import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided' })
  }

  const supabase = await createServerSupabaseClient()

  try {
    // Check if invite exists and is valid
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        creator:created_by(full_name, email)
      `)
      .eq('code', code.toUpperCase())
      .single()

    if (error || !invite) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' })
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invite code has expired' })
    }

    // Check if uses remaining
    if (invite.uses_remaining === 0) {
      return NextResponse.json({ valid: false, error: 'Invite code has been fully used' })
    }

    return NextResponse.json({
      valid: true,
      invite: {
        code: invite.code,
        creatorName: invite.creator?.full_name || 'Someone',
        usesRemaining: invite.uses_remaining
      }
    })
  } catch (error: any) {
    console.error('Failed to validate invite:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite' },
      { status: 500 }
    )
  }
}
