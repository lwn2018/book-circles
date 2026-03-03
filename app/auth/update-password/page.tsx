'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    })
  }, [supabase.auth])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Success! Redirect to circles
      router.push('/circles')
    }
  }

  // Input field classes for dark theme
  const inputClasses = "w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
  
  // Primary button gradient style
  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #F54900 0%, #FF6900 100%)',
  }

  if (!isValidSession && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#121212' }}>
        <div className="text-center">
          <p className="text-zinc-400">Validating reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl p-8" style={{ backgroundColor: '#27272A' }}>
        <h1 className="text-3xl font-bold mb-2 text-center text-white">Set New Password</h1>
        <p className="text-zinc-400 text-center mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="At least 6 characters"
              required
              disabled={!isValidSession || loading}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClasses}
              placeholder="Confirm your password"
              required
              disabled={!isValidSession || loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={!isValidSession || loading}
            style={primaryButtonStyle}
            className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-lg transition-opacity"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
