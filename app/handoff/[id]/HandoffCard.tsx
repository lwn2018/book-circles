'use client'

import { useState } from 'react'
import { confirmHandoff } from '@/lib/handoff-actions'
import { useRouter } from 'next/navigation'

type HandoffCardProps = {
  handoff: {
    id: string
    giver_confirmed_at: string | null
    receiver_confirmed_at: string | null
    both_confirmed_at: string | null
    book: {
      id: string
      title: string
      cover_url: string | null
    }
  }
  role: 'giver' | 'receiver'
  userId: string
  otherPerson: {
    id: string
    full_name: string
    contact_preference_type: string | null
    contact_preference_value: string | null
  }
}

export default function HandoffCard({ handoff, role, userId, otherPerson }: HandoffCardProps) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(
    role === 'giver' ? !!handoff.giver_confirmed_at : !!handoff.receiver_confirmed_at
  )
  const router = useRouter()

  const otherConfirmed = role === 'giver' 
    ? !!handoff.receiver_confirmed_at 
    : !!handoff.giver_confirmed_at

  const handleConfirm = async () => {
    setLoading(true)
    const result = await confirmHandoff(handoff.id, userId, role)
    
    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }

    setConfirmed(true)
    setLoading(false)

    if (result.bothConfirmed) {
      // Both confirmed - check if this was a gift
      const isGift = (handoff.book as any).gift_on_borrow
      
      // If receiver and it's a gift, offer thank you prompt
      if (role === 'receiver' && isGift) {
        const sendThankYou = confirm(`Send ${otherPerson.full_name} a quick thanks?`)
        if (sendThankYou) {
          // Send thank you notification (fire and forget)
          fetch('/api/notifications/send-thanks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: otherPerson.id,
              bookTitle: handoff.book.title
            })
          })
        }
      }
      
      // Show success and redirect
      setTimeout(() => {
        router.push(role === 'giver' ? '/library' : '/dashboard/borrowed')
        router.refresh()
      }, 2000)
    } else {
      // Just this person confirmed - refresh to show updated state
      router.refresh()
    }
  }

  // Already complete
  if (handoff.both_confirmed_at) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Handoff Complete!</h1>
        <p className="text-gray-600 mb-6">
          "{handoff.book.title}" is now with {role === 'giver' ? otherPerson.full_name : 'you'}.
        </p>
        <button
          onClick={() => router.push(role === 'giver' ? '/library' : '/dashboard/borrowed')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Book Cover */}
      <div className="text-center mb-6">
        {handoff.book.cover_url ? (
          <img 
            src={handoff.book.cover_url} 
            alt={handoff.book.title}
            className="w-32 h-48 object-cover rounded shadow-md mx-auto"
          />
        ) : (
          <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center mx-auto">
            <span className="text-5xl">📚</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-2">{handoff.book.title}</h1>
      
      {/* Role-specific content */}
      {role === 'giver' ? (
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-4">
            Hand this book to <strong>{otherPerson.full_name}</strong>
          </p>
          {!confirmed && (
            <p className="text-sm text-gray-500 text-center">
              They'll reach out to arrange pickup
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-4">
            Pick up from <strong>{otherPerson.full_name}</strong>
          </p>
          
          {/* Show contact info ONLY for receiver and ONLY during active handoff */}
          {otherPerson.contact_preference_type && 
           otherPerson.contact_preference_type !== 'none' && 
           otherPerson.contact_preference_value && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Contact {otherPerson.full_name}:
              </p>
              <p className="text-sm text-blue-700">
                {otherPerson.contact_preference_type === 'phone' ? '📞 ' : '📧 '}
                {otherPerson.contact_preference_value}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status indicators */}
      {confirmed && !otherConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4 text-center">
          <p className="text-sm text-green-700">
            ✓ You confirmed! Waiting for {otherPerson.full_name} to confirm...
          </p>
        </div>
      )}

      {!confirmed && otherConfirmed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4 text-center">
          <p className="text-sm text-yellow-700">
            {otherPerson.full_name} confirmed! Please confirm when you {role === 'giver' ? 'gave' : 'received'} the book.
          </p>
        </div>
      )}

      {/* Confirmation button */}
      {!confirmed && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Confirming...' : role === 'giver' ? 'I Gave It' : 'I Got It'}
        </button>
      )}

      {confirmed && (
        <div className="text-center text-sm text-gray-500">
          Waiting for {otherPerson.full_name} to confirm
        </div>
      )}
    </div>
  )
}
