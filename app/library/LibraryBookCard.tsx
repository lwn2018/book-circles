'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleBookVisibility } from '@/lib/library-actions'
import { toggleBookShelfStatus } from '@/lib/shelf-actions'
import { toggleGiftStatus } from '@/lib/gift-actions'
import BookCover from '@/app/components/BookCover'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  isbn: string | null
  status: string
  gift_on_borrow?: boolean
  current_holder?: { id: string; full_name: string }
  visibility: Array<{ circle_id: string; is_visible: boolean }>
}

type Circle = {
  id: string
  name: string
}

export default function LibraryBookCard({ 
  book, 
  userCircles,
  userId 
}: { 
  book: Book
  userCircles: Circle[]
  userId: string
}) {
  const [showVisibility, setShowVisibility] = useState(false)
  const [loading, setLoading] = useState(false)
  const [togglingShelf, setTogglingShelf] = useState(false)
  const [togglingGift, setTogglingGift] = useState(false)
  const router = useRouter()

  const handleToggleShelf = async () => {
    setTogglingShelf(true)
    
    const result = await toggleBookShelfStatus(book.id)
    
    if (result.error) {
      alert(`Error: ${result.error}`)
    } else if (result.requiresRecall) {
      alert('Recall initiated. The book will go off shelf when returned.')
    }
    
    setTogglingShelf(false)
    router.refresh()
  }

  const handleToggleGift = async () => {
    setTogglingGift(true)
    
    const newGiftStatus = !book.gift_on_borrow
    const result = await toggleGiftStatus(book.id, newGiftStatus)
    
    if (result.error) {
      alert(`Error: ${result.error}`)
    }
    
    setTogglingGift(false)
    router.refresh()
  }

  const handleToggleVisibility = async (circleId: string) => {
    setLoading(true)
    
    const currentVisibility = book.visibility.find(v => v.circle_id === circleId)
    const newVisibility = !currentVisibility?.is_visible

    const result = await toggleBookVisibility(book.id, circleId, newVisibility)
    
    if (result.error) {
      alert(`Error: ${result.error}`)
    }
    
    setLoading(false)
    router.refresh()
  }

  const getVisibilityStatus = (circleId: string) => {
    const vis = book.visibility.find(v => v.circle_id === circleId)
    return vis?.is_visible ?? true // Default to visible if no entry
  }

  const visibleInCount = userCircles.filter(c => getVisibilityStatus(c.id)).length

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
      {/* Book Cover */}
      <div className="flex gap-3 mb-3">
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          isbn={book.isbn}
          className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight mb-1 truncate">{book.title}</h3>
          {book.author && (
            <p className="text-sm text-gray-600 truncate">by {book.author}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {book.status === 'off_shelf' ? (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              📦 Off Shelf
            </span>
          ) : book.status === 'in_transit' ? (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              🚚 In Transit
            </span>
          ) : book.status === 'borrowed' && book.current_holder ? (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              📖 With {book.current_holder.full_name}
            </span>
          ) : book.status === 'available' ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              ✅ On Shelf
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {book.status}
            </span>
          )}

          {/* Gift Badge */}
          {book.gift_on_borrow && (
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-medium">
              🎁 Gift
            </span>
          )}

          {/* Shelf Toggle Button */}
          <button
            onClick={handleToggleShelf}
            disabled={togglingShelf || book.status === 'in_transit'}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={book.status === 'off_shelf' ? 'Return to shelf' : 'Take off shelf'}
          >
            {togglingShelf ? '...' : book.status === 'off_shelf' ? '↩️ Return' : '📦 Off Shelf'}
          </button>
        </div>

        {/* Gift Toggle */}
        <div>
          <button
            onClick={handleToggleGift}
            disabled={togglingGift || book.status === 'borrowed' || book.status === 'in_transit'}
            className="text-xs text-pink-600 hover:text-pink-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              (book.status === 'borrowed' || book.status === 'in_transit')
                ? 'Gift status is locked while book is with someone'
                : ''
            }
          >
            {togglingGift ? 'Updating...' : book.gift_on_borrow ? '✕ Remove gift offer' : '🎁 Offer as gift'}
          </button>
          {book.gift_on_borrow && (book.status === 'available' || book.status === 'off_shelf') && (
            <p className="text-xs text-gray-500 mt-1">
              Next person to borrow will own this book permanently
            </p>
          )}
          {(book.status === 'borrowed' || book.status === 'in_transit') && (
            <p className="text-xs text-gray-400 mt-1">
              🔒 Gift terms locked while book is with someone
            </p>
          )}
        </div>
      </div>

      {/* Visibility Summary */}
      <div className="text-sm text-gray-600 mb-2">
        Visible in {visibleInCount} of {userCircles.length} circles
      </div>

      {/* Visibility Toggle */}
      <button
        onClick={() => setShowVisibility(!showVisibility)}
        className="text-sm text-blue-600 hover:underline"
      >
        {showVisibility ? 'Hide' : 'Manage'} visibility
      </button>

      {showVisibility && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <p className="text-xs text-gray-500 mb-2">Toggle visibility per circle:</p>
          {userCircles.map(circle => {
            const isVisible = getVisibilityStatus(circle.id)
            return (
              <label 
                key={circle.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => handleToggleVisibility(circle.id)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm">{circle.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
