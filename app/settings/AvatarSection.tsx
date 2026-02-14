'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

type AvatarSectionProps = {
  userId: string
  userName: string
  currentAvatarUrl: string | null
  currentAvatarType: 'upload' | 'preset' | 'initials' | null
  currentAvatarId: string | null
}

export default function AvatarSection({
  userId,
  userName,
  currentAvatarUrl,
  currentAvatarType,
  currentAvatarId
}: AvatarSectionProps) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarType, setAvatarType] = useState<'upload' | 'preset' | 'initials'>(
    currentAvatarType || 'initials'
  )
  const [selectedPreset, setSelectedPreset] = useState<string | null>(currentAvatarId)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Sync local state with props when they change (after router.refresh())
  useEffect(() => {
    setAvatarType(currentAvatarType || 'initials')
    setSelectedPreset(currentAvatarId)
  }, [currentAvatarType, currentAvatarId])

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
    setMessage('')

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
    setMessage('')
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

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)

      // Resize and compress image (client-side)
      const resizedBlob = await resizeImage(file, 256, 256)

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
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

  const handleSaveAvatar = async () => {
    setError('')
    setMessage('')
    setSaving(true)

    try {
      let avatarUrl: string | null = null

      // Upload if needed
      if (avatarType === 'upload' && uploadedFile) {
        avatarUrl = await uploadAvatar(uploadedFile)
        if (!avatarUrl) {
          setSaving(false)
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
        .eq('id', userId)

      if (updateError) throw updateError

      setMessage('✅ Avatar updated successfully!')
      
      // Clear uploaded file/preview (but keep preset selection)
      if (avatarType === 'upload') {
        setUploadedFile(null)
        setUploadedPreview(null)
      }
      
      // Refresh to show new avatar across the app
      // The useEffect will sync local state with updated props
      router.refresh()
    } catch (err: any) {
      setError(`❌ ${err.message || 'Failed to save avatar'}`)
    } finally {
      setSaving(false)
    }
  }

  // Helper to get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Helper to get color for user
  const getUserColor = (id: string): string => {
    const colors = [
      '#8B9D83', '#C89F9C', '#6B7C93', '#C07D5F', '#8B6F8F',
      '#6B9696', '#CCA15C', '#9B8FAB', '#A67B5B', '#5D8D8D'
    ]
    let hash = 5381
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) + hash) + id.charCodeAt(i)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Get current avatar preview
  const getCurrentAvatar = () => {
    if (avatarType === 'upload' && uploadedPreview) {
      return (
        <img
          src={uploadedPreview}
          alt="Avatar preview"
          className="w-full h-full object-cover rounded-full"
        />
      )
    }

    if (avatarType === 'upload' && currentAvatarUrl) {
      return (
        <img
          src={currentAvatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full"
        />
      )
    }

    if (avatarType === 'preset' && selectedPreset) {
      const preset = PRESET_AVATARS.find(p => p.id === selectedPreset)
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
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white text-4xl"
        style={{ backgroundColor: getUserColor(userId) }}
      >
        {getInitials(userName)}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
          {message}
        </div>
      )}

      {/* Current Avatar Display */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          {getCurrentAvatar()}
          
          {/* Upload Button Overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || saving}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center group disabled:cursor-not-allowed"
          >
            <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
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

      <p className="text-sm text-gray-600 text-center mb-4">
        Click the avatar to upload a photo
      </p>

      {/* Preset Avatar Options */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Or choose a preset avatar:
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              disabled={uploading || saving}
              className={`w-full aspect-square rounded-full ${preset.color} flex items-center justify-center text-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPreset === preset.id && avatarType === 'preset'
                  ? 'ring-4 ring-blue-500 scale-105'
                  : 'hover:scale-105'
              }`}
            >
              {preset.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Use Initials Option */}
      <div className="mb-6">
        <button
          onClick={() => {
            setAvatarType('initials')
            setSelectedPreset(null)
            setUploadedFile(null)
            setUploadedPreview(null)
            setError('')
            setMessage('')
          }}
          disabled={uploading || saving}
          className={`w-full px-4 py-3 border-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            avatarType === 'initials'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          Use my initials ({userName.split(' ').map(n => n[0]).join('').toUpperCase()})
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveAvatar}
        disabled={saving || uploading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Avatar'}
      </button>
    </div>
  )
}
