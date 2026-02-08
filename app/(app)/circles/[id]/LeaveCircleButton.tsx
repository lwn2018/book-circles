'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leaveCircle } from '@/lib/circle-actions'

export default function LeaveCircleButton({ 
  circleId, 
  circleName,
  userId,
  isOwner 
}: { 
  circleId: string
  circleName: string
  userId: string
  isOwner: boolean
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLeave = async () => {
    setLoading(true)
    
    const result = await leaveCircle(circleId, userId)
    
    if (result.error) {
      alert(`❌ ${result.error}`)
      setLoading(false)
      return
    }

    const message = result.recalledBooks && result.recalledBooks > 0
      ? `✅ Left circle and recalled ${result.recalledBooks} book(s)`
      : '✅ Left circle successfully'
    
    alert(message)
    router.push('/dashboard')
    router.refresh()
  }

  if (isOwner) {
    return null // Owners can't leave their own circle
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-sm text-red-600 hover:text-red-700 hover:underline"
      >
        Leave Circle
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Leave "{circleName}"?</h3>
            
            <div className="space-y-3 mb-6 text-sm">
              <p>When you leave this circle:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>You must return all borrowed books first</li>
                <li>Your books will be automatically recalled</li>
                <li>Your books will be hidden from this circle</li>
                <li>You'll lose access to all circle books</li>
              </ul>
              <p className="text-red-600 font-medium mt-3">
                ⚠️ This action cannot be undone. You'll need a new invite to rejoin.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Leaving...' : 'Leave Circle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
