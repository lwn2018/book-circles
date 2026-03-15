'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { completeGiftTransfer } from '@/lib/gift-actions'
import RequestConfirmationDialog from './RequestConfirmationDialog'
import BuyAmazonButton from './BuyAmazonButton'
import BookCover from './BookCover'

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
  circles?: Array<{ id: string; name: string }>
  source?: 'google' | 'openlibrary'
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
      return
    }
    setSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&external=true`)
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

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (query.length < 3) {
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
      setSearching(false)
      return
    }
    searchTimerRef.current = setTimeout(() => performSearch(query), 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
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
      const { data: insertedBook, error } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_url: book.cover_url,
          owner_id: userId,
          status: 'available',
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

      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)

      if (userCircles && userCircles.length > 0 && insertedBook) {
        const visibilityEntries = userCircles.map(cm => ({
          book_id: insertedBook.id,
          circle_id: cm.circle_id,
          is_visible: true
        }))
        await supabase.from('book_circle_visibility').insert(visibilityEntries)
      }

      alert(`Added "${book.title}" to your library!`)
      router.refresh()
      performSearch(query)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setAddingBook(null)
    }
  }

  const handleRequestBook = (bookId: string) => setRequestingBookId(bookId)

  const handleRequestSuccess = () => {
    setRequestingBookId(null)
    alert('Book requested! The owner has been notified.')
    performSearch(query)
  }

  if (!isOpen) return null

  const totalResults = myLibrary.length + myCircles.length + external.length
  const showEmptyState = query.length >= 3 && totalResults === 0 && !searching

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={handleClose} />

      {/* Overlay Content */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
        <div className="bg-[#121212] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Search Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[#334155]">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a book..."
              className="flex-1 text-lg bg-transparent text-white placeholder-[#6B7280] outline-none"
            />
            <button onClick={handleClose} className="p-2 hover:bg-[#1E293B] rounded-full transition">
              <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {query.length < 3 && (
              <div className="text-center py-12 text-[#6B7280]">
                <p className="text-sm">Type at least 3 characters to search</p>
              </div>
            )}

            {query.length >= 3 && searching && totalResults === 0 && (
              <div className="text-center py-12 text-[#9CA3AF]">
                <div className="inline-block w-6 h-6 border-2 border-[#55B2DE] border-t-transparent rounded-full animate-spin mb-2" />
                <p>Searching...</p>
              </div>
            )}

            {showEmptyState && (
              <div className="text-center py-12">
                <p className="text-white mb-2">No books found for "{query}"</p>
                <p className="text-sm text-[#6B7280]">Try a different spelling or search by author name</p>
              </div>
            )}

            <div className="space-y-6">
              {/* In Your Circles */}
              {myCircles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#55B2DE] uppercase tracking-wider mb-3">In Your Circles</h3>
                  <div className="space-y-2">
                    {myCircles.map((book) => (
                      <BookCard key={book.id} book={book} type="circle" userId={userId} searchQuery={query} onRequest={() => handleRequestBook(book.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Your Books */}
              {myLibrary.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Your Books</h3>
                  <div className="space-y-2">
                    {myLibrary.map((book) => (
                      <BookCard key={book.id} book={book} type="own" searchQuery={query} onRequest={() => {}} />
                    ))}
                  </div>
                </div>
              )}

              {/* More Books (external) */}
              {external.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3">More Books</h3>
                  <div className="space-y-2">
                    {external.map((book) => (
                      <div key={book.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex gap-3">
                        <BookCover coverUrl={book.cover_url} title={book.title} author={book.author} isbn={book.isbn} className="w-12 h-18 object-cover rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{book.title}</h4>
                          {book.author && <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAddToLibrary(book)}
                              disabled={addingBook === book.id}
                              className="px-3 py-1.5 bg-[#55B2DE] text-white text-xs font-semibold rounded-full hover:bg-[#4A9FCB] disabled:opacity-50 transition"
                            >
                              {addingBook === book.id ? 'Adding...' : 'Add to Library'}
                            </button>
                            <BuyAmazonButton
                              book={{ id: book.id, title: book.title, author: book.author, isbn: book.isbn }}
                              context="browsing_recommendation"
                              searchQuery={query}
                              variant="secondary"
                            >
                              Buy
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

      {requestingBookId && (
        <RequestConfirmationDialog bookId={requestingBookId} onClose={() => setRequestingBookId(null)} onSuccess={handleRequestSuccess} />
      )}
    </>
  )
}

// BookCard subcomponent - dark themed
function BookCard({ book, type, userId, searchQuery, onRequest }: { 
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

  const handleBorrowDirect = async () => {
    if (!userId) return
    
    if (book.gift_on_borrow) {
      if (!confirm(`${book.owner_name} is gifting you "${book.title}". Accept this gift?`)) return
      setBorrowing(true)
      const { data: userCircles } = await supabase.from('circle_members').select('circle_id').eq('user_id', userId).limit(1)
      const circleId = userCircles?.[0]?.circle_id
      if (!circleId) { alert('Error: Could not determine circle'); setBorrowing(false); return }
      const result = await completeGiftTransfer(book.id, userId, circleId)
      if (result.error) { alert(`Failed: ${result.error}`); setBorrowing(false); return }
      alert(`You've received "${book.title}" as a gift!`)
      setBorrowing(false)
      router.refresh()
      return
    }
    
    setBorrowing(true)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const { error } = await supabase.from('books').update({
      status: 'borrowed',
      current_borrower_id: userId,
      borrowed_at: new Date().toISOString(),
      due_date: dueDate.toISOString()
    }).eq('id', book.id)
    if (error) { alert(`Failed: ${error.message}`); setBorrowing(false); return }
    await supabase.from('borrow_history').insert({ book_id: book.id, borrower_id: userId, due_date: dueDate.toISOString() })
    alert(`You borrowed "${book.title}"!`)
    setBorrowing(false)
    router.refresh()
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex gap-3">
      <BookCover coverUrl={book.cover_url} title={book.title} author={book.author} isbn={book.isbn} className="w-12 h-18 object-cover rounded flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{book.title}</h4>
        {book.author && <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>}
        
        <div className="mt-1.5 space-y-1">
          {type === 'own' && (
            <>
              <p className="text-xs text-[#6B7280]">
                {book.status === 'available' ? 'On shelf' : book.status === 'borrowed' ? 'Lent out' : book.status}
              </p>
              {book.circles && book.circles.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {book.circles.map((circle) => (
                    <button key={circle.id} onClick={() => handleCircleTagClick(circle.id)}
                      className="text-xs bg-[#27272A] text-[#9CA3AF] px-2 py-0.5 rounded-full hover:bg-[#334155] transition">
                      {circle.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          
          {type === 'circle' && (
            <>
              {book.owner_name && <p className="text-xs text-[#6B7280]">Owner: {book.owner_name}</p>}
              {book.circles && book.circles.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {book.circles.map((circle) => (
                    <button key={circle.id} onClick={() => handleCircleTagClick(circle.id)}
                      className="text-xs bg-[#55B2DE]/20 text-[#55B2DE] px-2 py-0.5 rounded-full hover:bg-[#55B2DE]/30 transition">
                      {circle.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isOffShelf ? 'bg-[#2A2A2A] text-[#6B7280]' :
                  isAvailable ? 'bg-[#1A4A2A] text-[#4ADE80]' : 'bg-[#2A2A1A] text-[#FACC15]'
                }`}>
                  {isOffShelf ? 'Off Shelf' : isAvailable ? 'Available' : 'Borrowed'}
                </span>
                {book.gift_on_borrow && (
                  <span className="text-xs bg-[#3A1A2A] text-[#EC4899] px-2 py-0.5 rounded-full font-medium">🎁 Gift</span>
                )}
              </div>
              
              {isOffShelf ? (
                <p className="text-xs text-[#6B7280] italic">Temporarily unavailable</p>
              ) : isAvailable ? (
                <button onClick={handleBorrowDirect} disabled={borrowing}
                  className={`mt-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-full disabled:opacity-50 transition ${
                    book.gift_on_borrow ? 'bg-[#EC4899] hover:bg-[#DB2777]' : 'bg-[#4ADE80] hover:bg-[#22C55E]'
                  }`}>
                  {borrowing ? '...' : book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow'}
                </button>
              ) : (
                <button onClick={onRequest} className="mt-1.5 px-3 py-1.5 bg-[#8B5CF6] text-white text-xs font-semibold rounded-full hover:bg-[#7C3AED] transition">
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
