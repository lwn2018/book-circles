'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'

type Person = {
  id: string
  full_name: string
  avatar_type?: string | null
  avatar_id?: string | null
  avatar_url?: string | null
}

type Handoff = {
  id: string
  giver_id: string
  receiver_id: string
  giver_confirmed_at: string | null
  receiver_confirmed_at: string | null
  books: {
    id: string
    title: string
    author: string | null
    cover_url: string | null
    isbn: string | null
  }
  giver: Person
  receiver: Person
}

type BatchSelectorProps = {
  incoming: Handoff[]
  outgoing: Handoff[]
  userId: string
}

export default function BatchSelector({ incoming, outgoing, userId }: BatchSelectorProps) {
  const [selectedIncoming, setSelectedIncoming] = useState<Set<string>>(new Set())
  const [selectedOutgoing, setSelectedOutgoing] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)
  const router = useRouter()

  const toggleIncoming = (id: string) => {
    setSelectedIncoming(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleOutgoing = (id: string) => {
    setSelectedOutgoing(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllIncoming = () => {
    setSelectedIncoming(new Set(incoming.map(h => h.id)))
  }

  const selectAllOutgoing = () => {
    setSelectedOutgoing(new Set(outgoing.map(h => h.id)))
  }

  const totalSelected = selectedIncoming.size + selectedOutgoing.size

  const handleConfirmSelected = async () => {
    if (totalSelected === 0) return
    
    setConfirming(true)
    setResults(null)

    let success = 0
    let failed = 0

    // Confirm incoming (user is receiver)
    for (const handoffId of selectedIncoming) {
      try {
        const response = await fetch('/api/handoffs/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handoffId, isGiver: false })
        })
        if (response.ok) {
          success++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    // Confirm outgoing (user is giver)
    for (const handoffId of selectedOutgoing) {
      try {
        const response = await fetch('/api/handoffs/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handoffId, isGiver: true })
        })
        if (response.ok) {
          success++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setConfirming(false)
    setResults({ success, failed })

    // Refresh after a moment
    setTimeout(() => {
      router.refresh()
      if (failed === 0) {
        router.push('/shelf')
      }
    }, 1500)
  }

  // Group handoffs by the other person for better UX
  const groupByPerson = (handoffs: Handoff[], isGiver: boolean) => {
    const groups: Record<string, { person: Person; handoffs: Handoff[] }> = {}
    for (const h of handoffs) {
      const other = isGiver ? h.receiver : h.giver
      if (!groups[other.id]) {
        groups[other.id] = { person: other, handoffs: [] }
      }
      groups[other.id].handoffs.push(h)
    }
    return Object.values(groups)
  }

  const incomingGroups = groupByPerson(incoming, false)
  const outgoingGroups = groupByPerson(outgoing, true)

  return (
    <div className="space-y-8">
      {/* Results banner */}
      {results && (
        <div className={`p-4 rounded-xl ${
          results.failed === 0 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-amber-500/20 border border-amber-500/30'
        }`}>
          <p className={`text-sm font-medium ${
            results.failed === 0 ? 'text-green-400' : 'text-amber-400'
          }`}>
            {results.failed === 0 
              ? `✅ Confirmed ${results.success} book${results.success !== 1 ? 's' : ''}!`
              : `⚠️ Confirmed ${results.success}, ${results.failed} failed`
            }
          </p>
        </div>
      )}

      {/* Incoming Books */}
      {incoming.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400">📥</span> 
              Pickup ({incoming.length})
            </h2>
            <button
              onClick={selectAllIncoming}
              className="text-sm text-[#55B2DE] hover:underline"
            >
              Select all
            </button>
          </div>

          <div className="space-y-4">
            {incomingGroups.map(({ person, handoffs }) => (
              <div key={person.id} className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    avatarType={person.avatar_type as any}
                    avatarId={person.avatar_id}
                    avatarUrl={person.avatar_url}
                    userName={person.full_name}
                    userId={person.id}
                    size="sm"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">From {person.full_name}</p>
                    <p className="text-white/50 text-xs">{handoffs.length} book{handoffs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {handoffs.map(h => (
                    <label 
                      key={h.id}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedIncoming.has(h.id) 
                          ? 'bg-emerald-500/20 border border-emerald-500/30' 
                          : 'bg-white/5 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIncoming.has(h.id)}
                        onChange={() => toggleIncoming(h.id)}
                        className="w-5 h-5 rounded border-2 border-white/30 bg-transparent checked:bg-[#55B2DE] checked:border-[#55B2DE] focus:ring-[#55B2DE] focus:ring-offset-0"
                      />
                      <BookCover
                        coverUrl={h.books.cover_url}
                        title={h.books.title}
                        author={h.books.author}
                        isbn={h.books.isbn}
                        className="w-12 h-16 rounded shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{h.books.title}</p>
                        {h.books.author && (
                          <p className="text-white/50 text-xs truncate">{h.books.author}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing Books */}
      {outgoing.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-amber-400">📤</span> 
              Handoff ({outgoing.length})
            </h2>
            <button
              onClick={selectAllOutgoing}
              className="text-sm text-[#55B2DE] hover:underline"
            >
              Select all
            </button>
          </div>

          <div className="space-y-4">
            {outgoingGroups.map(({ person, handoffs }) => (
              <div key={person.id} className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    avatarType={person.avatar_type as any}
                    avatarId={person.avatar_id}
                    avatarUrl={person.avatar_url}
                    userName={person.full_name}
                    userId={person.id}
                    size="sm"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">To {person.full_name}</p>
                    <p className="text-white/50 text-xs">{handoffs.length} book{handoffs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {handoffs.map(h => (
                    <label 
                      key={h.id}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedOutgoing.has(h.id) 
                          ? 'bg-amber-500/20 border border-amber-500/30' 
                          : 'bg-white/5 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOutgoing.has(h.id)}
                        onChange={() => toggleOutgoing(h.id)}
                        className="w-5 h-5 rounded border-2 border-white/30 bg-transparent checked:bg-[#55B2DE] checked:border-[#55B2DE] focus:ring-[#55B2DE] focus:ring-offset-0"
                      />
                      <BookCover
                        coverUrl={h.books.cover_url}
                        title={h.books.title}
                        author={h.books.author}
                        isbn={h.books.isbn}
                        className="w-12 h-16 rounded shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{h.books.title}</p>
                        {h.books.author && (
                          <p className="text-white/50 text-xs truncate">{h.books.author}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating confirm button */}
      {totalSelected > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 pb-4">
          <button
            onClick={handleConfirmSelected}
            disabled={confirming}
            className="w-full py-4 bg-[#55B2DE] text-white rounded-xl font-semibold shadow-lg hover:bg-[#4A9FCB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming 
              ? 'Confirming...' 
              : `Confirm ${totalSelected} book${totalSelected !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}
    </div>
  )
}
