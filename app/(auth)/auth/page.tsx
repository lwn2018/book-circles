'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite') || searchParams.get('code')
  const circleName = searchParams.get('circle')
  
  const [tab, setTab] = useState<'login' | 'join'>('join')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!agreedToTerms) {
      setError('You must agree to the terms and privacy policy')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      // Store invite code in localStorage if present
      if (inviteCode) {
        localStorage.setItem('pagepass_invite_code', inviteCode)
        if (circleName) {
          localStorage.setItem('pagepass_invite_circle_name', circleName)
        }
      }

      // Redirect to onboarding
      router.push('/onboarding/avatar')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      // Check if they have an invite code pending
      if (inviteCode) {
        // Store invite code and redirect to join flow
        localStorage.setItem('pagepass_invite_code', inviteCode)
        if (circleName) {
          localStorage.setItem('pagepass_invite_circle_name', circleName)
        }
        router.push(`/circles/join?code=${inviteCode}`)
      } else {
        // Normal login - go to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      {/* Logo and Tagline */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PagePass</h1>
        <p className="text-gray-600">Share books with your friends</p>
        
        {inviteCode && circleName && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              You've been invited to join <strong>{circleName}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setTab('login')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            tab === 'login'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setTab('join')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            tab === 'join'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Join
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Join Form */}
      {tab === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4 bg-white p-6 rounded-lg shadow-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the PagePass{' '}
                <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  terms of service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  privacy policy
                </Link>
              </span>
            </label>

            <p className="text-xs text-gray-600 ml-6">
              Your reading data is yours. We never sell individual data to anyone.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Creating account...' : 'Join PagePass'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already a member?{' '}
            <button
              type="button"
              onClick={() => setTab('login')}
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-lg shadow-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="text-right">
            <Link
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setTab('join')}
              className="text-blue-600 font-medium hover:underline"
            >
              Join
            </button>
          </p>
        </form>
      )}
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-center mt-16">Loading...</div>}>
      <AuthForm />
    </Suspense>
  )
}
