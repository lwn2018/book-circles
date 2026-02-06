import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Generate unique code
    let code = ''
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Generate 8-character code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      code = Array.from({ length: 8 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')

      // Check if code exists
      const { data: existing } = await supabase
        .from('invites')
        .select('code')
        .eq('code', code)
        .single()

      if (!existing) break
      attempts++
    }

    if (attempts === maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        code,
        created_by: user.id,
        uses_remaining: -1 // Unlimited by default
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ invite })
  } catch (error: any) {
    console.error('Failed to generate invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate invite' },
      { status: 500 }
    )
  }
}
