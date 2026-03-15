'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Circle = {
  id: string
  name: string
}

type ParsedBook = {
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  myRating: number | null
  dateRead: string | null
  bookshelves: string | null
  exclusiveShelf: string | null
  selectedCircles: string[]
  selected: boolean
  imported: boolean
}

export default function GoodreadsImporter({ 
  userId, 
  userCircles 
}: { 
  userId: string
  userCircles: Circle[]
}) {
  const [books, setBooks] = useState<ParsedBook[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [hasStoredCSV, setHasStoredCSV] = useState(false)
  const [showCuration, setShowCuration] = useState(false)
  const [ownedBooks, setOwnedBooks] = useState<Set<string>>(new Set())
  
  type ShelfFilter = 'read' | 'to-read' | 'all'
  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('all')
  const [minRating, setMinRating] = useState<number>(0)
  const [authorFilter, setAuthorFilter] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  // Normalize string for matching
  const normalizeForMatch = (str: string | null | undefined): string => {
    if (!str) return ''
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  // Generate dedup key for a book
  const getBookKey = (book: { isbn?: string | null, isbn13?: string | null, title: string, author: string }): string => {
    if (book.isbn13) return book.isbn13.toLowerCase()
    if (book.isbn) return book.isbn.toLowerCase()
    return `${book.title.toLowerCase()}::${book.author.toLowerCase()}`
  }

  useEffect(() => {
    loadOwnedBooks()
    loadStoredLibrary()
  }, [])

  const loadOwnedBooks = async () => {
    try {
      const { data: userBooks, error } = await supabase
        .from('books')
        .select('title, author, isbn, isbn10')
        .eq('owner_id', userId)
      
      if (error) {
        console.error('[GoodreadsImporter] Error loading owned books:', error)
        return
      }

      if (userBooks && userBooks.length > 0) {
        const owned = new Set<string>()
        userBooks.forEach(book => {
          if (book.isbn) owned.add(book.isbn.toLowerCase().replace(/[^0-9x]/gi, ''))
          if (book.isbn10) owned.add(book.isbn10.toLowerCase().replace(/[^0-9x]/gi, ''))
          const titleAuthor = `${normalizeForMatch(book.title)}|${normalizeForMatch(book.author)}`
          owned.add(titleAuthor)
        })
        console.log('[GoodreadsImporter] Loaded', userBooks.length, 'owned books')
        setOwnedBooks(owned)
      }
    } catch (err) {
      console.error('Failed to load owned books:', err)
    }
  }

  const loadStoredLibrary = async () => {
    try {
      console.log('[GoodreadsImporter] Loading stored library...')
      const response = await fetch('/api/goodreads/library')
      const data = await response.json()
      
      console.log('[GoodreadsImporter] Response:', data)
      
      if (data.hasStoredCSV && data.books?.length > 0) {
        setHasStoredCSV(true)
        const parsed: ParsedBook[] = data.books.map((b: any) => ({
          title: b.title,
          author: b.author || 'Unknown',
          isbn: b.isbn,
          isbn13: b.isbn13,
          myRating: b.myRating,
          dateRead: b.dateRead,
          bookshelves: b.bookshelves,
          exclusiveShelf: b.exclusiveShelf,
          selectedCircles: userCircles.map(c => c.id),
          selected: false,
          imported: b.imported || false
        }))
        setBooks(parsed)
        console.log('[GoodreadsImporter] Loaded', parsed.length, 'books from stored CSV')
      }
    } catch (err) {
      console.error('[GoodreadsImporter] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setError('')
    setUploading(true)
    setUploadStatus('Uploading your Goodreads library...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/goodreads/library', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || 'Upload failed')
        setUploading(false)
        return
      }

      console.log('[GoodreadsImporter] Upload result:', result)
      setUploadStatus(`Found ${result.booksFound} books! Loading...`)

      // Reload the library from storage
      await loadStoredLibrary()
      setShowCuration(true)
      setUploading(false)
      setUploadStatus('')
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`)
      setUploading(false)
      setUploadStatus('')
    }
  }

  const isBookOwned = (book: ParsedBook): boolean => {
    if (book.isbn13) {
      const normalizedIsbn13 = book.isbn13.toLowerCase().replace(/[^0-9x]/gi, '')
      if (ownedBooks.has(normalizedIsbn13)) return true
    }
    if (book.isbn) {
      const normalizedIsbn = book.isbn.toLowerCase().replace(/[^0-9x]/gi, '')
      if (ownedBooks.has(normalizedIsbn)) return true
    }
    const titleAuthor = `${normalizeForMatch(book.title)}|${normalizeForMatch(book.author)}`
    return ownedBooks.has(titleAuthor)
  }

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (activeShelf !== 'all') {
        const shelf = book.exclusiveShelf || ''
        const shelves = book.bookshelves || ''
        const shelfList = shelves.split(',').map(s => s.trim().toLowerCase())
        
        const matchesShelf = (() => {
          switch (activeShelf) {
            case 'read': return shelf === 'read' || shelfList.some(s => s === 'read')
            case 'to-read': return shelf === 'to-read' || shelfList.some(s => s === 'to-read')
            default: return true
          }
        })()
        if (!matchesShelf) return false
      }
      if (minRating > 0 && (!book.myRating || book.myRating < minRating)) return false
      if (authorFilter.trim()) {
        const searchTerm = authorFilter.toLowerCase().trim()
        if (!(book.author || '').toLowerCase().includes(searchTerm)) return false
      }
      return true
    })
  }, [books, activeShelf, minRating, authorFilter])

  const shelfCounts = useMemo(() => {
    const counts = { read: 0, 'to-read': 0, all: books.length }
    books.forEach(book => {
      const shelf = book.exclusiveShelf || ''
      const shelves = book.bookshelves || ''
      const shelfList = shelves.split(',').map(s => s.trim().toLowerCase())
      if (shelf === 'read' || shelfList.some(s => s === 'read')) counts.read++
      if (shelf === 'to-read' || shelfList.some(s => s === 'to-read')) counts['to-read']++
    })
    return counts
  }, [books])

  const selectedCount = filteredBooks.filter(b => b.selected && !b.imported && !isBookOwned(b)).length
  const importedCount = books.filter(b => b.imported).length
  const alreadyOwnedCount = books.filter(b => !b.imported && isBookOwned(b)).length

  const toggleBookSelection = (index: number) => {
    setBooks(prev => {
      const updated = [...prev]
      const bookIndex = prev.indexOf(filteredBooks[index])
      updated[bookIndex].selected = !updated[bookIndex].selected
      return updated
    })
  }

  const selectAllVisible = () => {
    setBooks(prev => {
      const updated = [...prev]
      filteredBooks.forEach(book => {
        if (!book.imported && !isBookOwned(book)) {
          const index = prev.indexOf(book)
          updated[index].selected = true
        }
      })
      return updated
    })
  }

  const deselectAll = () => setBooks(prev => prev.map(b => ({ ...b, selected: false })))

  const toggleCircleForBook = (bookIndex: number, circleId: string) => {
    setBooks(prev => {
      const updated = [...prev]
      const book = updated[bookIndex]
      book.selectedCircles = book.selectedCircles.includes(circleId)
        ? book.selectedCircles.filter(id => id !== circleId)
        : [...book.selectedCircles, circleId]
      return updated
    })
  }

  const handleImport = async () => {
    const selectedBooks = books.filter(b => b.selected && !b.imported && !isBookOwned(b) && b.selectedCircles.length > 0)
    if (selectedBooks.length === 0) return

    setImporting(true)
    setImportProgress({ current: 0, total: selectedBooks.length })
    setError('')
    
    let successCount = 0
    const importedKeys: string[] = []

    for (let i = 0; i < selectedBooks.length; i++) {
      const book = selectedBooks[i]
      setImportProgress({ current: i + 1, total: selectedBooks.length })
      
      try {
        const response = await fetch('/api/books/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            isbn: book.isbn13 || book.isbn,
            selectedCircles: book.selectedCircles,
            userCircles: userCircles,
            source: 'goodreads'
          })
        })

        if (response.ok) {
          setBooks(prev => prev.map(b => 
            b.title === book.title && b.author === book.author 
              ? { ...b, imported: true, selected: false } 
              : b
          ))
          importedKeys.push(getBookKey(book))
          successCount++
        }
      } catch (err) {
        console.error('Failed to import:', book.title, err)
      }
    }

    // Mark books as imported in profile
    if (importedKeys.length > 0) {
      try {
        await fetch('/api/goodreads/library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ importedKeys })
        })
      } catch (err) {
        console.error('Failed to mark books as imported:', err)
      }
    }

    setImporting(false)
    setImportProgress({ current: 0, total: 0 })
    
    const remaining = books.filter(b => !b.imported && !isBookOwned(b)).length - successCount
    setToast(`✅ Imported ${successCount} book${successCount !== 1 ? 's' : ''}!${remaining > 0 ? ` ${remaining} more available to import.` : ''}`)
    
    setTimeout(() => {
      setToast(null)
      router.push('/library')
      router.refresh()
    }, 2000)
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-6">
        <div className="text-center py-8 text-[#6B7280]">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  // Uploading state
  if (uploading) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-[#55B2DE] border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium text-[#9CA3AF]">{uploadStatus}</p>
          <p className="text-sm text-[#6B7280] mt-2">This may take a moment for large libraries</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] rounded-lg p-6">
      {/* Stored CSV prompt */}
      {hasStoredCSV && !showCuration && (
        <div className="mb-6 p-4 bg-[#55B2DE]/10 rounded-lg border border-[#55B2DE]/30">
          <h3 className="font-semibold text-white mb-2">📚 Your Goodreads Library</h3>
          <p className="text-sm text-[#55B2DE] mb-3">
            We have your Goodreads library saved ({books.length} books, {importedCount} already imported).
          </p>
          <button
            onClick={() => setShowCuration(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            Import More Books
          </button>
          <p className="text-xs text-[#55B2DE] mt-2">Or upload a new CSV below to update your library.</p>
        </div>
      )}

      {/* Upload instructions */}
      {!showCuration && (
        <>
          <details className="mb-6 p-4 bg-[#55B2DE]/10 rounded-lg border border-[#55B2DE]/30">
            <summary className="font-medium text-white cursor-pointer">📱 Doing this on your phone? Here's how</summary>
            <div className="mt-2 text-sm text-[#9CA3AF]">
              <p>For the best experience, we recommend using a desktop computer.</p>
            </div>
          </details>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {hasStoredCSV ? 'Upload New CSV (optional)' : 'Upload Goodreads CSV'}
            </label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#55B2DE]/10 file:text-white hover:file:bg-[#55B2DE]/20"
            />
          </div>
        </>
      )}

      {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4">{error}</div>}

      {/* Book curation view */}
      {showCuration && books.length > 0 && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Select Books to Import</h3>
              <button 
                onClick={() => setShowCuration(false)}
                className="text-sm text-[#6B7280] hover:text-white"
              >
                ← Back
              </button>
            </div>
            
            {(importedCount > 0 || alreadyOwnedCount > 0) && (
              <div className="bg-[#55B2DE]/10 border border-[#55B2DE]/30 rounded-lg p-3 mb-4 text-sm">
                {importedCount > 0 && (
                  <p className="text-[#55B2DE]">✅ <strong>{importedCount} book{importedCount !== 1 ? 's' : ''}</strong> already imported from this list</p>
                )}
                {alreadyOwnedCount > 0 && (
                  <p className="text-[#9CA3AF] mt-1">📚 <strong>{alreadyOwnedCount} book{alreadyOwnedCount !== 1 ? 's' : ''}</strong> already in your library</p>
                )}
                <p className="text-[#9CA3AF] mt-1 text-xs">(greyed out below)</p>
              </div>
            )}
            
            {importedCount === 0 && alreadyOwnedCount === 0 && (
              <div className="bg-[#55B2DE]/10 border border-[#55B2DE]/30 rounded-lg p-3 mb-4 text-sm">
                <p className="text-[#9CA3AF]"><strong>We found {books.length} books!</strong> Start with 20-30 — we'll save this import so you can return to it later and add more books.</p>
              </div>
            )}
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['all', 'read', 'to-read'] as const).map(shelf => (
                <button key={shelf} onClick={() => setActiveShelf(shelf)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeShelf === shelf ? 'bg-[#55B2DE] text-white' : 'bg-[#333] text-white hover:bg-[#444]'}`}>
                  {shelf === 'read' ? '✅ Read' : shelf === 'to-read' ? '📖 To-Read' : '📚 All'} ({shelfCounts[shelf]})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-[#9CA3AF]">Min rating:</span>
              {[0, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${minRating === r ? 'bg-amber-500 text-white' : 'bg-[#333] text-white'}`}>
                  {r === 0 ? 'All' : '★'.repeat(r) + '+'}
                </button>
              ))}
            </div>

            <input 
              type="text" 
              placeholder="Filter by author..." 
              value={authorFilter} 
              onChange={e => setAuthorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#444] rounded-lg text-sm mb-4"
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#9CA3AF]"><strong>{selectedCount}</strong> selected</span>
              <div className="flex gap-3">
                <button onClick={selectAllVisible} className="text-sm text-[#55B2DE] hover:underline">Select all</button>
                <button onClick={deselectAll} className="text-sm text-[#6B7280] hover:underline">Deselect all</button>
              </div>
            </div>
          </div>

          {/* Book list */}
          <div className="max-h-[400px] overflow-y-auto border rounded-lg mb-4">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No books match filters</div>
            ) : (
              <div className="divide-y divide-[#333]">
                {filteredBooks.map((book, index) => {
                  const isOwned = isBookOwned(book)
                  const isDisabled = book.imported || isOwned
                  
                  return (
                    <div 
                      key={index} 
                      onClick={() => !isDisabled && toggleBookSelection(index)}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        isDisabled 
                          ? 'bg-[#27272A] opacity-60 cursor-not-allowed' 
                          : book.selected 
                            ? 'bg-[#55B2DE]/10 cursor-pointer' 
                            : 'hover:bg-[#27272A] cursor-pointer'
                      }`}
                    >
                      {isDisabled ? (
                        <div className="w-5 h-5 rounded bg-[#55B2DE]/100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          book.selected ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-[#444]'
                        }`}>
                          {book.selected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDisabled ? 'text-[#6B7280]' : ''}`}>{book.title}</p>
                        <p className="text-xs text-[#6B7280] truncate">
                          {book.author}
                          {book.imported && <span className="ml-2 text-[#55B2DE]">• Imported</span>}
                          {!book.imported && isOwned && <span className="ml-2 text-[#55B2DE]">• Already in library</span>}
                        </p>
                      </div>
                      {book.myRating && book.myRating > 0 && (
                        <div className="text-xs text-amber-500">{'★'.repeat(book.myRating)}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Import button */}
          {importing ? (
            <div className="bg-[#55B2DE]/10 border border-[#55B2DE]/30 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[#9CA3AF]">📚 Importing your books…</span>
                <span className="text-sm text-[#55B2DE]">{importProgress.current}/{importProgress.total}</span>
              </div>
              <div className="w-full bg-[#27272A] rounded-full h-3">
                <div 
                  className="bg-[#55B2DE] h-3 rounded-full transition-all" 
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} 
                />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleImport} 
              disabled={selectedCount === 0}
              className="w-full px-4 py-3 bg-[#55B2DE] text-white rounded-lg hover:bg-[#4A9FCB] disabled:opacity-50 font-medium"
            >
              Import {selectedCount} Book{selectedCount !== 1 ? 's' : ''}
            </button>
          )}
        </>
      )}

      {/* Circle selection after book selection */}
      {!showCuration && books.length > 0 && books.some(b => b.selected) && (
        <>
          <h3 className="font-semibold mb-2">Choose Circles ({books.filter(b => b.selected).length} books)</h3>
          <div className="h-96 overflow-y-auto border rounded-lg mb-4">
            {books.filter(b => b.selected).map((book, i) => {
              const idx = books.indexOf(book)
              return (
                <div key={idx} className="p-4 border-b">
                  <h4 className="font-medium text-sm">{book.title}</h4>
                  <p className="text-xs text-[#9CA3AF] mb-2">{book.author}</p>
                  <div className="flex flex-wrap gap-2">
                    {userCircles.map(c => (
                      <label key={c.id} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${
                        book.selectedCircles.includes(c.id) ? 'bg-[#55B2DE] text-white' : 'bg-[#333]'
                      }`}>
                        <input 
                          type="checkbox" 
                          checked={book.selectedCircles.includes(c.id)} 
                          onChange={() => toggleCircleForBook(idx, c.id)} 
                          className="sr-only" 
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <button 
            onClick={handleImport} 
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Import {books.filter(b => b.selected && b.selectedCircles.length > 0).length} Books
          </button>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
