'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [circleCode, setCircleCode] = useState('')
  const [inviteInfo, setInviteInfo] = useState<any>(null)
  const [circleInfo, setCircleInfo] = useState<any>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for user invite code
    const code = searchParams.get('invite')
    if (code) {
      setInviteCode(code.toUpperCase())
      validateInvite(code)
    }

    // Check for circle invite code
    const cCode = searchParams.get('circleCode')
    if (cCode) {
      setCircleCode(cCode.toUpperCase())
      setError('') // Clear any existing errors
      validateCircleCode(cCode)
    }
  }, [searchParams])

  const validateInvite = async (code: string) => {
    try {
      const response = await fetch(`/api/invite/validate?code=${code}`)
      const data = await response.json()
      if (data.valid) {
        setInviteInfo(data.invite)
      }
    } catch (err) {
      console.error('Failed to validate invite:', err)
    }
  }

  const validateCircleCode = async (code: string) => {
    try {
      const { data: circle } = await supabase
        .from('circles')
        .select('id, name')
        .eq('invite_code', code.toUpperCase())
        .single()
      
      if (circle) {
        setCircleInfo(circle)
      }
    } catch (err) {
      console.error('Failed to validate circle code:', err)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate consent checkbox
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account')
      setLoading(false)
      return
    }

    try {
      // Validate invite code if provided (but skip if this is a circle invite)
      let inviter_id = null
      if (inviteCode && !circleCode) {
        const response = await fetch(`/api/invite/validate?code=${inviteCode}`)
        const data = await response.json()
        
        if (!data.valid) {
          setError(data.error || 'Invalid invite code')
          setLoading(false)
          return
        }

        // Get inviter's user ID
        const { data: invite } = await supabase
          .from('invites')
          .select('created_by')
          .eq('code', inviteCode)
          .single()
        
        inviter_id = invite?.created_by
      }

      // Store circle code in localStorage to persist through email confirmation
      if (circleCode) {
        localStorage.setItem('pendingCircleJoin', circleCode)
      }

      const { data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            signup_source: inviteCode ? 'invite' : (circleCode ? 'circle_invite' : 'direct'),
            invite_code: inviteCode || null,
            invited_by: inviter_id,
            pending_circle_code: circleCode || null
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Decrement invite uses if limited
      if (inviteCode && authData.user) {
        await fetch('/api/invite/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode })
        })
      }

      // Track signup
      if (authData.user) {
        trackEvent.signup(
          authData.user.id,
          email,
          inviteCode ? 'invite' : 'direct',
          inviter_id || undefined
        )
      }

      // Redirect to onboarding for new users
      router.push('/onboarding/avatar')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
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
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Sign Up</h1>
        
        {inviteInfo && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(245, 73, 0, 0.15)', border: '1px solid rgba(245, 73, 0, 0.3)' }}>
            <p className="font-semibold text-orange-300">✉️ You've been invited!</p>
            <p className="mt-1 text-orange-200">Invited by {inviteInfo.creatorName}</p>
          </div>
        )}

        {circleCode && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 73, 0, 0.15)', border: '1px solid rgba(245, 73, 0, 0.3)' }}>
            <p className="font-semibold text-orange-300 text-center">
              📚 You've been invited to join{circleInfo ? ` the ${circleInfo.name} circle` : ' a book circle'}!
            </p>
          </div>
        )}
        
        <form onSubmit={handleSignUp} className="space-y-4">
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
          {!inviteInfo && !circleCode && (
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-300">
                Invite Code <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onBlur={() => inviteCode && validateInvite(inviteCode)}
                placeholder="ABCD1234"
                className={`${inputClasses} uppercase`}
                maxLength={8}
              />
            </div>
          )}
          {/* Privacy Message */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <p className="text-sm text-green-300 text-center">
              🔒 <strong>Your reading data is yours.</strong><br />
              We never sell individual data to anyone.
            </p>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreedToTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-orange-500 accent-orange-500"
              required
            />
            <label htmlFor="agreedToTerms" className="text-sm text-zinc-400">
              I agree to the{' '}
              <Link href="/terms" className="text-orange-400 hover:text-orange-300 transition-colors" target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-orange-400 hover:text-orange-300 transition-colors" target="_blank">
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link 
            href={circleCode ? `/auth/signin?circleCode=${circleCode}` : '/auth/signin'} 
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            Sign in
          </Link>
        </p>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-zinc-700">
          <div className="flex justify-center gap-4 text-xs text-zinc-500">
            <Link href="/privacy" className="hover:text-orange-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-orange-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
