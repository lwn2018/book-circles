'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/app/components/Avatar'

type Recipient = {
  id: string
  full_name: string
  avatar_type?: string | null
  avatar_id?: string | null
  avatar_url?: string | null
  circles: Array<{ id: string; name: string }>
}

type Props = {
  bookId: string
  bookTitle: string
  recipients: Recipient[]
}

export default function GiftRecipientSelector({ bookId, bookTitle, recipients }: Props) {
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [gifting, setGifting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGift = async () => {
    if (!selectedRecipient) return
    
    setGifting(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/${bookId}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedRecipient })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to gift book')
      }

      // Success - redirect to handoff page
      if (data.handoffId) {
        router.push(`/handoff/${data.handoffId}`)
      } else {
        router.push('/library')
      }
    } catch (err: any) {
      setError(err.message)
      setGifting(false)
    }
  }

  const selectedPerson = recipients.find(r => r.id === selectedRecipient)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-4">Select Recipient</h3>
        <div className="space-y-3">
          {recipients.map((recipient) => (
            <button
              key={recipient.id}
              onClick={() => setSelectedRecipient(recipient.id)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-colors ${
                selectedRecipient === recipient.id
                  ? 'bg-pink-500/20 border-2 border-pink-500/50'
                  : 'bg-white/5 border-2 border-transparent hover:border-white/10'
              }`}
            >
              <div className={`ring-2 ${selectedRecipient === recipient.id ? 'ring-pink-500' : 'ring-transparent'} ring-offset-2 ring-offset-[#121212] rounded-full`}>
                <Avatar
                  avatarType={recipient.avatar_type as any}
                  avatarId={recipient.avatar_id}
                  avatarUrl={recipient.avatar_url}
                  userName={recipient.full_name}
                  userId={recipient.id}
                  size="md"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{recipient.full_name}</p>
                <p className="text-white/50 text-sm">
                  {recipient.circles.map(c => c.name).join(', ')}
                </p>
              </div>
              {selectedRecipient === recipient.id && (
                <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {selectedPerson && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
          <p className="text-pink-300 text-sm">
            <strong>"{bookTitle}"</strong> will be permanently transferred to{' '}
            <strong>{selectedPerson.full_name}</strong>. They'll need to confirm 
            receiving the book to complete the handoff.
          </p>
        </div>
      )}

      <button
        onClick={handleGift}
        disabled={!selectedRecipient || gifting}
        className="w-full py-4 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {gifting ? 'Gifting...' : selectedRecipient ? `Gift to ${selectedPerson?.full_name}` : 'Select a recipient'}
      </button>
    </div>
  )
}
