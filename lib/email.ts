import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type EmailNotification = {
  to: string
  subject: string
  html: string
}

/**
 * Send an email notification via Resend
 */
export async function sendEmail({ to, subject, html }: EmailNotification) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send')
    return { success: false, error: 'No API key' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'PagePass <notifications@pagepass.app>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

/**
 * Email template for book ready notification
 */
export function bookReadyEmail(params: {
  recipientName: string
  bookTitle: string
  ownerName: string
  handoffUrl: string
}) {
  const { recipientName, bookTitle, ownerName, handoffUrl } = params
  
  return {
    subject: `📚 Your book "${bookTitle}" is ready!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📚 Your book is ready!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px;">Great news! <strong>"${bookTitle}"</strong> is ready for you to pick up from ${ownerName}.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 16px;"><strong>Next step:</strong> Coordinate with ${ownerName} to arrange the handoff.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${handoffUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Handoff Details</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Once you've received the book, confirm the handoff in PagePass so the next reader knows it's with you.</p>
            
            <p style="font-size: 14px; color: #666;">Happy reading!</p>
            <p style="font-size: 14px; color: #666; margin: 0;"><strong>— The PagePass Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>PagePass • Share Books with Your Circle</p>
            <p><a href="https://pagepass.app" style="color: #667eea; text-decoration: none;">pagepass.app</a></p>
          </div>
        </body>
      </html>
    `
  }
}

/**
 * Email template for handoff confirmation request
 */
export function handoffConfirmationEmail(params: {
  recipientName: string
  bookTitle: string
  otherPersonName: string
  role: 'giver' | 'receiver'
  handoffUrl: string
}) {
  const { recipientName, bookTitle, otherPersonName, role, handoffUrl } = params
  
  const message = role === 'giver'
    ? `You're passing "${bookTitle}" to ${otherPersonName}.`
    : `${otherPersonName} is passing "${bookTitle}" to you.`
  
  return {
    subject: `👋 Confirm handoff: "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👋 Handoff Confirmation Needed</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px;">${message}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 16px;"><strong>Action required:</strong> Once you've ${role === 'giver' ? 'given' : 'received'} the book, confirm the handoff so ${otherPersonName} knows it's complete.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${handoffUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Confirm Handoff</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Both you and ${otherPersonName} need to confirm the handoff for the book to officially change hands.</p>
            
            <p style="font-size: 14px; color: #666; margin: 0;"><strong>— The PagePass Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>PagePass • Share Books with Your Circle</p>
            <p><a href="https://pagepass.app" style="color: #667eea; text-decoration: none;">pagepass.app</a></p>
          </div>
        </body>
      </html>
    `
  }
}

/**
 * Email template for overdue book reminder
 */
export function overdueReminderEmail(params: {
  recipientName: string
  bookTitle: string
  dueDate: string
  daysOverdue: number
  actionUrl: string
}) {
  const { recipientName, bookTitle, dueDate, daysOverdue, actionUrl } = params
  
  return {
    subject: `📅 Reminder: "${bookTitle}" is ${daysOverdue} days overdue`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 Gentle Reminder</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px;">Just a friendly reminder that <strong>"${bookTitle}"</strong> was due on ${dueDate} — that's ${daysOverdue} days ago.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>What would you like to do?</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Still reading? Extend your loan by 7 days</li>
                <li style="margin-bottom: 8px;">Finished? Return or pass it along</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Take Action</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">No pressure — we just want to make sure the book keeps moving through your circle!</p>
            
            <p style="font-size: 14px; color: #666; margin: 0;"><strong>— The PagePass Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>PagePass • Share Books with Your Circle</p>
            <p><a href="https://pagepass.app" style="color: #667eea; text-decoration: none;">pagepass.app</a></p>
          </div>
        </body>
      </html>
    `
  }
}

/**
 * Email template for queue position update
 */
export function queueUpdateEmail(params: {
  recipientName: string
  bookTitle: string
  position: number
  totalInQueue: number
  bookUrl: string
}) {
  const { recipientName, bookTitle, position, totalInQueue, bookUrl } = params
  
  return {
    subject: `📊 Queue update: "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 You've moved up in the queue!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px;">Good news! You're now <strong>position ${position} of ${totalInQueue}</strong> in the queue for <strong>"${bookTitle}"</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 16px;">${position === 1 ? "You're next! 🎉" : `${position - 1} reader(s) ahead of you.`}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Book</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">We'll notify you when it's your turn to read!</p>
            
            <p style="font-size: 14px; color: #666; margin: 0;"><strong>— The PagePass Team</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>PagePass • Share Books with Your Circle</p>
            <p><a href="https://pagepass.app" style="color: #667eea; text-decoration: none;">pagepass.app</a></p>
          </div>
        </body>
      </html>
    `
  }
}
