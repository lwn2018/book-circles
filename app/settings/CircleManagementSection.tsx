'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leaveCircle } from '@/lib/circle-actions'

interface Circle {
  id: string
  name: string
  description: string | null
  owner_id: string
}

export default function CircleManagementSection({ 
  circles, 
  userId 
}: { 
  circles: Circle[]
  userId: string
}) {
  if (circles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Circle Management</h3>
        <p className="text-gray-600 text-sm">You are not a member of any circles yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Circle Management</h3>
      <p className="text-gray-600 text-sm mb-4">
        Manage your circle memberships. You cannot leave circles you own.
      </p>
      
      <div className="space-y-3">
        {circles.map(circle => (
          <CircleRow 
            key={circle.id} 
            circle={circle} 
            userId={userId}
          />
        ))}
      </div>
    </div>
  )
}

function CircleRow({ circle, userId }: { circle: Circle; userId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isOwner = circle.owner_id === userId

  const handleLeave = async () => {
    setLoading(true)
    
    const result = await leaveCircle(circle.id, userId)
    
    if (result.error) {
      alert(`❌ ${result.error}`)
      setLoading(false)
      return
    }

    const message = result.recalledBooks && result.recalledBooks > 0
      ? `✅ Left circle and recalled ${result.recalledBooks} book(s)`
      : '✅ Left circle successfully'
    
    alert(message)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
        <div>
          <h4 className="font-medium">{circle.name}</h4>
          {circle.description && (
            <p className="text-sm text-gray-600 mt-1">{circle.description}</p>
          )}
          {isOwner && (
            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Owner
            </span>
          )}
        </div>
        
        {!isOwner && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm text-red-600 hover:text-red-700 hover:underline whitespace-nowrap ml-4"
          >
            Leave Circle
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Leave "{circle.name}"?</h3>
            
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
