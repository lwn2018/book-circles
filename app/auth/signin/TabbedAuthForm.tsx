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

  // Input field classes for dark theme
  const inputClasses = "w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent transition-all"
  
  // Primary button gradient style
  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #55B2DE 0%, #4A9FCB 100%)',
  }

  return (
    <div className="w-full relative">
      {/* Close button - only show if not from circle invite */}
      {!circleCode && (
        <button
          onClick={() => window.location.href = '/'}
          className="absolute top-0 right-0 text-zinc-500 hover:text-white text-3xl leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      )}

      {/* Circle Invitation Banner */}
      {circleCode && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 73, 0, 0.15)', border: '1px solid rgba(245, 73, 0, 0.3)' }}>
          <p className="text-sm text-[#6BC4EC] text-center font-medium">
            📚 {circleName ? `Join to access the ${circleName} circle` : 'Join to access your invited circle'}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-700 mb-6">
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 pb-3 text-lg font-semibold border-b-2 transition-colors ${
            activeTab === 'signin'
              ? 'border-[#55B2DE] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`flex-1 pb-3 text-lg font-semibold border-b-2 transition-colors ${
            activeTab === 'signup'
              ? 'border-[#55B2DE] text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Get Started
        </button>
      </div>

      {/* Sign In Form */}
      {activeTab === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-white">Sign in to PagePass</h2>
          
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
              {error}
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={primaryButtonStyle}
            className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-lg transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link href="/auth/reset-password" className="text-sm text-[#55B2DE] hover:text-[#6BC4EC] transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>
      )}

      {/* Sign Up Form */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-white">Create your account</h2>
          
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClasses}
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
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
              className="mt-1 w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-[#55B2DE] accent-[#55B2DE]"
              required
            />
            <label htmlFor="agreedToTerms" className="text-sm text-zinc-400">
              I agree to the{' '}
              <Link href="/terms" className="text-[#55B2DE] hover:text-[#6BC4EC] transition-colors" target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#55B2DE] hover:text-[#6BC4EC] transition-colors" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={primaryButtonStyle}
            className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-lg transition-opacity"
          >
            {loading ? 'Creating account...' : 'Get Started'}
          </button>
        </form>
      )}

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t border-zinc-700">
        <div className="flex justify-center gap-4 text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-[#55B2DE] transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-[#55B2DE] transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}
