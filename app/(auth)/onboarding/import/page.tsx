'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProgressBar from '../components/ProgressBar'

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

      // Upload CSV to storage
      const fileName = `${user.id}-${Date.now()}.csv`
      const filePath = `goodreads-imports/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(filePath, selectedFile, {
          contentType: 'text/csv',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('imports')
        .getPublicUrl(filePath)

      // Create import record
      const { error: recordError } = await supabase
        .from('goodreads_imports')
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          status: 'processing'
        })

      if (recordError) throw recordError

      // Trigger async processing
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

  const handleManualAdd = () => {
    router.push('/onboarding/welcome')
  }

  const handleSkip = () => {
    router.push('/onboarding/welcome')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={2} />

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Import your books</h1>
        <p className="text-center text-gray-600 mb-8">
          Let's build your library! You can import your books now, or add them manually later.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {imported ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Import Started!</h2>
            <p className="text-gray-600 mb-6">
              Your books are being imported in the background. We'll email you when it's done.
              You can continue setting up your account.
            </p>
            <button
              onClick={() => router.push('/onboarding/welcome')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Import from Goodreads */}
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-bold mb-4">📚 Import from Goodreads</h2>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="font-medium mb-2">Step 1: Download your library</p>
                <ol className="text-sm text-gray-700 space-y-1 mb-3 list-decimal list-inside">
                  <li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Goodreads Export</a></li>
                  <li>Click "Export Library"</li>
                  <li>Download the CSV file</li>
                </ol>
                
                <p className="font-medium mb-2">Step 2: Upload here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-4xl block mb-2">⬆️</span>
                    <span className="text-sm text-gray-700">
                      Tap to select your CSV file
                    </span>
                  </button>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={!selectedFile || uploading}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {uploading ? 'Uploading...' : 'Start Import'}
              </button>
            </div>

            {/* Add Manually */}
            <button
              onClick={handleManualAdd}
              disabled={uploading}
              className="w-full py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="font-medium">✏️ Add books manually</span>
              <p className="text-sm text-gray-600 mt-1">
                I'll add my books one at a time
              </p>
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              disabled={uploading}
              className="w-full py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Don't import now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
