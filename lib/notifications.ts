import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import {
  sendEmail,
  bookReadyEmail,
  handoffConfirmationEmail,
  overdueReminderEmail,
  queueUpdateEmail
} from './email'

type NotificationType = 
  | 'book_ready' 
  | 'pass_reminder' 
  | 'book_due' 
  | 'book_returned' 
  | 'invite_accepted' 
  | 'new_book'
  | 'book_removed'

type NotificationData = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, any>
  sendEmail?: boolean
  emailTemplate?: string
  emailParams?: Record<string, any>
}

export async function createNotification(notification: NotificationData) {
  try {
    // Use service role to bypass RLS for notification inserts
    const adminClient = createServiceRoleClient()

    console.log('[createNotification] Creating for user:', notification.userId, 'type:', notification.type)

    // Insert notification
    const { data: createdNotification, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        action_url: notification.link || null,  // Bell expects action_url, not link
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('[createNotification] Failed:', error)
      return null
    }

    console.log('[createNotification] Success, id:', createdNotification?.id)

    // Send email if requested
    if (notification.sendEmail && notification.emailTemplate && notification.emailParams) {
      await sendEmailNotification(
        notification.userId,
        notification.emailTemplate,
        notification.emailParams
      )
    }

    return createdNotification
  } catch (error) {
    console.error('Notification error:', error)
    return null
  }
}

/**
 * Send an email notification to a user
 */
async function sendEmailNotification(
  userId: string,
  template: string,
  params: Record<string, any>
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get user's email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    
    if (!user?.email) {
      console.warn(`No email found for user ${userId}`)
      return
    }

    // Get user's profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const recipientName = profile?.full_name || 'there'

    // Build the base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pagepass.app'

    // Generate email based on template
    let emailContent
    switch (template) {
      case 'book_ready':
        emailContent = bookReadyEmail({
          recipientName,
          bookTitle: params.bookTitle,
          ownerName: params.ownerName,
          handoffUrl: `${baseUrl}${params.handoffUrl || '/handoffs'}`
        })
        break
      
      case 'handoff_confirmation':
        emailContent = handoffConfirmationEmail({
          recipientName,
          bookTitle: params.bookTitle,
          otherPersonName: params.otherPersonName,
          role: params.role,
          handoffUrl: `${baseUrl}${params.handoffUrl}`
        })
        break
      
      case 'overdue_reminder':
        emailContent = overdueReminderEmail({
          recipientName,
          bookTitle: params.bookTitle,
          dueDate: params.dueDate,
          daysOverdue: params.daysOverdue,
          actionUrl: `${baseUrl}${params.actionUrl || '/shelf'}`
        })
        break
      
      case 'queue_update':
        emailContent = queueUpdateEmail({
          recipientName,
          bookTitle: params.bookTitle,
          position: params.position,
          totalInQueue: params.totalInQueue,
          bookUrl: `${baseUrl}${params.bookUrl}`
        })
        break
      
      default:
        console.warn(`Unknown email template: ${template}`)
        return
    }

    // Send the email
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    })
  } catch (error) {
    console.error('Email notification error:', error)
    // Don't throw - email failures shouldn't break the notification system
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
