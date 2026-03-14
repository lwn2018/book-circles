'use client'

import { useState } from 'react'
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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [wantsNewsletter, setWantsNewsletter] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Email not confirmed' 
        ? 'Check your inbox — we sent you a confirmation link.' 
        : error.message)
      setLoading(false)
    } else {
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
            pending_circle_code: circleCode || null,
            wants_newsletter: wantsNewsletter
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        trackEvent.signup(authData.user.id, email, 'direct', undefined)
      }

      if (authData.session) {
        if (circleCode) {
          window.location.href = `/join?code=${circleCode}`
        } else {
          window.location.href = '/onboarding/welcome'
        }
      } else {
        setError('Check your email for a confirmation link to complete signup!')
        setLoading(false)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white mb-2">Open a New Chapter</h1>
      <p className="text-gray-400 mb-8">Read, share, and let authors see the impact of their stories.</p>

      {/* Tab Toggle */}
      <div className="flex bg-[#1E1E1E] rounded-full p-1 mb-6">
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 py-3 rounded-full text-center font-medium transition-all ${
            activeTab === 'signin'
              ? 'bg-[#2A2A2A] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`flex-1 py-3 rounded-full text-center font-medium transition-all ${
            activeTab === 'signup'
              ? 'bg-[#55B2DE] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Join
        </button>
      </div>

      {/* Circle Invite Banner */}
      {circleCode && circleName && (
        <div className="flex items-center gap-3 bg-[#1E293B] rounded-xl p-4 mb-6">
          <div className="w-10 h-10 bg-[#55B2DE]/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1zm9-9c2.21 0 4-1.79 4-4s-1.79-4-4-4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Join to access {circleName}</p>
            <p className="text-gray-400 text-sm">Private book sharing circle invitation</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp}>
        {/* Name field (signup only) */}
        {activeTab === 'signup' && (
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#1E1E1E] text-white rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
              required
            />
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@pagepass.com"
            className="w-full bg-[#1E1E1E] text-white rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full bg-[#1E1E1E] text-white rounded-xl px-4 py-4 pr-12 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password (signup only) */}
        {activeTab === 'signup' && (
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-[#1E1E1E] text-white rounded-xl px-4 py-4 pr-12 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password (signin only) */}
        {activeTab === 'signin' && (
          <div className="mb-6 text-right">
            <Link href="/auth/reset-password" className="text-sm text-[#55B2DE] hover:text-[#6BC4EC]">
              Forgot password?
            </Link>
          </div>
        )}

        {/* Checkboxes (signup only) */}
        {activeTab === 'signup' && (
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-[#55B2DE] peer-checked:border-[#55B2DE] flex items-center justify-center">
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm">
                I agree to the <Link href="/terms" className="text-[#55B2DE] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#55B2DE] hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={wantsNewsletter}
                  onChange={(e) => setWantsNewsletter(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-[#55B2DE] peer-checked:border-[#55B2DE] flex items-center justify-center">
                  {wantsNewsletter && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm">
                I would like to receive news and updates from <span className="text-[#55B2DE]">PagePass</span>.
              </span>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#55B2DE] hover:bg-[#4A9FCB] text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? 'Please wait...' : activeTab === 'signin' ? 'Login' : 'Join PagePass'}
        </button>
      </form>

      {/* Encrypted Message */}
      <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
        </svg>
        <span>Your data is encrypted and secure</span>
      </div>
    </div>
  )
}
