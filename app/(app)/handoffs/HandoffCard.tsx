'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type HandoffCardProps = {
  handoff: any
  userId: string
}

export default function HandoffCard({ handoff, userId }: HandoffCardProps) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isGiver = handoff.giver_id === userId
  const isReceiver = handoff.receiver_id === userId
  const hasConfirmed = isGiver ? handoff.giver_confirmed_at : handoff.receiver_confirmed_at
  const otherConfirmed = isGiver ? handoff.receiver_confirmed_at : handoff.giver_confirmed_at
  const otherPerson = isGiver ? handoff.receiver : handoff.giver
  const book = handoff.books

  // Show contact info only to receiver and only for the giver's contact
  const showContact = isReceiver && handoff.giver.contact_preference_type !== 'none'
  const contactType = handoff.giver.contact_preference_type
  const contactValue = handoff.giver.contact_preference_value

  const handleConfirm = async () => {
    setConfirming(true)

    const field = isGiver ? 'giver_confirmed_at' : 'receiver_confirmed_at'
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('handoff_confirmations')
      .update({ [field]: now })
      .eq('id', handoff.id)

    if (updateError) {
      console.error('Confirmation error:', updateError)
      alert(`Failed to confirm: ${updateError.message}`)
      setConfirming(false)
      return
    }

    // Check if both have confirmed
    const { data: updated } = await supabase
      .from('handoff_confirmations')
      .select('giver_confirmed_at, receiver_confirmed_at')
      .eq('id', handoff.id)
      .single()

    if (updated && updated.giver_confirmed_at && updated.receiver_confirmed_at) {
      // Both confirmed - finalize handoff
      await supabase
        .from('handoff_confirmations')
        .update({ both_confirmed_at: now })
        .eq('id', handoff.id)

      await supabase
        .from('books')
        .update({ status: 'borrowed' })
        .eq('id', book.id)

      alert(`Handoff complete! ${isReceiver ? 'Enjoy reading!' : 'Thanks for sharing!'}`)
    } else {
      // Notify other person
      alert(`Confirmed! Waiting for ${otherPerson.full_name} to confirm.`)
    }

    setConfirming(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex gap-4">
        {/* Book Cover */}
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📚</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
          {book.author && (
            <p className="text-sm text-gray-600 mb-3">{book.author}</p>
          )}

          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-600">
                {isGiver ? 'Giving to:' : 'Getting from:'}
              </span>{' '}
              <span className="font-medium">{otherPerson.full_name}</span>
            </p>

            {showContact && contactValue && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Contact {handoff.giver.full_name}:
                </p>
                <p className="text-sm text-blue-900">
                  {contactType === 'phone' ? '📱' : '📧'} {contactValue}
                </p>
              </div>
            )}

            {!showContact && isReceiver && (
              <p className="text-xs text-gray-500 italic">
                Owner hasn't shared contact info
              </p>
            )}

            {otherConfirmed && !hasConfirmed && (
              <p className="text-sm text-blue-700 font-medium">
                ✓ {otherPerson.full_name} confirmed
              </p>
            )}

            {hasConfirmed && !otherConfirmed && (
              <p className="text-sm text-gray-600">
                ✓ You confirmed · Waiting for {otherPerson.full_name}
              </p>
            )}
          </div>

          {/* Confirmation Button */}
          {!hasConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {confirming ? 'Confirming...' : isGiver ? 'I gave it' : 'I got it'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
