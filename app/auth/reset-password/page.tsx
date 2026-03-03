'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link!')
    }
  }

  // Input field classes for dark theme
  const inputClasses = "w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
  
  // Primary button gradient style
  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #F54900 0%, #FF6900 100%)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl p-8" style={{ backgroundColor: '#27272A' }}>
        <h1 className="text-3xl font-bold mb-2 text-center text-white">Reset Password</h1>
        <p className="text-zinc-400 text-center mb-6">
          Enter your email and we'll send you a reset link
        </p>

        <form onSubmit={handleResetRequest} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="p-3 bg-green-900/30 border border-green-700 text-green-300 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={primaryButtonStyle}
            className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-lg transition-opacity"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          Remember your password?{' '}
          <Link href="/auth/signin" className="text-orange-400 hover:text-orange-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
