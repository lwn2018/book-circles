'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

type Tab = 'signin' | 'signup'

export default function TabbedAuthForm({ 
  circleCode, 
  circleName,
  initialTab 
}: { 
  circleCode: string | null
  circleName: string | null
  initialTab?: Tab
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('Check your inbox — we sent you a confirmation link. Once confirmed, you\'re in!')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // If circleCode is present, redirect to join flow
      if (circleCode) {
        window.location.href = `/join?code=${circleCode}`
      } else {
        router.push('/circles')
        router.refresh()
      }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    try {
      // Store circle code in localStorage to persist through email confirmation
      if (circleCode) {
        localStorage.setItem('pendingCircleJoin', circleCode)
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            signup_source: circleCode ? 'circle_invite' : 'direct',
            pending_circle_code: circleCode || null
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Track signup
      if (authData.user) {
        trackEvent.signup(
          authData.user.id,
          email,
          'direct',
          undefined
        )
      }

      // Redirect to onboarding
      router.push('/onboarding/avatar')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div className="w-full relative">
      {/* Close button - only show if not from circle invite */}
      {!circleCode && (
        <button
          onClick={() => window.location.href = '/'}
          className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-3xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      )}

      {/* Circle Invitation Banner */}
      {circleCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 text-center font-medium">
            📚 {circleName ? `Join to access the ${circleName} circle` : 'Join to access your invited circle'}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 pb-3 text-lg font-semibold border-b-2 transition-colors ${
            activeTab === 'signin'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`flex-1 pb-3 text-lg font-semibold border-b-2 transition-colors ${
            activeTab === 'signup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Get Started
        </button>
      </div>

      {/* Sign In Form */}
      {activeTab === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Sign in to PagePass</h2>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      )}

      {/* Sign Up Form */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Create your account</h2>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agreedToTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required
            />
            <label htmlFor="agreedToTerms" className="text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
          >
            {loading ? 'Creating account...' : 'Get Started'}
          </button>
        </form>
      )}

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}
