import { Resend } from 'resend'

// Only initialize Resend if API key is present (avoid build-time errors)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

type EmailOptions = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'PagePass <notifications@pagepass.app>',
      to,
      subject,
      html
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

// Email templates
export function handoffInitiatedEmailOwner(
  ownerName: string,
  borrowerName: string,
  bookTitle: string,
  handoffUrl: string
) {
  return {
    subject: `Time to hand off "${bookTitle}"!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a;">📚 Time to hand off "${bookTitle}"!</h1>
          <p style="margin: 0; font-size: 16px; color: #666;">
            ${borrowerName} is ready to borrow <strong>${bookTitle}</strong> from you.
          </p>
        </div>
        
        <p style="font-size: 16px; margin: 24px 0;">
          Once you've given the book to ${borrowerName}, confirm the handoff:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${handoffUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirm Handoff
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 14px; color: #999; margin: 16px 0 0 0;">
          PagePass — Book sharing made simple<br>
          <a href="https://pagepass.app" style="color: #2563eb; text-decoration: none;">pagepass.app</a>
        </p>
      </body>
      </html>
    `
  }
}

export function handoffInitiatedEmailBorrower(
  ownerName: string,
  borrowerName: string,
  bookTitle: string,
  handoffUrl: string,
  ownerContact?: { type: 'email' | 'phone' | null, value: string | null }
) {
  // Build contact section if contact info is available
  let contactSection = ''
  if (ownerContact?.value && ownerContact?.type) {
    const contactIcon = ownerContact.type === 'phone' ? '📱' : '📧'
    const contactLink = ownerContact.type === 'phone' 
      ? `sms:${ownerContact.value.replace(/\D/g, '')}`
      : `mailto:${ownerContact.value}`
    
    contactSection = `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af; font-weight: 600;">
            Contact ${ownerName}:
          </p>
          <a href="${contactLink}" style="color: #2563eb; text-decoration: none; font-size: 16px;">
            ${contactIcon} ${ownerContact.value}
          </a>
        </div>
    `
  }

  return {
    subject: `Time to pick up "${bookTitle}" from ${ownerName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a;">📚 Time to pick up "${bookTitle}"!</h1>
          <p style="margin: 0; font-size: 16px; color: #666;">
            You're borrowing <strong>${bookTitle}</strong> from ${ownerName}.
          </p>
        </div>
        
        ${contactSection}
        
        <p style="font-size: 16px; margin: 24px 0;">
          Coordinate with ${ownerName} to pick up the book, then confirm once you have it:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${handoffUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Handoff Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 14px; color: #999; margin: 16px 0 0 0;">
          PagePass — Book sharing made simple<br>
          <a href="https://pagepass.app" style="color: #2563eb; text-decoration: none;">pagepass.app</a>
        </p>
      </body>
      </html>
    `
  }
}
