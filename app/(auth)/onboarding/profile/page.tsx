'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function OnboardingProfile() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shareEmail, setShareEmail] = useState(true)
  const [sharePhone, setSharePhone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.user_metadata?.full_name) {
          const nameParts = user.user_metadata.full_name.split(' ')
          setFirstName(nameParts[0] || '')
          setLastName(nameParts.slice(1).join(' ') || '')
        }
        if (user.email) {
          setEmail(user.email)
        }
      }
    }
    loadUserData()
  }, [supabase])

  const handleNext = async () => {
    setError('')

    if (!firstName.trim()) {
      setError('Please enter your first name')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fullName = lastName ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim()
      const fullPhone = phoneNumber ? `${countryCode}${phoneNumber.replace(/\D/g, '')}` : null

      // Save all contact info, plus preferences for what to share
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          contact_email: email || null,
          contact_phone: fullPhone,
          share_email: shareEmail,
          share_phone: sharePhone
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/onboarding/import')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/import')
  }

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
          checked ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-gray-500'
        }`}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-white">{label}</span>
    </label>
  )

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={handleSkip} className="text-white font-medium">
          Skip
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Let's get to know each other</h1>
        <p className="text-gray-400 mb-8">
          PagePass is built on real connections. Tell us who you are so your neighbors can recognize you.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* First Name */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jordan"
            className="w-full bg-[#1E1E1E] text-white rounded-full px-5 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
          />
        </div>

        {/* Last Name */}
        <div className="mb-8">
          <label className="block text-white font-medium mb-2">
            Last Name<span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Cris"
            className="w-full bg-[#1E1E1E] text-white rounded-full px-5 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
          />
        </div>

        {/* Contact Section */}
        <h2 className="text-xl font-bold text-white mb-4">
          When you share a book, how should people contact you?
        </h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#1E1E1E] text-white rounded-full px-5 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
          />
          <div className="mt-2">
            <Checkbox checked={shareEmail} onChange={() => setShareEmail(!shareEmail)} label="Share email with borrowers" />
          </div>
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">Phone Number</label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="appearance-none bg-[#1E1E1E] text-white rounded-full px-4 py-4 pr-10 outline-none focus:ring-2 focus:ring-[#55B2DE]"
              >
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+91">+91</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="555 123 4567"
              className="flex-1 bg-[#1E1E1E] text-white rounded-full px-5 py-4 outline-none focus:ring-2 focus:ring-[#55B2DE] placeholder-gray-500"
            />
          </div>
          <div className="mt-2">
            <Checkbox checked={sharePhone} onChange={() => setSharePhone(!sharePhone)} label="Share phone with borrowers" />
          </div>
        </div>

        {/* Info text */}
        <p className="text-gray-500 text-sm mb-8">
          Only checked contact methods will be shown to people who want to borrow your books.
        </p>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-[#55B2DE] hover:bg-[#4A9FCB] text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  )
}
