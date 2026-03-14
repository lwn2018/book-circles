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

  const EyeIcon = ({ show }: { show: boolean }) => (
    show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    )
  )

  return (
    <div className="w-full">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white mb-2">Open a New Chapter</h1>
      <p className="text-gray-400 mb-8">Read, share, and let authors see the impact of their stories.</p>

      {/* Tab Toggle */}
      <div className="flex bg-[#1E1E1E] rounded-full p-1 mb-8">
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 py-3 rounded-full text-center font-medium transition-all ${
            activeTab === 'signin'
              ? 'bg-[#55B2DE] text-white'
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

      {/* Circle Invite Banner (both tabs) */}
      {circleCode && circleName && (
        <div className="flex items-center gap-3 bg-[#1E293B] rounded-xl p-4 mb-6">
          <div className="w-10 h-10 bg-[#55B2DE]/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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

      {/* LOGIN FORM */}
      {activeTab === 'signin' && (
        <form onSubmit={handleSignIn}>
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
          <div className="mb-2">
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
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="mb-8 text-right">
            <Link href="/auth/reset-password" className="text-[#55B2DE] hover:text-[#6BC4EC] text-sm">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#55B2DE] hover:bg-[#4A9FCB] text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-50 mb-6"
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>

          {/* Switch to Join */}
          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="text-[#55B2DE] hover:text-[#6BC4EC] font-medium"
            >
              Join PagePass
            </button>
          </p>
        </form>
      )}

      {/* SIGNUP FORM */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUp}>
          {/* Name */}
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
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
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
                <EyeIcon show={showConfirmPassword} />
              </button>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  agreedToTerms ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-gray-500'
                }`}>
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
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  wantsNewsletter ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-gray-500'
                }`}>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#55B2DE] hover:bg-[#4A9FCB] text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-50 mb-6"
          >
            {loading ? 'Please wait...' : 'Join PagePass'}
          </button>

          {/* Encrypted Message */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <span>Your data is encrypted and secure</span>
          </div>
        </form>
      )}
    </div>
  )
}
