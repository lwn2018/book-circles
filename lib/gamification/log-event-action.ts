'use server'

import { logUserEvent, type EventType, type EventMetadata } from './events'

/**
 * Server action wrapper for logging user events from client components
 */
export async function logEvent(
  userId: string,
  eventType: EventType,
  metadata: EventMetadata = {}
) {
  return await logUserEvent(userId, eventType, metadata)
}
