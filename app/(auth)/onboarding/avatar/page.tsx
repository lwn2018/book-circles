'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AVATARS, AvatarSlug, DEFAULT_AVATAR } from '@/lib/avatars'
import ProgressBar from '../components/ProgressBar'

export default function OnboardingAvatar() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedSlug, setSelectedSlug] = useState<AvatarSlug>(DEFAULT_AVATAR)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedAvatar = AVATARS.find(a => a.slug === selectedSlug) || AVATARS[0]

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('[Onboarding Avatar] Saving:', { avatarSlug: selectedSlug, userId: user.id })
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_slug: selectedSlug,
          avatar_type: null,  // Clear legacy fields
          avatar_id: null,
          avatar_url: null
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[Onboarding Avatar] Save failed:', updateError)
        throw updateError
      }

      console.log('[Onboarding Avatar] Saved successfully!')
      router.push('/onboarding/profile')
    } catch (err: any) {
      setError(err.message || 'Failed to save avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    // Set default avatar when skipping
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ avatar_slug: DEFAULT_AVATAR })
          .eq('id', user.id)
      }
    } catch (e) {
      // Silent fail - not critical
    }
    router.push('/onboarding/profile')
  }

  return (
    <div className="min-h-screen bg-[#1A2236] px-4 py-8">
      <div className="max-w-md mx-auto">
        <ProgressBar currentStep={0} />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to PagePass
          </h1>
          <p className="text-white/60">
            Choose an avatar to represent you in the community.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-800">
            {error}
          </div>
        )}

        {/* Large Preview */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-28 h-28 rounded-full overflow-hidden"
            style={{
              boxShadow: '0 0 0 2.5px #55B2DE, 0 0 16px rgba(85,178,222,0.28)'
            }}
            dangerouslySetInnerHTML={{ __html: selectedAvatar.svg }}
            aria-label={`${selectedAvatar.name} ${selectedAvatar.description}`}
          />
          <p 
            className="mt-3 italic"
            style={{ color: '#6A7490', fontFamily: 'var(--font-inter)' }}
          >
            {selectedAvatar.name}
          </p>
        </div>

        {/* Avatar Grid - 3x2 layout */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {AVATARS.map((avatar) => {
            const isSelected = avatar.slug === selectedSlug
            return (
              <button
                key={avatar.slug}
                onClick={() => setSelectedSlug(avatar.slug)}
                className="flex flex-col items-center"
                aria-label={`${avatar.name} ${avatar.description}`}
                aria-pressed={isSelected}
              >
                <div 
                  className={`w-24 h-24 rounded-full overflow-hidden transition-all duration-200 ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={isSelected ? {
                    boxShadow: '0 0 0 2.5px #55B2DE, 0 0 12px rgba(85,178,222,0.28)'
                  } : {
                    boxShadow: '0 0 0 2.5px transparent'
                  }}
                  dangerouslySetInnerHTML={{ __html: avatar.svg }}
                />
                <p 
                  className="mt-2 text-sm italic"
                  style={{ color: '#6A7490' }}
                >
                  {avatar.name}
                </p>
              </button>
            )
          })}
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full py-4 bg-[#55B2DE] text-[#0A1828] rounded-xl font-semibold hover:bg-[#6BC4EC] disabled:opacity-50 transition-colors mb-4"
        >
          {loading ? 'Saving...' : 'Next'}
        </button>

        <button
          onClick={handleSkip}
          disabled={loading}
          className="w-full py-3 text-white/60 hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
