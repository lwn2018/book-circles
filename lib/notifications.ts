import { createServerSupabaseClient } from './supabase-server'

type NotificationType = 
  | 'book_ready' 
  | 'pass_reminder' 
  | 'book_due' 
  | 'book_returned' 
  | 'invite_accepted' 
  | 'new_book'

type NotificationData = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, any>
  sendEmail?: boolean
}

export async function createNotification(notification: NotificationData) {
  try {
    const supabase = await createServerSupabaseClient()

    // Insert notification
    const { data: createdNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        data: notification.data || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    // TODO: Send email if requested and user has email notifications enabled
    // This will be implemented in the next step

    return createdNotification
  } catch (error) {
    console.error('Notification error:', error)
    return null
  }
}

// Convenience functions for specific notification types

export async function notifyBookReady(userId: string, bookId: string, bookTitle: string) {
  return createNotification({
    userId,
    type: 'book_ready',
    title: '📚 Your Book is Ready!',
    message: `"${bookTitle}" is now available for you to borrow.`,
    link: `/dashboard/offers`,
    data: { bookId },
    sendEmail: true
  })
}

export async function notifyPassReminder(userId: string, bookId: string, bookTitle: string, hoursRemaining: number) {
  return createNotification({
    userId,
    type: 'pass_reminder',
    title: '⏰ Book Offer Expires Soon',
    message: `You have ${hoursRemaining} hours to accept or pass on "${bookTitle}". After that, it will automatically pass.`,
    link: `/dashboard/offers`,
    data: { bookId },
    sendEmail: true
  })
}

export async function notifyBookDueSoon(userId: string, bookId: string, bookTitle: string, daysUntilDue: number) {
  return createNotification({
    userId,
    type: 'book_due',
    title: '📅 Book Due Soon',
    message: `"${bookTitle}" is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Remember to return it!`,
    link: `/dashboard/borrowed`,
    data: { bookId },
    sendEmail: true
  })
}

export async function notifyBookReturned(userId: string, bookId: string, bookTitle: string, borrowerName: string) {
  return createNotification({
    userId,
    type: 'book_returned',
    title: '↩️ Book Returned',
    message: `${borrowerName} returned "${bookTitle}".`,
    link: `/library`,
    data: { bookId }
  })
}

export async function notifyInviteAccepted(userId: string, inviteeEmail: string) {
  return createNotification({
    userId,
    type: 'invite_accepted',
    title: '🎉 Invite Accepted!',
    message: `${inviteeEmail} signed up using your invite code.`,
    link: `/admin/signup-analytics`,
    data: { inviteeEmail }
  })
}

export async function notifyNewBook(userId: string, bookId: string, bookTitle: string, author: string | null, circleId: string, circleName: string, addedBy: string) {
  return createNotification({
    userId,
    type: 'new_book',
    title: '✨ New Book Added',
    message: `${addedBy} added "${bookTitle}"${author ? ` by ${author}` : ''} to ${circleName}.`,
    link: `/circles/${circleId}`,
    data: { bookId, circleId }
  })
}
