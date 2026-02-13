import { NextRequest, NextResponse } from 'next/server'
import { resendConfirmationEmail } from '@/lib/email-confirmation'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await resendConfirmationEmail(email)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resend email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Resend confirmation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend email' },
      { status: 500 }
    )
  }
}
