'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  contact_preference_type: string | null
  contact_preference_value: string
  default_browse_view: string
}

export default function SettingsForm({ user }: { user: User }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [contactPrefType, setContactPrefType] = useState(user.contact_preference_type || 'none')
  const [contactPrefValue, setContactPrefValue] = useState(user.contact_preference_value || '')
  const [defaultBrowseView, setDefaultBrowseView] = useState(user.default_browse_view || 'card')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate contact preference
      if (contactPrefType !== 'none' && !contactPrefValue.trim()) {
        setMessage('❌ Please enter your contact information or select "Don\'t share"')
        setLoading(false)
        return
      }

      // Update profile in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          contact_preference_type: contactPrefType,
          contact_preference_value: contactPrefType === 'none' ? null : contactPrefValue,
          default_browse_view: defaultBrowseView
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('✅ Profile updated successfully!')
      router.refresh()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation
    if (newPassword !== confirmPassword) {
      setMessage('❌ New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage('✅ Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Message banner */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.startsWith('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Profile section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
            />
          </div>

          {/* Contact Preference */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How should circle members reach you for book pickups?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              This is only shown to people during an active handoff. Not visible on your profile.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="phone"
                  checked={contactPrefType === 'phone'}
                  onChange={(e) => setContactPrefType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Phone number</span>
              </label>

              {contactPrefType === 'phone' && (
                <input
                  type="tel"
                  value={contactPrefValue}
                  onChange={(e) => setContactPrefValue(e.target.value)}
                  className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="email"
                  checked={contactPrefType === 'email'}
                  onChange={(e) => setContactPrefType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Email</span>
              </label>

              {contactPrefType === 'email' && (
                <input
                  type="email"
                  value={contactPrefValue}
                  onChange={(e) => setContactPrefValue(e.target.value)}
                  className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="none"
                  checked={contactPrefType === 'none'}
                  onChange={(e) => setContactPrefType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Don't share contact info</span>
              </label>
            </div>
          </div>

          {/* Default Browse View */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Browse View
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose how you prefer to view book lists in circles and your library.
            </p>
            
            <div className="flex gap-3">
              <label className={`flex-1 px-4 py-3 border-2 rounded-lg cursor-pointer transition ${
                defaultBrowseView === 'card' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  value="card"
                  checked={defaultBrowseView === 'card'}
                  onChange={(e) => setDefaultBrowseView(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🎴</div>
                  <div className="font-medium text-sm">Card View</div>
                  <div className="text-xs text-gray-500">Large covers</div>
                </div>
              </label>

              <label className={`flex-1 px-4 py-3 border-2 rounded-lg cursor-pointer transition ${
                defaultBrowseView === 'list' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  value="list"
                  checked={defaultBrowseView === 'list'}
                  onChange={(e) => setDefaultBrowseView(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="font-medium text-sm">List View</div>
                  <div className="text-xs text-gray-500">Compact rows</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
