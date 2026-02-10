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
  const [inviteInfo, setInviteInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get('invite')
    if (code) {
      setInviteCode(code.toUpperCase())
      validateInvite(code)
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate invite code if provided
      let inviter_id = null
      if (inviteCode) {
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

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            signup_source: inviteCode ? 'invite' : 'direct',
            invite_code: inviteCode || null,
            invited_by: inviter_id
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

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>
        
        {inviteInfo && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <p className="font-semibold">✉️ You've been invited!</p>
            <p className="mt-1">Invited by {inviteInfo.creatorName}</p>
          </div>
        )}
        
        <form onSubmit={handleSignUp} className="space-y-4">
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>
          {!inviteInfo && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Invite Code <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onBlur={() => inviteCode && validateInvite(inviteCode)}
                placeholder="ABCD1234"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                maxLength={8}
              />
            </div>
          )}
          {/* Privacy Message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              🔒 <strong>Your reading data is yours.</strong><br />
              We never sell individual data to anyone.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
