'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const [showMenu, setShowMenu] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [togglingShelf, setTogglingShelf] = useState(false)
  const [togglingGift, setTogglingGift] = useState(false)
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
    setShowDetails(false)
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

  // Status badge
  const getStatusInfo = () => {
    switch (book.status) {
      case 'off_shelf':
        return { emoji: '📦', label: 'Off Shelf', color: 'bg-zinc-600' }
      case 'in_transit':
      case 'ready_for_next':
        return { emoji: '🚚', label: 'Passing', color: 'bg-[#55B2DE]' }
      case 'borrowed':
        return { emoji: '📖', label: 'Lent', color: 'bg-amber-600' }
      default:
        return null // Available - no badge needed
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <>
      <div className="group relative">
        {/* Book Cover */}
        <div 
          className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#27272A] cursor-pointer"
          onClick={() => setShowDetails(true)}
        >
          <BookCover
            coverUrl={book.cover_url}
            title={book.title}
            author={book.author}
            isbn={book.isbn}
            status={book.status as any}
            className="w-full h-full object-cover"
          />
          
          {/* Status Badge */}
          {statusInfo && (
            <div className={`absolute top-1 left-1 ${statusInfo.color} text-white text-xs px-1.5 py-0.5 rounded font-medium`}>
              {statusInfo.emoji}
            </div>
          )}

          {/* Gift Badge */}
          {book.gift_on_borrow && (
            <div className="absolute top-1 right-1 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              🎁
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">View Details</span>
          </div>
        </div>

        {/* Title & Author */}
        <div className="mt-2">
          <h3 className="text-sm font-medium text-white truncate">{book.title}</h3>
          {book.author && (
            <p className="text-xs text-zinc-400 truncate">{book.author}</p>
          )}
        </div>

        {/* Three-dot Menu */}
        <div className="absolute top-1 right-1 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="More options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-[#27272A] rounded-lg shadow-lg border border-zinc-700 py-1 z-20">
              <button
                onClick={() => {
                  setShowMenu(false)
                  setShowDetails(true)
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                📋 View Details
              </button>
              <button
                onClick={handleRemoveClick}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
              >
                🗑️ Remove Book
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <BookDetailsModal
          book={book}
          userCircles={userCircles}
          onClose={() => setShowDetails(false)}
          onToggleShelf={handleToggleShelf}
          onToggleGift={handleToggleGift}
          onToggleVisibility={handleToggleVisibility}
          onRemove={handleRemoveClick}
          getVisibilityStatus={getVisibilityStatus}
          togglingShelf={togglingShelf}
          togglingGift={togglingGift}
          loading={loading}
        />
      )}

      {/* Remove Confirmation Dialog */}
      {showRemoveDialog && removalStatus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#27272A] rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">Remove from PagePass?</h3>
            
            <p className="text-zinc-300 mb-4">{removalStatus.message}</p>

            {removalStatus.scenario === 'with_queue' && removalStatus.queueCount > 0 && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-200 font-medium mb-2">
                  {removalStatus.queueCount} {removalStatus.queueCount === 1 ? 'person is' : 'people are'} waiting:
                </p>
                <ul className="text-sm text-amber-300 space-y-1">
                  {removalStatus.queueMembers?.map((member: any) => (
                    <li key={member.id}>• {member.profiles?.full_name || 'Someone'}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-300 font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveDialog(false)}
                disabled={removing}
                className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
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

function BookDetailsModal({
  book,
  userCircles,
  onClose,
  onToggleShelf,
  onToggleGift,
  onToggleVisibility,
  onRemove,
  getVisibilityStatus,
  togglingShelf,
  togglingGift,
  loading
}: {
  book: Book
  userCircles: Circle[]
  onClose: () => void
  onToggleShelf: () => void
  onToggleGift: () => void
  onToggleVisibility: (circleId: string) => void
  onRemove: () => void
  getVisibilityStatus: (circleId: string) => boolean
  togglingShelf: boolean
  togglingGift: boolean
  loading: boolean
}) {
  const [showVisibility, setShowVisibility] = useState(false)
  const visibleInCount = userCircles.filter(c => getVisibilityStatus(c.id)).length

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 bg-zinc-600 rounded-full" />
        </div>

        {/* Book Info */}
        <div className="flex gap-4 p-4 pb-0">
          <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden bg-[#27272A] flex-shrink-0">
            <BookCover
              coverUrl={book.cover_url}
              title={book.title}
              author={book.author}
              isbn={book.isbn}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-1">{book.title}</h2>
            {book.author && (
              <p className="text-sm text-zinc-400 mb-2">by {book.author}</p>
            )}
            
            {/* Status */}
            <div className="flex flex-wrap gap-2">
              {book.status === 'off_shelf' && (
                <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">📦 Off Shelf</span>
              )}
              {book.status === 'in_transit' && (
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">🚚 Passing</span>
              )}
              {book.status === 'borrowed' && book.current_holder && (
                <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-1 rounded">
                  📖 With {book.current_holder.full_name}
                </span>
              )}
              {book.status === 'available' && (
                <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">✅ On Shelf</span>
              )}
              {book.gift_on_borrow && (
                <span className="text-xs bg-pink-900/50 text-pink-300 px-2 py-1 rounded">🎁 Gift</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* Shelf Toggle */}
          <button
            onClick={onToggleShelf}
            disabled={togglingShelf || book.status === 'in_transit'}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#27272A] rounded-lg text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{book.status === 'off_shelf' ? '↩️ Return to Shelf' : '📦 Take Off Shelf'}</span>
            {togglingShelf && <span className="text-zinc-500">...</span>}
          </button>

          {/* Gift Toggle */}
          <button
            onClick={onToggleGift}
            disabled={togglingGift || book.status === 'borrowed' || book.status === 'in_transit'}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#27272A] rounded-lg text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{book.gift_on_borrow ? '✕ Remove Gift Offer' : '🎁 Offer as Gift'}</span>
            {togglingGift && <span className="text-zinc-500">...</span>}
          </button>

          {/* Visibility */}
          <button
            onClick={() => setShowVisibility(!showVisibility)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#27272A] rounded-lg text-white hover:bg-zinc-700 transition-colors"
          >
            <span>👁️ Circle Visibility</span>
            <span className="text-zinc-400">{visibleInCount}/{userCircles.length}</span>
          </button>

          {showVisibility && (
            <div className="bg-[#27272A] rounded-lg p-3 space-y-2">
              {userCircles.map(circle => {
                const isVisible = getVisibilityStatus(circle.id)
                return (
                  <label 
                    key={circle.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-700/50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onToggleVisibility(circle.id)}
                      disabled={loading}
                      className="w-5 h-5 text-[#55B2DE] bg-zinc-700 border-zinc-600 rounded focus:ring-[#55B2DE]"
                    />
                    <span className="text-sm text-white">{circle.name}</span>
                  </label>
                )
              })}
            </div>
          )}

          {/* Remove */}
          <button
            onClick={onRemove}
            className="w-full flex items-center justify-center px-4 py-3 text-red-400 hover:text-red-300 transition-colors"
          >
            🗑️ Remove from PagePass
          </button>
        </div>

        {/* Close Button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
