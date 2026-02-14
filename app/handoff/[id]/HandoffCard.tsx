'use client'

import { useState } from 'react'
import { confirmHandoff } from '@/lib/handoff-actions'
import { useRouter } from 'next/navigation'
import { phoneToSmsLink } from '@/lib/formatPhone'

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
    contact_email?: string | null
    contact_phone?: string | null
  }
}

export default function HandoffCard({ handoff, role, userId, otherPerson }: HandoffCardProps) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(
    role === 'giver' ? !!handoff.giver_confirmed_at : !!handoff.receiver_confirmed_at
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const otherConfirmed = role === 'giver' 
    ? !!handoff.receiver_confirmed_at 
    : !!handoff.giver_confirmed_at

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await confirmHandoff(handoff.id, userId, role)
      console.log('Confirmation result:', result)
      
      if (result.error) {
        console.error('Confirmation error:', result.error)
        alert('Error: ' + result.error)
        setLoading(false)
        return
      }

    setConfirmed(true)
    setLoading(false)

      if (result.bothConfirmed) {
        // Both confirmed! Show success animation
        setLoading(false)
        setConfirmed(true)
        setShowSuccess(true)
        
        // Redirect after animation completes (book flies to shelf)
        setTimeout(() => {
          router.push('/shelf')
          router.refresh()
        }, 1800) // 1.8s matches the 1.5s animation + small buffer
      } else {
        // Just this person confirmed - refresh to show updated state
        setLoading(false)
        setConfirmed(true)
        router.refresh()
      }
    } catch (error: any) {
      console.error('Unexpected error during confirmation:', error)
      alert('Unexpected error: ' + (error.message || 'Unknown error'))
      setLoading(false)
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

  // Success animation: book flies to shelf icon
  if (showSuccess) {
    return (
      <>
        {/* Semi-transparent overlay */}
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30" />
        
        {/* Flying book animation */}
        <div 
          className="fixed z-50 animate-fly-to-shelf"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'flyToShelf 1.5s cubic-bezier(0.65, 0, 0.35, 1) forwards'
          }}
        >
          {handoff.book.cover_url ? (
            <img 
              src={handoff.book.cover_url} 
              alt={handoff.book.title}
              className="w-32 h-48 object-cover rounded shadow-lg"
            />
          ) : (
            <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center shadow-lg">
              <span className="text-5xl">📚</span>
            </div>
          )}
        </div>

        {/* Success message */}
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 text-center">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            Enjoy {role === 'receiver' ? '' : 'sharing '}"{handoff.book.title}"!
          </h2>
        </div>

        <style jsx>{`
          @keyframes flyToShelf {
            0% {
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            60% {
              opacity: 1;
            }
            100% {
              top: calc(100vh - 80px);
              left: calc(100vw - 80px);
              transform: translate(-50%, -50%) scale(0.3);
              opacity: 0.5;
            }
          }
        `}</style>
      </>
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
          {(otherPerson.contact_email || otherPerson.contact_phone) && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Contact {otherPerson.full_name}:
              </p>
              <div className="space-y-1">
                {otherPerson.contact_email && (
                  <a 
                    href={`mailto:${otherPerson.contact_email}`}
                    className="block text-sm text-blue-700 hover:underline"
                  >
                    📧 {otherPerson.contact_email}
                  </a>
                )}
                {otherPerson.contact_phone && (
                  <a 
                    href={phoneToSmsLink(otherPerson.contact_phone)}
                    className="block text-sm text-blue-700 hover:underline"
                  >
                    📱 {otherPerson.contact_phone}
                  </a>
                )}
              </div>
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
