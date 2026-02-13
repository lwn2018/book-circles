'use client'

import { useState } from 'react'

export default function EmailConfirmationBanner({
  email,
  onResend
}: {
  email: string
  onResend?: () => Promise<void>
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async () => {
    if (!onResend) return
    
    setSending(true)
    try {
      await onResend()
      setSent(true)
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      console.error('Failed to resend:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Please confirm your email</strong> to unlock all features.
            Check your inbox at <strong>{email}</strong> for a confirmation link.
          </p>
          {onResend && (
            <div className="mt-2">
              {sent ? (
                <span className="text-sm text-green-700 font-medium">
                  ✓ Email sent! Check your inbox.
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="text-sm text-yellow-800 font-medium hover:text-yellow-900 underline disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
