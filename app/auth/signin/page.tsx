'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [circleName, setCircleName] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const circleCode = searchParams.get('circleCode')
  const supabase = createClient()

  // Look up circle name if circleCode is present
  useEffect(() => {
    if (circleCode) {
      const fetchCircleName = async () => {
        const { data } = await supabase
          .from('circles')
          .select('name')
          .eq('invite_code', circleCode.toUpperCase())
          .maybeSingle()
        
        if (data) {
          setCircleName(data.name)
        }
      }
      fetchCircleName()
    }
  }, [circleCode, supabase])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Replace Supabase's "Email not confirmed" with friendlier message
      if (error.message === 'Email not confirmed') {
        setError('Check your inbox — we sent you a confirmation link. Once confirmed, you\'re in!')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // If circleCode is present, redirect to join flow to complete invitation
      if (circleCode) {
        window.location.href = `/join?code=${circleCode}`
      } else {
        router.push('/circles')
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
        
        {/* Circle Invitation Banner */}
        {circleCode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 text-center font-medium">
              📚 {circleName ? `Join to access the ${circleName} circle` : 'Join to access your invited circle'}
            </p>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
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
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/auth/reset-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          New here?{' '}
          <Link 
            href={circleCode ? `/auth/signup?circleCode=${circleCode}` : '/auth/signup'} 
            className="text-blue-600 hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>

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
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
