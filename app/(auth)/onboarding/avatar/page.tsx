'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProgressBar from '../components/ProgressBar'
import Link from 'next/link'

const PRESET_AVATARS = [
  { id: 'preset-1', emoji: '📚', color: 'bg-blue-100' },
  { id: 'preset-2', emoji: '🌟', color: 'bg-yellow-100' },
  { id: 'preset-3', emoji: '🎨', color: 'bg-purple-100' },
  { id: 'preset-4', emoji: '🌈', color: 'bg-pink-100' },
  { id: 'preset-5', emoji: '🚀', color: 'bg-indigo-100' },
  { id: 'preset-6', emoji: '🌻', color: 'bg-green-100' },
  { id: 'preset-7', emoji: '🎭', color: 'bg-red-100' },
  { id: 'preset-8', emoji: '⭐', color: 'bg-orange-100' }
]

export default function OnboardingAvatar() {
  const router = useRouter()
  const supabase = createClient()

  const [avatarType, setAvatarType] = useState<'preset' | 'initials'>('initials')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePresetSelect = (presetId: string) => {
    setAvatarType('preset')
    setSelectedPreset(presetId)
    setError('')
  }

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update profile (only preset or initials, no upload)
      console.log('[Onboarding Avatar] Saving:', { avatarType, selectedPreset, userId: user.id })
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_type: avatarType,
          avatar_id: avatarType === 'preset' ? selectedPreset : null,
          avatar_url: null // Never use uploaded photos
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
    // Just move to next step without saving avatar
    router.push('/onboarding/profile')
  }

  // Get current avatar preview
  const getCurrentAvatar = () => {
    console.log('[Avatar] Rendering preview:', { avatarType, selectedPreset })
    
    if (avatarType === 'preset' && selectedPreset) {
      const preset = PRESET_AVATARS.find(p => p.id === selectedPreset)
      console.log('[Avatar] Found preset:', preset)
      if (preset) {
        return (
          <div className={`w-full h-full rounded-full ${preset.color} flex items-center justify-center`}>
            <span className="text-6xl">{preset.emoji}</span>
          </div>
        )
      }
    }

    // Default initials placeholder
    return (
      <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-6xl text-gray-600">👤</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={0} />

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to PagePass!</h1>
        <p className="text-center text-gray-600 mb-8">Choose your avatar.</p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Current Avatar Display */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            {getCurrentAvatar()}
          </div>
        </div>

        {/* Preset Avatar Options */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3 text-center">
            Choose an avatar:
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`w-full aspect-square rounded-full ${preset.color} flex items-center justify-center text-4xl transition-all ${
                  selectedPreset === preset.id
                    ? 'ring-4 ring-blue-500 scale-105'
                    : 'hover:scale-105'
                }`}
              >
                {preset.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
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
