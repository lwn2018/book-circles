'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Props = {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
}

export default function NotificationSettings({ userId, emailNotifications, pushNotifications }: Props) {
  const [email, setEmail] = useState(emailNotifications)
  const [push, setPush] = useState(pushNotifications)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    const { error } = await supabase
      .from('profiles')
      .update({
        email_notifications: email,
        push_notifications: push
      })
      .eq('id', userId)

    if (error) {
      setMessage('Failed to save settings')
    } else {
      setMessage('Settings saved!')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1E293B] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Email Notifications</p>
            <p className="text-white/50 text-sm">Receive updates about handoffs and activity</p>
          </div>
          <button
            onClick={() => setEmail(!email)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              email ? 'bg-[#55B2DE]' : 'bg-[#27272A]'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              email ? 'left-6' : 'left-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Push Notifications</p>
            <p className="text-white/50 text-sm">Get notified on your device</p>
          </div>
          <button
            onClick={() => setPush(!push)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              push ? 'bg-[#55B2DE]' : 'bg-[#27272A]'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              push ? 'left-6' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#55B2DE] text-[#0A1828] rounded-xl font-semibold hover:bg-[#6BC4EC] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
