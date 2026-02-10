'use client'

import { useState, useEffect } from 'react'
import LibraryBookCard from '@/app/library/LibraryBookCard'
import LibraryListView from '@/app/library/LibraryListView'

type Book = any // Using any to match existing types

export default function LibraryWithViewToggle({
  onShelf,
  offShelf,
  lentOut,
  inTransit,
  circles,
  userId,
  defaultBrowseView = 'card'
}: {
  onShelf: Book[]
  offShelf: Book[]
  lentOut: Book[]
  inTransit: Book[]
  circles: any[]
  userId: string
  defaultBrowseView?: string
}) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Load view preference from user settings
  useEffect(() => {
    setViewMode(defaultBrowseView as 'card' | 'list')
  }, [defaultBrowseView])

  // Change view mode (temporarily for this session, doesn't persist)
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode)
  }

  const totalBooks = onShelf.length + offShelf.length + lentOut.length + inTransit.length

  if (totalBooks === 0) {
    return null
  }

  return (
    <>
      {/* View Toggle */}
      <div className="flex justify-end gap-2 mb-6">
        <button
          onClick={() => handleViewModeChange('card')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'card'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Card View
        </button>
        <button
          onClick={() => handleViewModeChange('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          List View
        </button>
      </div>

      <div className="space-y-8">
        {/* On My Shelf */}
        {onShelf.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">📚 On My Shelf ({onShelf.length})</h2>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onShelf.map((book: Book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book}
                    userCircles={circles}
                    userId={userId}
                  />
                ))}
              </div>
            ) : (
              <LibraryListView books={onShelf} userId={userId} />
            )}
          </div>
        )}

        {/* Off Shelf */}
        {offShelf.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">📦 Off Shelf ({offShelf.length})</h2>
            <p className="text-sm text-gray-600 mb-4">
              Books temporarily removed from lending
            </p>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offShelf.map((book: Book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book}
                    userCircles={circles}
                    userId={userId}
                  />
                ))}
              </div>
            ) : (
              <LibraryListView books={offShelf} userId={userId} />
            )}
          </div>
        )}

        {/* Lent Out */}
        {lentOut.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">📖 Lent Out ({lentOut.length})</h2>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lentOut.map((book: Book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book}
                    userCircles={circles}
                    userId={userId}
                  />
                ))}
              </div>
            ) : (
              <LibraryListView books={lentOut} userId={userId} />
            )}
          </div>
        )}

        {/* Passing */}
        {inTransit.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">🚚 Passing ({inTransit.length})</h2>
            <p className="text-sm text-gray-600 mb-4">
              Books ready for the next person to pick up
            </p>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inTransit.map((book: Book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book}
                    userCircles={circles}
                    userId={userId}
                  />
                ))}
              </div>
            ) : (
              <LibraryListView books={inTransit} userId={userId} />
            )}
          </div>
        )}
      </div>
    </>
  )
}
