'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookCover from '@/app/components/BookCover'
import { v4 as uuidv4 } from 'uuid'

type Handoff = {
  id: string
  book_id: string
  giver_id: string
  receiver_id: string
  giver_confirmed_at: string | null
  receiver_confirmed_at: string | null
  both_confirmed_at: string | null
  books: {
    id: string
    title: string
    author: string | null
    cover_url: string | null
    isbn: string | null
    gift_on_borrow?: boolean
  }
  giver: {
    id: string
    full_name: string
    contact_preference_type?: string
    contact_preference_value?: string
  }
  receiver: {
    id: string
    full_name: string
    contact_preference_type?: string
    contact_preference_value?: string
  }
}

type BatchHandoffGroupProps = {
  handoffs: Handoff[]
  userId: string
  isGiver: boolean
}

export default function BatchHandoffGroup({ 
  handoffs, 
  userId, 
  isGiver 
}: BatchHandoffGroupProps) {
  const [confirming, setConfirming] = useState(false)
  const [confirmingIndividual, setConfirmingIndividual] = useState<string | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [showIndividual, setShowIndividual] = useState(false)
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error' | 'partial', text: string } | null>(null)
  const router = useRouter()

  if (handoffs.length === 0) return null

  const otherPerson = isGiver ? handoffs[0].receiver : handoffs[0].giver
  const hasGiftBooks = handoffs.some(h => h.books.gift_on_borrow)

  // Check if current user has already confirmed ALL handoffs in this batch
  const userAlreadyConfirmedAll = handoffs.every(h => 
    isGiver ? h.giver_confirmed_at !== null : h.receiver_confirmed_at !== null
  )

  // Check if other party has confirmed any
  const otherPartyConfirmedAll = handoffs.every(h =>
    isGiver ? h.receiver_confirmed_at !== null : h.giver_confirmed_at !== null
  )

  // Show contact info only to receiver and only for the giver's contact
  const showContact = !isGiver && handoffs[0].giver.contact_preference_type !== 'none'
  const contactType = handoffs[0].giver.contact_preference_type
  const contactValue = handoffs[0].giver.contact_preference_value

  // Confirm a single handoff via API
  const confirmSingleHandoff = async (handoff: Handoff) => {
    setConfirmingIndividual(handoff.id)
    setResultMessage(null)

    console.log(`[BatchHandoff] Confirming single handoff ${handoff.id} via API`)

    try {
      const response = await fetch('/api/handoffs/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoffId: handoff.id, isGiver })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm')
      }

      console.log(`[BatchHandoff] API response:`, data)

      setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'success' }))
      setConfirmingIndividual(null)
      
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error(`[BatchHandoff] Failed to confirm handoff ${handoff.id}:`, error)
      setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'error' }))
      setConfirmingIndividual(null)
      setResultMessage({ type: 'error', text: error.message || 'Failed to confirm. Please try again.' })
    }
  }

  const handleConfirmAll = async () => {
    setConfirming(true)
    setResultMessage(null)

    // Only confirm handoffs that user hasn't already confirmed
    const handoffsToConfirm = handoffs.filter(h =>
      isGiver ? h.giver_confirmed_at === null : h.receiver_confirmed_at === null
    )

    if (handoffsToConfirm.length === 0) {
      setResultMessage({ type: 'success', text: 'Already confirmed! Waiting for other party.' })
      setConfirming(false)
      return
    }

    console.log(`[BatchHandoff] Confirming ${handoffsToConfirm.length} handoffs via API`)

    const initialStatus: Record<string, 'pending' | 'success' | 'error'> = {}
    handoffsToConfirm.forEach(h => initialStatus[h.id] = 'pending')
    setConfirmationStatus(initialStatus)

    const results = await Promise.allSettled(
      handoffsToConfirm.map(async (handoff) => {
        try {
          const response = await fetch('/api/handoffs/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handoffId: handoff.id, isGiver })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to confirm')
          }

          console.log(`[BatchHandoff] Handoff ${handoff.id} confirmed:`, data)
          setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'success' }))
          return { handoffId: handoff.id, success: true, bothConfirmed: data.bothConfirmed }
        } catch (error: any) {
          console.error(`[BatchHandoff] Failed to confirm handoff ${handoff.id}:`, error)
          setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'error' }))
          return { handoffId: handoff.id, success: false, error }
        }
      })
    )

    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
    const anyBothConfirmed = results.some(r => r.status === 'fulfilled' && r.value.bothConfirmed)

    console.log(`[BatchHandoff] Results: ${successes} successes, ${failures} failures, bothConfirmed: ${anyBothConfirmed}`)

    setConfirming(false)

    if (successes === handoffsToConfirm.length) {
      const message = anyBothConfirmed 
        ? `✅ All ${handoffsToConfirm.length} books confirmed and complete!`
        : `✅ Confirmed! Waiting for ${otherPerson.full_name}.`
      setResultMessage({ type: 'success', text: message })
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else if (successes > 0) {
      setResultMessage({ type: 'partial', text: `⚠️ Confirmed ${successes} of ${handoffsToConfirm.length}. ${failures} failed.` })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      setResultMessage({ type: 'error', text: `❌ Failed to confirm. Please try again.` })
    }
  }

  // If user already confirmed all, show waiting state
  if (userAlreadyConfirmedAll) {
    return (
      <div className="bg-white border-2 border-green-200 rounded-lg p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>✅ {otherPerson.full_name}</span>
            <span className="text-sm font-normal text-gray-600">
              — {handoffs.length} book{handoffs.length > 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-green-700 mt-2 font-medium">
            You confirmed! Waiting for {otherPerson.full_name} to confirm.
          </p>
        </div>

        <div className="space-y-2">
          {handoffs.map((handoff) => (
            <div key={handoff.id} className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>
                {handoff.books.title}
                {handoff.books.gift_on_borrow && (
                  <span className="text-pink-600 ml-2">
                    ({isGiver ? 'gift' : 'yours to keep!'})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const remainingHandoffs = handoffs.filter(h => 
    confirmationStatus[h.id] !== 'success' && 
    (isGiver ? h.giver_confirmed_at === null : h.receiver_confirmed_at === null)
  )

  if (showIndividual) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowIndividual(false)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to batch view
        </button>
        
        <h3 className="text-lg font-semibold">
          {isGiver ? '📤 Handing Off' : '📥 Receiving'} ({handoffs.length})
        </h3>

        {resultMessage && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            resultMessage.type === 'success' ? 'bg-green-100 text-green-800' :
            resultMessage.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {resultMessage.text}
          </div>
        )}
        
        {handoffs.map(handoff => {
          const alreadyConfirmed = isGiver ? handoff.giver_confirmed_at !== null : handoff.receiver_confirmed_at !== null
          const isConfirmed = confirmationStatus[handoff.id] === 'success' || alreadyConfirmed
          const isConfirmingThis = confirmingIndividual === handoff.id
          const hasError = confirmationStatus[handoff.id] === 'error'
          
          return (
            <div 
              key={handoff.id} 
              className={`bg-white border rounded-lg p-4 ${
                isConfirmed ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                <BookCover
                  coverUrl={handoff.books.cover_url}
                  title={handoff.books.title}
                  author={handoff.books.author}
                  isbn={handoff.books.isbn}
                  className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{handoff.books.title}</h3>
                  {handoff.books.author && (
                    <p className="text-sm text-gray-600">{handoff.books.author}</p>
                  )}
                  {handoff.books.gift_on_borrow && (
                    <p className="text-sm text-pink-600 mt-1">🎁 Yours to keep</p>
                  )}
                  
                  {isConfirmed ? (
                    <p className="text-sm text-green-600 mt-3 font-medium">
                      ✓ {alreadyConfirmed ? `Confirmed - waiting for ${otherPerson.full_name}` : 'Confirmed'}
                    </p>
                  ) : hasError ? (
                    <div className="mt-3">
                      <p className="text-sm text-red-600 mb-2">✗ Failed - try again</p>
                      <button
                        onClick={() => confirmSingleHandoff(handoff)}
                        disabled={isConfirmingThis}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {isConfirmingThis ? 'Confirming...' : isGiver ? 'I gave it' : 'I got it'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => confirmSingleHandoff(handoff)}
                      disabled={isConfirmingThis}
                      className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isConfirmingThis ? 'Confirming...' : isGiver ? 'I gave it' : 'I got it'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {remainingHandoffs.length > 1 && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={handleConfirmAll}
              disabled={confirming}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {confirming ? 'Confirming...' : `Confirm all ${remainingHandoffs.length} remaining`}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{otherPerson.full_name}</span>
          <span className="text-sm font-normal text-gray-600">
            — {handoffs.length} book{handoffs.length > 1 ? 's' : ''} to hand off
          </span>
        </h3>

        {otherPartyConfirmedAll && (
          <p className="text-blue-700 text-sm mt-1">
            {otherPerson.full_name} already confirmed — your turn!
          </p>
        )}

        {showContact && contactValue && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
            <p className="text-xs text-blue-700 font-medium mb-1">
              Contact {handoffs[0].giver.full_name}:
            </p>
            <p className="text-sm text-blue-900">
              {contactType === 'phone' ? '📱' : '📧'} {contactValue}
            </p>
          </div>
        )}
      </div>

      {resultMessage && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${
          resultMessage.type === 'success' ? 'bg-green-100 text-green-800' :
          resultMessage.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {resultMessage.text}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {handoffs.map((handoff) => {
          const alreadyConfirmed = isGiver ? handoff.giver_confirmed_at !== null : handoff.receiver_confirmed_at !== null
          return (
            <div key={handoff.id} className="flex items-center gap-2 text-sm">
              <span className={alreadyConfirmed ? "text-green-500" : "text-gray-400"}>
                {alreadyConfirmed ? '✓' : '•'}
              </span>
              <span>
                {handoff.books.title}
                {handoff.books.gift_on_borrow && (
                  <span className="text-pink-600 ml-2">
                    ({isGiver ? 'gift' : 'yours to keep!'})
                  </span>
                )}
              </span>
              {confirmationStatus[handoff.id] === 'success' && (
                <span className="text-green-600 ml-auto">✓</span>
              )}
              {confirmationStatus[handoff.id] === 'error' && (
                <span className="text-red-600 ml-auto">✗</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleConfirmAll}
          disabled={confirming}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {confirming ? 'Confirming...' : isGiver ? 'Confirm all handed off' : 'Got them all'}
        </button>
        <button
          onClick={() => setShowIndividual(true)}
          disabled={confirming}
          className="text-sm text-blue-600 hover:underline"
        >
          or tap to handle individually
        </button>
      </div>

      {hasGiftBooks && (
        <p className="text-xs text-pink-600 mt-3 italic">
          * Gift books will transfer ownership to {otherPerson.full_name}
        </p>
      )}
    </div>
  )
}
