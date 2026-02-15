'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Circle = {
  id: string
  name: string
}

type ParsedBook = {
  id?: string
  title: string
  author: string
  isbn?: string
  isbn13?: string
  myRating?: number
  dateRead?: string
  bookshelves?: string
  exclusiveShelf?: string
  selectedCircles: string[]
  selected: boolean
  imported?: boolean
  importedBookId?: string
}

type StoredBook = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  isbn13: string | null
  my_rating: number | null
  date_read: string | null
  bookshelves: string | null
  exclusive_shelf: string | null
  imported_book_id: string | null
  imported_at: string | null
}

export default function GoodreadsImporter({ 
  userId, 
  userCircles 
}: { 
  userId: string
  userCircles: Circle[]
}) {
  const [file, setFile] = useState<File | null>(null)
  const [books, setBooks] = useState<ParsedBook[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCuration, setShowCuration] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [hasStoredLibrary, setHasStoredLibrary] = useState(false)
  const [loadingStored, setLoadingStored] = useState(true)
  const [ownedBooks, setOwnedBooks] = useState<Set<string>>(new Set())
  
  type ShelfFilter = 'owned' | 'read' | 'to-read' | 'all'
  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('all')
  const [minRating, setMinRating] = useState<number>(0)
  const [authorFilter, setAuthorFilter] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadStoredLibrary()
    loadOwnedBooks()
  }, [])

  const loadOwnedBooks = async () => {
    try {
      // Fetch user's existing books to check for duplicates
      const { data: userBooks } = await supabase
        .from('books')
        .select('title, author, isbn, isbn13')
        .eq('owner_id', userId)
      
      if (userBooks) {
        const owned = new Set<string>()
        userBooks.forEach(book => {
          // Create lookup keys for matching
          if (book.isbn13) owned.add(book.isbn13.toLowerCase())
          if (book.isbn) owned.add(book.isbn.toLowerCase())
          // Also add title+author combo for books without ISBN
          const titleAuthor = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`
          owned.add(titleAuthor)
        })
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
      console.log('[GoodreadsImporter] Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[GoodreadsImporter] Got data:', data.books?.length, 'books')
        if (data.books && data.books.length > 0) {
          setHasStoredLibrary(true)
          const parsed: ParsedBook[] = data.books.map((b: StoredBook) => ({
            id: b.id,
            title: b.title,
            author: b.author || 'Unknown',
            isbn: b.isbn || undefined,
            isbn13: b.isbn13 || undefined,
            myRating: b.my_rating || undefined,
            dateRead: b.date_read || undefined,
            bookshelves: b.bookshelves || undefined,
            exclusiveShelf: b.exclusive_shelf || undefined,
            selectedCircles: [],
            selected: false,
            imported: !!b.imported_book_id,
            importedBookId: b.imported_book_id || undefined
          }))
          setBooks(parsed)
          // Don't auto-show curation - let them click the button
        }
      }
    } catch (err) {
      console.error('[GoodreadsImporter] Failed to load:', err)
    } finally {
      setLoadingStored(false)
    }
  }

  const saveToStoredLibrary = async (parsedBooks: ParsedBook[]) => {
    try {
      await fetch('/api/goodreads/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: parsedBooks })
      })
    } catch (err) {
      console.error('Failed to save to stored library:', err)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setFile(selectedFile)
    setError('')
    setSuccess('')
    setParsing(true)

    // Ensure loading state is visible for at least 1.5 seconds
    const startTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const text = await selectedFile.text()
      const lines = text.split('\n')
      
      if (lines.length < 2) {
        setError('CSV file is empty or invalid')
        setParsing(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title')
      const authorIdx = headers.findIndex(h => h.toLowerCase() === 'author')
      const isbnIdx = headers.findIndex(h => h.toLowerCase() === 'isbn')
      const isbn13Idx = headers.findIndex(h => h.toLowerCase() === 'isbn13')
      const ratingIdx = headers.findIndex(h => h.toLowerCase() === 'my rating')
      const dateReadIdx = headers.findIndex(h => h.toLowerCase() === 'date read')
      const bookshelvesIdx = headers.findIndex(h => h.toLowerCase() === 'bookshelves')
      const exclusiveShelfIdx = headers.findIndex(h => h.toLowerCase() === 'exclusive shelf')

      if (titleIdx === -1) {
        setError('CSV must have a "Title" column')
        setParsing(false)
        return
      }

      const parsedBooks: ParsedBook[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        const title = values[titleIdx]?.replace(/"/g, '') || ''
        const author = values[authorIdx]?.replace(/"/g, '') || 'Unknown'
        const isbn = values[isbnIdx]?.replace(/"/g, '').replace(/=/g, '') || undefined
        const isbn13 = values[isbn13Idx]?.replace(/"/g, '').replace(/=/g, '') || undefined
        const myRating = ratingIdx !== -1 ? parseInt(values[ratingIdx]?.replace(/"/g, '')) : undefined
        const dateRead = dateReadIdx !== -1 ? values[dateReadIdx]?.replace(/"/g, '') : undefined
        const bookshelves = bookshelvesIdx !== -1 ? values[bookshelvesIdx]?.replace(/"/g, '').toLowerCase() : undefined
        const exclusiveShelf = exclusiveShelfIdx !== -1 ? values[exclusiveShelfIdx]?.replace(/"/g, '').toLowerCase() : undefined
        const isOwned = bookshelves?.includes('owned') || bookshelves?.includes('own')

        if (title) {
          parsedBooks.push({
            title,
            author,
            isbn: isbn13 || isbn,
            myRating,
            dateRead,
            bookshelves,
            exclusiveShelf,
            selectedCircles: userCircles.map(c => c.id),
            selected: isOwned || false
          })
        }
      }

      setBooks(parsedBooks)
      
      // Ensure loading state shows for at least 1.5 seconds
      const elapsed = Date.now() - startTime
      if (elapsed < 1500) {
        await new Promise(resolve => setTimeout(resolve, 1500 - elapsed))
      }
      setParsing(false)
      
      if (parsedBooks.length === 0) {
        setError('No valid books found in CSV')
      } else {
        await saveToStoredLibrary(parsedBooks)
        setHasStoredLibrary(true)
        setShowCuration(true)
        // Don't show duplicate success message - the blue info box handles this
      }
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`)
      setParsing(false)
    }
  }

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (activeShelf !== 'all') {
        const shelf = book.exclusiveShelf || ''
        const shelves = book.bookshelves || ''
        const shelfList = shelves.split(',').map(s => s.trim().toLowerCase())
        
        const matchesShelf = (() => {
          switch (activeShelf) {
            case 'owned': return shelfList.some(s => s === 'owned' || s === 'own')
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
    const counts = { owned: 0, read: 0, 'to-read': 0, all: books.length }
    books.forEach(book => {
      const shelf = book.exclusiveShelf || ''
      const shelves = book.bookshelves || ''
      const shelfList = shelves.split(',').map(s => s.trim().toLowerCase())
      if (shelfList.some(s => s === 'owned' || s === 'own')) counts.owned++
      if (shelf === 'read' || shelfList.some(s => s === 'read')) counts.read++
      if (shelf === 'to-read' || shelfList.some(s => s === 'to-read')) counts['to-read']++
    })
    return counts
  }, [books])

  const selectedCount = filteredBooks.filter(b => b.selected && !b.imported).length
  const importedCount = books.filter(b => b.imported).length

  const isBookOwned = (book: ParsedBook): boolean => {
    if (book.isbn13 && ownedBooks.has(book.isbn13.toLowerCase())) return true
    if (book.isbn && ownedBooks.has(book.isbn.toLowerCase())) return true
    const titleAuthor = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`
    return ownedBooks.has(titleAuthor)
  }

  const alreadyOwnedCount = useMemo(() => books.filter(b => !b.imported && isBookOwned(b)).length, [books, ownedBooks])

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
        if (!book.imported) {
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

  const handleProceedToCircleSelection = () => setShowCuration(false)

  const handleImport = async () => {
    const selectedBooks = books.filter(b => b.selected && !b.imported && b.selectedCircles.length > 0)
    if (selectedBooks.length === 0) return

    setImporting(true)
    setImportProgress({ current: 0, total: selectedBooks.length })
    setError('')
    let successCount = 0
    let errorCount = 0

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
            isbn: book.isbn,
            selectedCircles: book.selectedCircles,
            userCircles: userCircles,
            source: 'goodreads'
          })
        })

        if (!response.ok) throw new Error('Failed to add book')

        const result = await response.json()
        
        if (book.id && result.book?.id) {
          await fetch('/api/goodreads/library', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goodreadsId: book.id, importedBookId: result.book.id })
          })
        }

        setBooks(prev => prev.map(b => 
          b.title === book.title && b.author === book.author ? { ...b, imported: true, selected: false } : b
        ))
        successCount++
      } catch (err: any) {
        console.error('Failed to import:', book.title, err)
        errorCount++
      }
    }

    setImporting(false)
    setImportProgress({ current: 0, total: 0 })
    setToast(`✅ Imported ${successCount} book${successCount !== 1 ? 's' : ''}!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
    
    setTimeout(() => {
      setToast(null)
      router.push('/library')
      router.refresh()
    }, 2000)
  }

  if (loadingStored) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <div className="animate-pulse">Loading your Goodreads library...</div>
        </div>
      </div>
    )
  }

  // Show prominent loading state while parsing CSV
  if (parsing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium text-blue-800">Reading your Goodreads library...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large libraries</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {hasStoredLibrary && !showCuration && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">📚 Your Goodreads Library</h3>
          <p className="text-sm text-green-800 mb-3">
            We have your Goodreads library saved ({books.length} books). Import more without re-uploading!
          </p>
          <button
            onClick={() => setShowCuration(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            Import More Books
          </button>
          <p className="text-xs text-green-700 mt-2">Or upload a new CSV below to refresh your library.</p>
        </div>
      )}

      {!showCuration && (
        <details className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <summary className="font-medium text-blue-900 cursor-pointer">📱 Doing this on your phone? Here's how</summary>
          <div className="mt-2 text-sm text-blue-800">
            <p>For the best experience, we recommend using a desktop computer.</p>
          </div>
        </details>
      )}

      {!showCuration && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {hasStoredLibrary ? 'Upload New CSV (optional)' : 'Upload Goodreads CSV'}
          </label>
          <input type="file" accept=".csv" onChange={handleFileChange} disabled={parsing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
        </div>
      )}

      {error && <div className="bg-red-50 text-red-800 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-800 p-3 rounded mb-4">{success}</div>}

      {showCuration && books.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Select Books to Import</h3>
            
            {(importedCount > 0 || alreadyOwnedCount > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
                {importedCount > 0 && (
                  <p className="text-green-800">✅ <strong>{importedCount} book{importedCount !== 1 ? 's' : ''} already imported</strong> from this list</p>
                )}
                {alreadyOwnedCount > 0 && (
                  <p className="text-blue-800 mt-1">📚 <strong>{alreadyOwnedCount} book{alreadyOwnedCount !== 1 ? 's' : ''} already in your library</strong></p>
                )}
                <p className="text-gray-600 mt-1 text-xs">(greyed out below)</p>
              </div>
            )}
            
            {importedCount === 0 && alreadyOwnedCount === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-blue-800"><strong>We found {books.length} books!</strong> Start with 20-30 — we'll save this import so you can return to it later and add more books.</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {(['owned', 'read', 'to-read', 'all'] as const).map(shelf => (
                <button key={shelf} onClick={() => setActiveShelf(shelf)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeShelf === shelf ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {shelf === 'owned' ? '📚 Owned' : shelf === 'read' ? '✅ Read' : shelf === 'to-read' ? '📖 To-Read' : 'All'} ({shelfCounts[shelf]})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Min rating:</span>
              {[0, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${minRating === r ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {r === 0 ? 'All' : '★'.repeat(r) + '+'}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Filter by author..." value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600"><strong>{selectedCount}</strong> selected</span>
              <div className="flex gap-3">
                <button onClick={selectAllVisible} className="text-sm text-blue-600 hover:underline">Select all</button>
                <button onClick={deselectAll} className="text-sm text-gray-500 hover:underline">Deselect all</button>
              </div>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-lg mb-4">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No books match filters</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredBooks.map((book, index) => (
                  <div key={index} onClick={() => !book.imported && !isBookOwned(book) && toggleBookSelection(index)}
                    className={`flex items-center gap-3 px-3 py-2 ${book.imported || isBookOwned(book) ? 'bg-gray-100 opacity-60 cursor-not-allowed' : book.selected ? 'bg-blue-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    {book.imported || isBookOwned(book) ? (
                      <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${book.selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {book.selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${book.imported || isBookOwned(book) ? 'text-gray-500' : ''}`}>{book.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {book.author}
                        {book.imported && <span className="ml-2 text-green-600">• Imported</span>}
                        {!book.imported && isBookOwned(book) && <span className="ml-2 text-blue-600">• Already in library</span>}
                      </p>
                    </div>
                    {book.myRating && book.myRating > 0 && <div className="text-xs text-amber-500">{'★'.repeat(book.myRating)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleProceedToCircleSelection} disabled={selectedCount === 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            Continue with {selectedCount} book{selectedCount !== 1 ? 's' : ''}
          </button>
        </>
      )}

      {!showCuration && books.length > 0 && books.some(b => b.selected) && (
        <>
          <h3 className="font-semibold mb-2">Choose Circles ({books.filter(b => b.selected).length} books)</h3>
          <div className="h-96 overflow-y-auto border rounded-lg mb-4">
            {books.filter(b => b.selected).map((book, i) => {
              const idx = books.indexOf(book)
              return (
                <div key={idx} className="p-4 border-b">
                  <h4 className="font-medium text-sm">{book.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                  <div className="flex flex-wrap gap-2">
                    {userCircles.map(c => (
                      <label key={c.id} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${book.selectedCircles.includes(c.id) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                        <input type="checkbox" checked={book.selectedCircles.includes(c.id)} onChange={() => toggleCircleForBook(idx, c.id)} className="sr-only" />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {importing ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">📚 Importing your books…</span>
                <span className="text-sm text-blue-600">{importProgress.current}/{importProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} />
              </div>
              {importProgress.total >= 5 && (
                <div className="text-center">
                  <p className="text-sm text-blue-700 mb-3">This can take a moment — feel free to keep exploring.</p>
                  <div className="flex justify-center gap-3">
                    <a href="/circles" className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm">Browse Circles</a>
                    <a href="/library" className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm">Go to My Library</a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleImport} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Import {books.filter(b => b.selected && b.selectedCircles.length > 0).length} Books
            </button>
          )}
        </>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">{toast}</div>}
    </div>
  )
}
