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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarType, setAvatarType] = useState<'upload' | 'preset' | 'initials'>('initials')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setUploadedFile(file)
    setAvatarType('upload')
    setSelectedPreset(null)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePresetSelect = (presetId: string) => {
    setAvatarType('preset')
    setSelectedPreset(presetId)
    setUploadedFile(null)
    setUploadedPreview(null)
    setError('')
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Resize and compress image (client-side)
      const resizedBlob = await resizeImage(file, 256, 256)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedBlob, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err: any) {
      console.error('Upload error:', err)
      setError('Failed to upload image')
      return null
    } finally {
      setUploading(false)
    }
  }

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          },
          file.type,
          0.85
        )
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let avatarUrl: string | null = null

      // Upload if needed
      if (avatarType === 'upload' && uploadedFile) {
        avatarUrl = await uploadAvatar(uploadedFile)
        if (!avatarUrl) {
          setLoading(false)
          return
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_type: avatarType,
          avatar_id: avatarType === 'preset' ? selectedPreset : null,
          avatar_url: avatarType === 'upload' ? avatarUrl : null
        })
        .eq('id', user.id)

      if (updateError) throw updateError

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
    console.log('[Avatar] Rendering preview:', { avatarType, selectedPreset, uploadedPreview })
    
    if (avatarType === 'upload' && uploadedPreview) {
      return (
        <img
          src={uploadedPreview}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full"
        />
      )
    }

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

    // Default initials
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
        <p className="text-center text-gray-600 mb-8">Upload a photo or choose an avatar.</p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Current Avatar Display */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            {getCurrentAvatar()}
            
            {/* Upload Button Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/0 hover:bg-black/30 disabled:bg-black/0 rounded-full transition-all flex items-center justify-center group"
            >
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                📷
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Preset Avatar Options */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3 text-center">
            Or choose a preset avatar:
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
            disabled={loading || uploading}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={loading || uploading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md"
          >
            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
