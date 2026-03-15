'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { AVATARS, AvatarSlug, DEFAULT_AVATAR, getAvatarBySlug } from '@/lib/avatars'

type AvatarSectionProps = {
  userId: string
  userName: string
  currentAvatarSlug: AvatarSlug | string | null
}

export default function AvatarSection({
  userId,
  userName,
  currentAvatarSlug
}: AvatarSectionProps) {
  const supabase = createClient()
  const router = useRouter()

  const [selectedSlug, setSelectedSlug] = useState<AvatarSlug>(
    (currentAvatarSlug as AvatarSlug) || DEFAULT_AVATAR
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Sync local state with props when they change
  useEffect(() => {
    setSelectedSlug((currentAvatarSlug as AvatarSlug) || DEFAULT_AVATAR)
  }, [currentAvatarSlug])

  const selectedAvatar = getAvatarBySlug(selectedSlug)

  const handleSaveAvatar = async () => {
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_slug: selectedSlug,
          avatar_type: null,  // Clear legacy fields
          avatar_id: null,
          avatar_url: null
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setMessage('✅ Avatar updated!')
      router.refresh()
    } catch (err: any) {
      setError(`❌ ${err.message || 'Failed to save avatar'}`)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = selectedSlug !== (currentAvatarSlug || DEFAULT_AVATAR)

  return (
    <div className="bg-[#27272A] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-800">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-900/30 text-green-400 rounded-lg text-sm border border-green-800">
          {message}
        </div>
      )}

      {/* Current Avatar Preview */}
      <div className="flex flex-col items-center mb-6">
        <div 
          className="w-28 h-28 rounded-full overflow-hidden"
          style={{
            boxShadow: '0 0 0 2.5px #55B2DE, 0 0 12px rgba(85,178,222,0.28)'
          }}
          dangerouslySetInnerHTML={{ __html: selectedAvatar.svg }}
        />
        <p className="mt-3 italic text-[#6A7490]">
          {selectedAvatar.name}
        </p>
      </div>

      {/* Avatar Grid - 3x2 layout */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {AVATARS.map((avatar) => {
          const isSelected = avatar.slug === selectedSlug
          return (
            <button
              key={avatar.slug}
              onClick={() => {
                setSelectedSlug(avatar.slug)
                setMessage('')
                setError('')
              }}
              disabled={saving}
              className="flex flex-col items-center disabled:opacity-50"
              aria-label={`${avatar.name} ${avatar.description}`}
              aria-pressed={isSelected}
            >
              <div 
                className={`w-20 h-20 rounded-full overflow-hidden transition-all duration-200 ${
                  isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
                style={isSelected ? {
                  boxShadow: '0 0 0 2.5px #55B2DE, 0 0 12px rgba(85,178,222,0.28)'
                } : {
                  boxShadow: '0 0 0 2px transparent'
                }}
                dangerouslySetInnerHTML={{ __html: avatar.svg }}
              />
              <p className="mt-2 text-xs italic text-[#6A7490]">
                {avatar.name}
              </p>
            </button>
          )
        })}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveAvatar}
        disabled={saving || !hasChanges}
        className="w-full px-4 py-3 bg-[#55B2DE] text-[#0A1828] rounded-xl font-semibold hover:bg-[#6BC4EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
      </button>
    </div>
  )
}
