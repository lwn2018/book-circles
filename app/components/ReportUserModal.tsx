'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate behavior' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
]

type Props = {
  userId: string
  userName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ReportUserModal({ userId, userName, onClose, onSuccess }: Props) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to report a user')
        setLoading(false)
        return
      }

      const reasonLabel = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason

      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: reasonLabel,
          details: details.trim() || null
        })

      if (insertError) {
        console.error('Report error:', insertError)
        setError('Failed to submit report. Please try again.')
        setLoading(false)
        return
      }

      // Success
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Report error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1E] rounded-2xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">Report {userName}</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Help us understand what happened. We review all reports.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Reason for report
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label 
                  key={reason.value}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedReason === reason.value 
                      ? 'border-[#55B2DE] bg-[#55B2DE]/10' 
                      : 'border-zinc-700 hover:border-zinc-600 bg-[#27272A]'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedReason === reason.value ? 'border-[#55B2DE]' : 'border-zinc-500'
                  }`}>
                    {selectedReason === reason.value && (
                      <div className="w-2 h-2 rounded-full bg-[#55B2DE]" />
                    )}
                  </div>
                  <span className="text-sm text-white">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Details (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Additional details <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Tell us more about what happened..."
              className="w-full h-24 px-3 py-2 bg-[#27272A] border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#55B2DE] resize-none text-sm"
            />
            <p className="text-xs text-zinc-500 text-right">
              {details.length}/500
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedReason}
            className="flex-1 px-4 py-3 bg-[#55B2DE] text-white rounded-lg hover:bg-[#4A9FCB] disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
