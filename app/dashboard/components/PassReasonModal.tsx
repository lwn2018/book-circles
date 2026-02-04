'use client'

import { useState } from 'react'

const PASS_REASONS = [
  { value: 'traveling', label: 'Traveling/away right now' },
  { value: 'finishing_current', label: 'Finishing current book first' },
  { value: 'available_soon', label: 'Will be available soon' },
  { value: 'remove', label: 'Remove me from queue' }
]

type Props = {
  bookTitle: string
  onPass: (reason: string, shouldRemove: boolean) => void
  onCancel: () => void
  passCount?: number
}

export default function PassReasonModal({ bookTitle, onPass, onCancel, passCount = 0 }: Props) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!selectedReason) {
      alert('Please select a reason')
      return
    }

    setLoading(true)
    const shouldRemove = selectedReason === 'remove'
    const reasonText = PASS_REASONS.find(r => r.value === selectedReason)?.label || selectedReason
    onPass(reasonText, shouldRemove)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-2">Pass on "{bookTitle}"?</h3>
        
        {passCount > 0 && (
          <p className="text-sm text-orange-600 mb-4">
            You&apos;ve passed {passCount} time{passCount > 1 ? 's' : ''}. 
            {passCount >= 2 && ' After 3 passes, you\'ll move to position 2.'}
          </p>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Let others know why you're passing for now:
        </p>

        <div className="space-y-3 mb-6">
          {PASS_REASONS.map((reason) => (
            <label 
              key={reason.value}
              className={`
                flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                ${selectedReason === reason.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input
                type="radio"
                name="pass-reason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="mr-3"
              />
              <span className={`text-sm ${reason.value === 'remove' ? 'text-red-600 font-medium' : ''}`}>
                {reason.label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedReason}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : selectedReason === 'remove' ? 'Remove' : 'Pass'}
          </button>
        </div>
      </div>
    </div>
  )
}
