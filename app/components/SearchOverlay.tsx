'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { completeGiftTransfer } from '@/lib/gift-actions'
import RequestConfirmationDialog from './RequestConfirmationDialog'
import BuyAmazonButton from './BuyAmazonButton'

type SearchResult = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
  status?: string
  gift_on_borrow?: boolean
  owner_id?: string
  owner_name?: string
  circle_name?: string
  circles?: Array<{ id: string; name: string }> // All circles this book is in
  source?: 'google' | 'openlibrary'
  // Rich metadata from Google Books
  genres?: string[]
  description?: string | null
  page_count?: number | null
  published_date?: string | null
  publisher?: string | null
  language?: string
  google_books_id?: string
}

export default function SearchOverlay({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [myLibrary, setMyLibrary] = useState<SearchResult[]>([])
  const [myCircles, setMyCircles] = useState<SearchResult[]>([])
  const [external, setExternal] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingBook, setAddingBook] = useState<string | null>(null)
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null)
  
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Listen for open search event from header
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsOpen(true)
      setQuery('')
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
    }

    window.addEventListener('openSearch' as any, handleOpenSearch)
    return () => window.removeEventListener('openSearch' as any, handleOpenSearch)
  }, [])

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&external=true`
      )
      const data = await response.json()
      
      setMyLibrary(data.myLibrary || [])
      setMyCircles(data.myCircles || [])
      setExternal(data.external || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  // Handle input changes with debouncing
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    if (query.length < 3) {
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
      setSearching(false)
      return
    }

    // Debounce 400ms (balance between internal and external)
    searchTimerRef.current = setTimeout(() => {
      performSearch(query)
    }, 400)

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [query, performSearch])

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setMyLibrary([])
    setMyCircles([])
    setExternal([])
  }

  const handleAddToLibrary = async (book: SearchResult) => {
    setAddingBook(book.id)
    try {
      // Insert the book and get the ID back
      const { data: insertedBook, error } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_url: book.cover_url,
          owner_id: userId,
          status: 'available',
          // NEW: Rich metadata from Google Books
          genres: book.genres || null,
          description: book.description || null,
          page_count: book.page_count || null,
          published_date: book.published_date || null,
          publisher: book.publisher || null,
          language: book.language || 'en',
          google_books_id: book.google_books_id || null
        })
        .select()
        .single()

      if (error) throw error

      // Auto-create visibility in all user's circles (opt-out model)
      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)

      if (userCircles && userCircles.length > 0 && insertedBook) {
        const visibilityEntries = userCircles.map(cm => ({
          book_id: insertedBook.id,
          circle_id: cm.circle_id,
          is_visible: true // Default: visible in all circles
        }))

        await supabase
          .from('book_circle_visibility')
          .insert(visibilityEntries)
      }

      alert(`Added "${book.title}" to your library!`)
      router.refresh()
      
      // Re-search to update results
      performSearch(query)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setAddingBook(null)
    }
  }

  const getBuyAmazonLink = (book: SearchResult) => {
    const affiliateTag = 'pagepass-20'
    
    if (book.isbn) {
      return `https://www.amazon.ca/dp/${book.isbn}?tag=${affiliateTag}`
    }
    
    const searchQuery = encodeURIComponent(`${book.title} ${book.author || ''}`.trim())
    return `https://www.amazon.ca/s?k=${searchQuery}&tag=${affiliateTag}`
  }

  const handleRequestBook = (bookId: string) => {
    setRequestingBookId(bookId)
  }

  const handleRequestSuccess = () => {
    // Close dialog
    setRequestingBookId(null)
    
    // Show success message
    alert('Book requested! The owner has been notified.')
    
    // Refresh search results
    performSearch(query)
  }

  if (!isOpen) return null

  const totalResults = myLibrary.length + myCircles.length + external.length
  const showEmptyState = query.length >= 3 && totalResults === 0 && !searching

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Overlay Content */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a book..."
              className="flex-1 text-lg outline-none"
            />
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {query.length < 3 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Type at least 3 characters to search</p>
              </div>
            )}

            {query.length >= 3 && searching && totalResults === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Searching...</p>
              </div>
            )}

            {showEmptyState && (
              <div className="text-center py-12 text-gray-600">
                <p className="mb-2">No books found for "{query}"</p>
                <p className="text-sm text-gray-500">
                  Try a different spelling or search by author name
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Section 1: In Your Circles (books you don't own) */}
              {myCircles.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-blue-700">In Your Circles</h3>
                  <div className="space-y-3">
                    {myCircles.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        type="circle"
                        userId={userId}
                        searchQuery={query}
                        onRequest={() => handleRequestBook(book.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Your Books */}
              {myLibrary.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-700">Your Books</h3>
                  <div className="space-y-3">
                    {myLibrary.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        type="own"
                        searchQuery={query}
                        onRequest={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: More Books (external results) */}
              {external.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-500">More Books</h3>
                  <div className="space-y-3">
                    {external.map((book) => (
                      <div key={book.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-4">
                        {/* Cover */}
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

                        {/* Details */}
                        <div className="flex-1">
                          <h4 className="font-semibold">{book.title}</h4>
                          {book.author && (
                            <p className="text-sm text-gray-600">{book.author}</p>
                          )}
                          
                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAddToLibrary(book)}
                              disabled={addingBook === book.id}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {addingBook === book.id ? 'Adding...' : 'Add to My Library'}
                            </button>
                            <BuyAmazonButton
                              book={{
                                id: book.id,
                                title: book.title,
                                author: book.author,
                                isbn: book.isbn
                              }}
                              context="browsing_recommendation"
                              searchQuery={query}
                              variant="secondary"
                            >
                              Buy on Amazon
                            </BuyAmazonButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Confirmation Dialog */}
      {requestingBookId && (
        <RequestConfirmationDialog
          bookId={requestingBookId}
          onClose={() => setRequestingBookId(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </>
  )
}

// BookCard subcomponent
function BookCard({ 
  book, 
  type,
  userId,
  searchQuery,
  onRequest
}: { 
  book: SearchResult
  type: 'own' | 'circle'
  userId?: string
  searchQuery?: string
  onRequest: () => void
}) {
  const [borrowing, setBorrowing] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const handleCircleTagClick = (circleId: string) => {
    const encodedQuery = searchQuery ? encodeURIComponent(searchQuery) : ''
    router.push(`/circles/${circleId}${encodedQuery ? `?q=${encodedQuery}` : ''}`)
  }
  
  const isAvailable = book.status === 'available'
  const isOffShelf = book.status === 'off_shelf'
  const statusText = book.status === 'available' ? 'On shelf' :
                    book.status === 'borrowed' ? `Lent out` :
                    book.status === 'off_shelf' ? 'Off shelf' :
                    book.status

  const handleBorrowDirect = async () => {
    if (!userId) return
    
    // Check if this is a gift
    if (book.gift_on_borrow) {
      if (!confirm(`${book.owner_name} is gifting you "${book.title}". This book will become yours permanently. Accept this gift?`)) {
        return
      }
      
      setBorrowing(true)
      
      // Need circle_id - try to extract from book data or use first circle
      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)
        .limit(1)
      
      const circleId = userCircles?.[0]?.circle_id
      
      if (!circleId) {
        alert('Error: Could not determine circle for gift transfer')
        setBorrowing(false)
        return
      }
      
      const result = await completeGiftTransfer(book.id, userId, circleId)
      
      if (result.error) {
        console.error('Gift transfer error:', result.error)
        alert(`Failed to accept gift: ${result.error}`)
        setBorrowing(false)
        return
      }
      
      alert(`You've received "${book.title}" as a gift! It's now in your library.`)
      setBorrowing(false)
      router.refresh()
      return
    }
    
    // Normal borrow flow
    setBorrowing(true)
    
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // 2 weeks

    const { error } = await supabase
      .from('books')
      .update({
        status: 'borrowed',
        current_borrower_id: userId,
        borrowed_at: new Date().toISOString(),
        due_date: dueDate.toISOString()
      })
      .eq('id', book.id)

    if (error) {
      console.error('Borrow error:', error)
      alert(`Failed to borrow: ${error.message}`)
      setBorrowing(false)
      return
    }

    // Create borrow history entry
    await supabase
      .from('borrow_history')
      .insert({
        book_id: book.id,
        borrower_id: userId,
        due_date: dueDate.toISOString()
      })

    alert(`You borrowed "${book.title}"!`)
    setBorrowing(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
      {/* Cover */}
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

      {/* Details */}
      <div className="flex-1">
        <h4 className="font-semibold">{book.title}</h4>
        {book.author && (
          <p className="text-sm text-gray-600">{book.author}</p>
        )}
        
        <div className="mt-2 space-y-1">
          {type === 'own' && (
            <>
              <p className="text-xs text-gray-600">{statusText}</p>
              
              {/* Circle tags for own books */}
              {book.circles && book.circles.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  <span className="text-xs text-gray-500">In:</span>
                  {book.circles.map((circle) => (
                    <button
                      key={circle.id}
                      onClick={() => handleCircleTagClick(circle.id)}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-200 transition"
                    >
                      {circle.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {type === 'circle' && (
            <>
              {book.owner_name && (
                <p className="text-xs text-gray-600">Owner: {book.owner_name}</p>
              )}
              
              {/* Circle tags */}
              {book.circles && book.circles.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  <span className="text-xs text-gray-500">In:</span>
                  {book.circles.map((circle) => (
                    <button
                      key={circle.id}
                      onClick={() => handleCircleTagClick(circle.id)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition"
                    >
                      {circle.name}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-gray-600">
                  {isOffShelf ? '📦 Off Shelf (Unavailable)' :
                   isAvailable ? '✅ Available' : '📖 Borrowed'}
                </p>
                {book.gift_on_borrow && (
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-medium">
                    🎁 Gift
                  </span>
                )}
              </div>
              
              {isOffShelf ? (
                <p className="mt-2 text-xs text-gray-500 italic">
                  Temporarily unavailable
                </p>
              ) : isAvailable ? (
                <div className="mt-2">
                  <button
                    onClick={handleBorrowDirect}
                    disabled={borrowing}
                    className={`px-3 py-1.5 text-white text-sm rounded disabled:opacity-50 ${
                      book.gift_on_borrow 
                        ? 'bg-pink-600 hover:bg-pink-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {borrowing ? 
                      (book.gift_on_borrow ? 'Accepting...' : 'Borrowing...') : 
                      (book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow Now')
                    }
                  </button>
                  {book.gift_on_borrow && (
                    <p className="text-xs text-pink-600 mt-1">
                      You'll own this permanently
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={onRequest}
                  className="mt-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  Join Queue
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
