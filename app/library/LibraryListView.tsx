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

function ListBookRow({ 
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
    
    const status = await checkBookRemovalStatus(book.id)
    
    if (status.error) {
      alert(`Error: ${status.error}`)
      return
    }

    setRemovalStatus(status)
    
    if (!status.canRemove) {
      alert(status.message)
      return
    }

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
    return vis?.is_visible ?? true
  }

  const visibleInCount = userCircles.filter(c => getVisibilityStatus(c.id)).length

  return (
    <>
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-white relative">
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

        {/* Cover */}
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          isbn={book.isbn}
          className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
        />

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{book.title}</h3>
          {book.author && (
            <p className="text-xs text-gray-600 truncate">{book.author}</p>
          )}
          
          {/* Compact Actions Row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
            {/* Status Badge */}
            {book.status === 'off_shelf' && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">📦 Off Shelf</span>
            )}
            {book.status === 'in_transit' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">🚚 Passing</span>
            )}
            {book.status === 'borrowed' && book.current_holder && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                📖 With {book.current_holder.full_name}
              </span>
            )}
            {book.status === 'available' && (
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">✅ On Shelf</span>
            )}

            {/* Gift Badge */}
            {book.gift_on_borrow && (
              <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-medium">🎁 Gift</span>
            )}

            {/* Shelf Toggle */}
            <button
              onClick={handleToggleShelf}
              disabled={togglingShelf || book.status === 'in_transit'}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {togglingShelf ? '...' : book.status === 'off_shelf' ? '↩️ Return' : '📦 Off'}
            </button>

            {/* Gift Toggle */}
            <button
              onClick={handleToggleGift}
              disabled={togglingGift || book.status === 'borrowed' || book.status === 'in_transit'}
              className="text-pink-600 hover:text-pink-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {togglingGift ? '...' : book.gift_on_borrow ? '✕ Gift' : '🎁 Gift'}
            </button>

            {/* Visibility Summary & Toggle */}
            <span className="text-gray-600">
              {visibleInCount}/{userCircles.length} circles
            </span>
            <button
              onClick={() => setShowVisibility(!showVisibility)}
              className="text-blue-600 hover:underline"
            >
              {showVisibility ? 'Hide' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Visibility Dropdown (appears below the row when toggled) */}
      {showVisibility && (
        <div className="ml-14 mt-1 p-3 border-l-2 border-blue-200 bg-gray-50 rounded space-y-2">
          <p className="text-xs text-gray-500 mb-2">Toggle visibility per circle:</p>
          {userCircles.map(circle => {
            const isVisible = getVisibilityStatus(circle.id)
            return (
              <label 
                key={circle.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded"
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
    </>
  )
}

export default function LibraryListView({ 
  books, 
  userId,
  userCircles 
}: { 
  books: Book[]
  userId: string
  userCircles: Circle[]
}) {
  if (books.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {books.map((book) => (
        <ListBookRow 
          key={book.id} 
          book={book} 
          userCircles={userCircles}
          userId={userId}
        />
      ))}
    </div>
  )
}
