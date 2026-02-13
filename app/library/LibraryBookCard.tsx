'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toggleBookVisibility } from '@/lib/library-actions'
import { toggleBookShelfStatus } from '@/lib/shelf-actions'
import { toggleGiftStatus } from '@/lib/gift-actions'
import { checkBookRemovalStatus, removeBookPermanently } from '@/lib/remove-book-actions'
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
  const [showMenu, setShowMenu] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [removalStatus, setRemovalStatus] = useState<any>(null)
  const [removing, setRemoving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

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

  const handleRemoveClick = async () => {
    setShowMenu(false)
    
    // Check if removal is allowed
    const status = await checkBookRemovalStatus(book.id)
    
    if (status.error) {
      alert(`Error: ${status.error}`)
      return
    }

    setRemovalStatus(status)
    
    if (!status.canRemove) {
      // Show blocking message
      alert(status.message)
      return
    }

    // Show confirmation dialog
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = async () => {
    setRemoving(true)
    
    const result = await removeBookPermanently(book.id)
    
    if (result.error) {
      alert(`Error: ${result.error}`)
      setRemoving(false)
      return
    }

    // Success - show message and refresh
    const notifiedCount = result.notifiedUsers || 0
    alert(result.message + (notifiedCount > 0 ? ` ${notifiedCount} ${notifiedCount === 1 ? 'person' : 'people'} in the queue ${notifiedCount === 1 ? 'was' : 'were'} notified.` : ''))
    setShowRemoveDialog(false)
    setRemoving(false)
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
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 relative">
      {/* Three-Dot Menu */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={handleRemoveClick}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              🗑️ Remove from PagePass
            </button>
          </div>
        )}
      </div>

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
              🚚 Passing
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

      {/* Remove Confirmation Dialog */}
      {showRemoveDialog && removalStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Remove from PagePass?</h3>
            
            <p className="text-gray-700 mb-4">
              {removalStatus.message}
            </p>

            {removalStatus.scenario === 'with_queue' && removalStatus.queueCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  {removalStatus.queueCount} {removalStatus.queueCount === 1 ? 'person is' : 'people are'} waiting:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {removalStatus.queueMembers?.map((member: any) => (
                    <li key={member.id}>• {member.profiles?.full_name || 'Someone'}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveDialog(false)}
                disabled={removing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Remove Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
