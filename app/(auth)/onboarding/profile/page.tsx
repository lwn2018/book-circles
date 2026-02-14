'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProgressBar from '../components/ProgressBar'
import { formatPhoneNumber } from '@/lib/formatPhone'

export default function OnboardingProfile() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [contactMethods, setContactMethods] = useState<Array<'email' | 'phone' | 'text'>>([])
  const [emailValue, setEmailValue] = useState('')
  const [phoneValue, setPhoneValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-populate with data from signup
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Pre-fill name from signup
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name)
        }
        // Pre-fill email
        if (user.email) {
          setEmailValue(user.email)
          setContactMethods(['email'])
        }
      }
    }
    loadUserData()
  }, [supabase])

  const toggleContactMethod = (method: 'email' | 'phone' | 'text') => {
    if (contactMethods.includes(method)) {
      setContactMethods(contactMethods.filter(m => m !== method))
    } else {
      setContactMethods([...contactMethods, method])
    }
  }

  const handleNext = async () => {
    setError('')

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your name')
      return
    }

    if (contactMethods.length === 0) {
      setError('Please select at least one contact method')
      return
    }

    if (contactMethods.includes('email') && !emailValue.trim()) {
      setError('Please enter your email address')
      return
    }

    if ((contactMethods.includes('phone') || contactMethods.includes('text')) && !phoneValue.trim()) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Pre-fill email with auth email if not provided
      const finalEmail = emailValue.trim() || user.email || ''

      // Build contact preferences (can have both email and phone)
      const contactEmail = contactMethods.includes('email') ? finalEmail : null
      const contactPhone = (contactMethods.includes('phone') || contactMethods.includes('text')) 
        ? phoneValue.trim() 
        : null

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          contact_email: contactEmail,
          contact_phone: contactPhone
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

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={1} />

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Let's get to know each other</h1>
        <p className="text-center text-gray-600 mb-8">
          This helps your circle members connect with you.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="First and last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contact Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              When you share a book, how should people contact you?
            </label>

            <div className="space-y-3">
              {/* Email Option */}
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={contactMethods.includes('email')}
                  onChange={() => toggleContactMethod('email')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Email</div>
                  {contactMethods.includes('email') && (
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>

              {/* Phone Option */}
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={contactMethods.includes('phone')}
                  onChange={() => toggleContactMethod('phone')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Phone call</div>
                  {contactMethods.includes('phone') && (
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(formatPhoneNumber(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>

              {/* Text Option */}
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={contactMethods.includes('text')}
                  onChange={() => toggleContactMethod('text')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Text message</div>
                  {contactMethods.includes('text') && !contactMethods.includes('phone') && (
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(formatPhoneNumber(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              This information is only shown to people during active book handoffs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
