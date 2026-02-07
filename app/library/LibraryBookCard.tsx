'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleBookVisibility } from '@/lib/library-actions'
import { toggleBookShelfStatus } from '@/lib/shelf-actions'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  isbn: string | null
  status: string
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
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📚</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight mb-1 truncate">{book.title}</h3>
          {book.author && (
            <p className="text-sm text-gray-600 truncate">by {book.author}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 flex items-center gap-2">
        {book.status === 'off_shelf' ? (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            📦 Off Shelf
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
