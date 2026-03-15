'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPhoneNumber } from '@/lib/formatPhone'

type User = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  contact_preference_type: string | null
  contact_preference_value: string
  contact_email?: string | null
  contact_phone?: string | null
  default_browse_view: string
}

export default function SettingsForm({ user }: { user: User }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [contactEmail, setContactEmail] = useState(user.contact_email || '')
  const [contactPhone, setContactPhone] = useState(user.contact_phone || '')
  const [shareEmail, setShareEmail] = useState(!!(user.contact_email))
  const [sharePhone, setSharePhone] = useState(!!(user.contact_phone))
  const [defaultBrowseView, setDefaultBrowseView] = useState(user.default_browse_view || 'card')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  const inputClass = "w-full px-4 py-3 bg-[#27272A] border border-[#333] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent"
  const labelClass = "block text-sm font-medium text-[#9CA3AF] mb-2"

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (shareEmail && !contactEmail.trim()) {
        setMessage('❌ Please enter your email address or uncheck "Share email"')
        setLoading(false)
        return
      }
      if (sharePhone && !contactPhone.trim()) {
        setMessage('❌ Please enter your phone number or uncheck "Share phone"')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          contact_email: shareEmail ? contactEmail.trim() : null,
          contact_phone: sharePhone ? contactPhone.trim() : null,
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

    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match')
      setLoading(false)
      return
    }
    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setMessage('✅ Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
          checked ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-[#6B7280]'
        }`}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-white text-sm">{label}</span>
    </label>
  )

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={user.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          <p className="text-xs text-[#6B7280] mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your name" />
        </div>

        <div>
          <label className={labelClass}>How should circle members reach you for book pickups?</label>
          <p className="text-xs text-[#6B7280] mb-3">This is only shown to people during an active handoff. Not visible on your profile. You can select multiple methods.</p>
          
          <div className="space-y-3">
            <div>
              <Checkbox checked={shareEmail} onChange={() => setShareEmail(!shareEmail)} label="Email" />
              {shareEmail && (
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={`${inputClass} mt-2 ml-8`} placeholder="you@example.com" />
              )}
            </div>
            <div>
              <Checkbox checked={sharePhone} onChange={() => setSharePhone(!sharePhone)} label="Phone (call or text)" />
              {sharePhone && (
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(formatPhoneNumber(e.target.value))} className={`${inputClass} mt-2 ml-8`} placeholder="(555) 123-4567" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Default Browse View</label>
          <p className="text-xs text-[#6B7280] mb-3">Choose how you prefer to view book lists in circles and your library.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <label className={`p-4 border-2 rounded-xl cursor-pointer transition text-center ${
              defaultBrowseView === 'card' ? 'border-[#55B2DE] bg-[#55B2DE]/10' : 'border-[#333] hover:border-[#55B2DE]/50'
            }`}>
              <input type="radio" value="card" checked={defaultBrowseView === 'card'} onChange={(e) => setDefaultBrowseView(e.target.value)} className="sr-only" />
              <div className="text-2xl mb-1">🎴</div>
              <div className="font-medium text-white text-sm">Large covers</div>
            </label>
            <label className={`p-4 border-2 rounded-xl cursor-pointer transition text-center ${
              defaultBrowseView === 'list' ? 'border-[#55B2DE] bg-[#55B2DE]/10' : 'border-[#333] hover:border-[#55B2DE]/50'
            }`}>
              <input type="radio" value="list" checked={defaultBrowseView === 'list'} onChange={(e) => setDefaultBrowseView(e.target.value)} className="sr-only" />
              <div className="text-2xl mb-1">📝</div>
              <div className="font-medium text-white text-sm">Compact rows</div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="px-6 py-3 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Password Section */}
      <div className="border-t border-[#333] pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelClass}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Enter new password" minLength={6} />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirm new password" minLength={6} />
          </div>
          <button type="submit" disabled={loading || !newPassword || !confirmPassword} className="px-6 py-3 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
