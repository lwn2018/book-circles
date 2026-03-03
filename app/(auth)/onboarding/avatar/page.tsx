'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProgressBar from '../components/ProgressBar'

const PRESET_AVATARS = [
  { id: 'preset-1', emoji: '📚', color: 'bg-amber-900/60' },
  { id: 'preset-2', emoji: '🌟', color: 'bg-yellow-900/60' },
  { id: 'preset-3', emoji: '🎨', color: 'bg-purple-900/60' },
  { id: 'preset-4', emoji: '🌈', color: 'bg-pink-900/60' },
  { id: 'preset-5', emoji: '🚀', color: 'bg-indigo-900/60' },
  { id: 'preset-6', emoji: '🌻', color: 'bg-green-900/60' },
  { id: 'preset-7', emoji: '🎭', color: 'bg-red-900/60' },
  { id: 'preset-8', emoji: '⭐', color: 'bg-orange-900/60' }
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

      console.log('[Onboarding Avatar] Saving:', { avatarType, selectedPreset, userId: user.id })
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_type: avatarType,
          avatar_id: avatarType === 'preset' ? selectedPreset : null,
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
    router.push('/onboarding/profile')
  }

  // Get selected preset for preview
  const selectedAvatarData = selectedPreset 
    ? PRESET_AVATARS.find(p => p.id === selectedPreset)
    : null

  return (
    <div className="max-w-md mx-auto pt-8">
      <ProgressBar currentStep={0} />

      <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          Choose Your Avatar
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Select any avatar to get started
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-800">
            {error}
          </div>
        )}

        {/* Current Avatar Preview */}
        <div className="flex justify-center mb-8">
          <div 
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
              selectedAvatarData 
                ? `${selectedAvatarData.color} ring-4 ring-orange-500 ring-offset-4 ring-offset-[#1a1a1a]` 
                : 'bg-gray-800'
            }`}
          >
            <span className="text-5xl">
              {selectedAvatarData ? selectedAvatarData.emoji : '👤'}
            </span>
          </div>
        </div>

        {/* Avatar Grid - 2x4 layout */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {PRESET_AVATARS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`aspect-square rounded-full ${preset.color} flex items-center justify-center text-3xl transition-all duration-200 ${
                selectedPreset === preset.id
                  ? 'ring-3 ring-orange-500 scale-110 shadow-lg shadow-orange-500/30'
                  : 'hover:scale-105 hover:ring-2 hover:ring-orange-400/50'
              }`}
            >
              {preset.emoji}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-lg shadow-orange-500/30 font-semibold transition-all"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
