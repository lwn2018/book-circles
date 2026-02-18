'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
  const supabase = createClient()

  if (handoffs.length === 0) return null

  const otherPerson = isGiver ? handoffs[0].receiver : handoffs[0].giver
  const hasGiftBooks = handoffs.some(h => h.books.gift_on_borrow)

  // Show contact info only to receiver and only for the giver's contact
  const showContact = !isGiver && handoffs[0].giver.contact_preference_type !== 'none'
  const contactType = handoffs[0].giver.contact_preference_type
  const contactValue = handoffs[0].giver.contact_preference_value

  // Confirm a single handoff
  const confirmSingleHandoff = async (handoff: Handoff) => {
    setConfirmingIndividual(handoff.id)
    setResultMessage(null)
    const field = isGiver ? 'giver_confirmed_at' : 'receiver_confirmed_at'
    const now = new Date().toISOString()

    console.log(`[BatchHandoff] Confirming single handoff ${handoff.id}, field: ${field}, userId: ${userId}`)

    try {
      // Update handoff confirmation
      const { error: updateError } = await supabase
        .from('handoff_confirmations')
        .update({ [field]: now })
        .eq('id', handoff.id)

      if (updateError) {
        console.error(`[BatchHandoff] Update error:`, updateError)
        throw updateError
      }

      console.log(`[BatchHandoff] Update successful, checking both_confirmed...`)

      // Check if both have confirmed
      const { data: updated, error: fetchError } = await supabase
        .from('handoff_confirmations')
        .select('giver_confirmed_at, receiver_confirmed_at, book_id')
        .eq('id', handoff.id)
        .single()

      if (fetchError) {
        console.error(`[BatchHandoff] Fetch error:`, fetchError)
      }

      console.log(`[BatchHandoff] Updated record:`, updated)

      if (updated && updated.giver_confirmed_at && updated.receiver_confirmed_at) {
        console.log(`[BatchHandoff] Both confirmed! Finalizing...`)
        // Both confirmed - finalize handoff
        await supabase
          .from('handoff_confirmations')
          .update({ both_confirmed_at: now })
          .eq('id', handoff.id)

        await supabase
          .from('books')
          .update({ status: 'borrowed' })
          .eq('id', updated.book_id)

        // Log to activity ledger
        await supabase
          .from('activity_ledger')
          .insert({
            user_id: userId,
            action: isGiver ? 'handoff_given' : 'handoff_received',
            book_id: handoff.book_id,
            metadata: {
              book_title: handoff.books.title,
              other_person: otherPerson.full_name
            }
          })
      }

      setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'success' }))
      setConfirmingIndividual(null)
      
      // Force page reload after short delay
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error(`[BatchHandoff] Failed to confirm handoff ${handoff.id}:`, error)
      setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'error' }))
      setConfirmingIndividual(null)
      setResultMessage({ type: 'error', text: 'Failed to confirm. Please try again.' })
    }
  }

  const handleConfirmAll = async () => {
    setConfirming(true)
    setResultMessage(null)
    const batchId = uuidv4() // Generate batch ID for activity ledger
    const field = isGiver ? 'giver_confirmed_at' : 'receiver_confirmed_at'
    const now = new Date().toISOString()

    console.log(`[BatchHandoff] Confirming ALL ${handoffs.length} handoffs, field: ${field}, batchId: ${batchId}`)

    // Initialize all as pending
    const initialStatus: Record<string, 'pending' | 'success' | 'error'> = {}
    handoffs.forEach(h => initialStatus[h.id] = 'pending')
    setConfirmationStatus(initialStatus)

    // Confirm each handoff individually using Promise.allSettled
    const results = await Promise.allSettled(
      handoffs.map(async (handoff) => {
        try {
          console.log(`[BatchHandoff] Processing handoff ${handoff.id} for book "${handoff.books.title}"`)
          
          // Update handoff confirmation
          const { error: updateError } = await supabase
            .from('handoff_confirmations')
            .update({ [field]: now })
            .eq('id', handoff.id)

          if (updateError) {
            console.error(`[BatchHandoff] Update error for ${handoff.id}:`, updateError)
            throw updateError
          }

          // Check if both have confirmed
          const { data: updated, error: fetchError } = await supabase
            .from('handoff_confirmations')
            .select('giver_confirmed_at, receiver_confirmed_at, book_id')
            .eq('id', handoff.id)
            .single()

          if (fetchError) {
            console.error(`[BatchHandoff] Fetch error for ${handoff.id}:`, fetchError)
          }

          console.log(`[BatchHandoff] Handoff ${handoff.id} state:`, updated)

          if (updated && updated.giver_confirmed_at && updated.receiver_confirmed_at) {
            console.log(`[BatchHandoff] Both confirmed for ${handoff.id}! Finalizing...`)
            // Both confirmed - finalize handoff
            await supabase
              .from('handoff_confirmations')
              .update({ both_confirmed_at: now })
              .eq('id', handoff.id)

            await supabase
              .from('books')
              .update({ status: 'borrowed' })
              .eq('id', updated.book_id)

            // Log to activity ledger with batch_id
            await supabase
              .from('activity_ledger')
              .insert({
                user_id: userId,
                action: isGiver ? 'handoff_given' : 'handoff_received',
                book_id: handoff.book_id,
                metadata: {
                  book_title: handoff.books.title,
                  other_person: otherPerson.full_name,
                  batch_id: batchId
                },
                batch_id: batchId
              })
          }

          setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'success' }))
          return { handoffId: handoff.id, success: true }
        } catch (error) {
          console.error(`[BatchHandoff] Failed to confirm handoff ${handoff.id}:`, error)
          setConfirmationStatus(prev => ({ ...prev, [handoff.id]: 'error' }))
          return { handoffId: handoff.id, success: false, error }
        }
      })
    )

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    console.log(`[BatchHandoff] Results: ${successes} successes, ${failures} failures`)

    setConfirming(false)

    if (successes === handoffs.length) {
      setResultMessage({ type: 'success', text: `✅ All ${handoffs.length} books confirmed!` })
      // Force page reload after showing message
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else if (successes > 0) {
      setResultMessage({ type: 'partial', text: `⚠️ Confirmed ${successes} of ${handoffs.length} books. ${failures} failed.` })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      setResultMessage({ type: 'error', text: `❌ Failed to confirm. Please try again.` })
    }
  }

  // Count remaining unconfirmed handoffs
  const remainingHandoffs = handoffs.filter(h => confirmationStatus[h.id] !== 'success')

  if (showIndividual) {
    // Render individual cards WITH action buttons
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowIndividual(false)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to batch view
        </button>
        
        <h3 className="text-lg font-semibold">
          📥 Incoming Books ({handoffs.length})
        </h3>

        {/* Result message */}
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
          const isConfirmed = confirmationStatus[handoff.id] === 'success'
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
                  
                  {/* Action buttons */}
                  {isConfirmed ? (
                    <p className="text-sm text-green-600 mt-3 font-medium">✓ Confirmed</p>
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
        
        {/* Show "Confirm remaining" button if some are unconfirmed */}
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

      {/* Result message */}
      {resultMessage && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${
          resultMessage.type === 'success' ? 'bg-green-100 text-green-800' :
          resultMessage.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {resultMessage.text}
        </div>
      )}

      {/* Book list */}
      <div className="space-y-2 mb-4">
        {handoffs.map((handoff, index) => (
          <div 
            key={handoff.id} 
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-gray-400">•</span>
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
        ))}
      </div>

      {/* Actions */}
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
