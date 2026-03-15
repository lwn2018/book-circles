'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function OnboardingImport() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imported, setImported] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileName = `${user.id}-${Date.now()}.csv`
      const filePath = `goodreads-imports/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(filePath, selectedFile, {
          contentType: 'text/csv',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('imports')
        .getPublicUrl(filePath)

      const { error: recordError } = await supabase
        .from('goodreads_imports')
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          status: 'processing'
        })

      if (recordError) throw recordError

      await fetch('/api/import/goodreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fileUrl: publicUrl
        })
      })

      setImported(true)
    } catch (err: any) {
      setError(err.message || 'Failed to start import')
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/welcome')
  }

  // Success state - matches Jay's design
  if (imported) {
    return (
      <div className="min-h-screen bg-[#121212] px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={handleSkip} className="text-white font-medium">
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Import Success</h1>
          <p className="text-gray-400 mb-12">
            Download your Goodreads library file from their website, then upload it here to sync your collection.
          </p>

          {/* Success Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Main circle with checkmark */}
              <div className="w-40 h-40 bg-[#55B2DE] rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-[#1E293B] rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              {/* Floating icon - top right */}
              <div className="absolute -top-2 right-0 w-12 h-12 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              
              {/* Floating icon - bottom left */}
              <div className="absolute -bottom-2 -left-4 w-12 h-12 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success Text */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">Success!</h2>
            <p className="text-gray-400 mb-2">Your books are being imported as we speak</p>
            <p className="text-gray-500 text-sm">We'll notify you when it's done</p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleSkip}
              className="w-full py-4 border-2 border-[#55B2DE] text-[#55B2DE] rounded-full font-medium hover:bg-[#55B2DE]/10 transition-colors"
            >
              Process in Background
            </button>
            
            <button
              onClick={() => router.push('/library')}
              className="w-full py-4 bg-[#55B2DE] text-white rounded-full font-semibold hover:bg-[#4A9FCB] transition-colors"
            >
              Continue to library
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={handleSkip} className="text-white font-medium">
          Skip
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
      </div>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Import your books</h1>
        <p className="text-gray-400 mb-8">
          Let's build your library! You can import your books now, or add them manually later.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Import from Goodreads */}
          <div className="bg-[#1E293B] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📚</span> Import from Goodreads
            </h2>
            
            <div className="bg-[#27272A] rounded-xl p-4 mb-4">
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex gap-2">
                  <span className="text-gray-500">1.</span>
                  <span>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-[#55B2DE] hover:underline">Goodreads Export</a></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500">2.</span>
                  <span>Click "Export Library"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500">3.</span>
                  <span>Download the CSV file</span>
                </li>
              </ol>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="flex items-center gap-3 p-4 bg-[#27272A] rounded-xl mb-4">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-[#55B2DE] hover:bg-[#55B2DE]/5 transition-colors mb-4"
              >
                <div className="w-12 h-12 bg-[#55B2DE]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">Tap to select your CSV file</span>
              </button>
            )}

            <button
              onClick={handleImport}
              disabled={!selectedFile || uploading}
              className="w-full py-4 bg-[#55B2DE] text-white font-semibold rounded-full hover:bg-[#4A9FCB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Start Import'}
            </button>
          </div>

          {/* Add Manually */}
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="w-full py-4 bg-[#1E293B] rounded-2xl hover:bg-[#27272A] disabled:opacity-50 transition-colors"
          >
            <span className="text-white font-medium flex items-center justify-center gap-2">
              <span>✏️</span> I'll add my books one at a time
            </span>
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="w-full py-3 text-gray-500 hover:text-white disabled:opacity-50 transition-colors"
          >
            Don't import now
          </button>
        </div>
      </div>
    </div>
  )
}
