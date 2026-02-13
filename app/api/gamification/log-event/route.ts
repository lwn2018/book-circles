import { NextRequest, NextResponse } from 'next/server'
import { logUserEvent, type EventType, type EventMetadata } from '@/lib/gamification/events'

export async function POST(request: NextRequest) {
  try {
    const { userId, eventType, metadata } = await request.json()

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'Missing userId or eventType' },
        { status: 400 }
      )
    }

    const result = await logUserEvent(
      userId,
      eventType as EventType,
      metadata as EventMetadata
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Event logging API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log event' },
      { status: 500 }
    )
  }
}
