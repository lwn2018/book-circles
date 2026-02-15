'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BookCoverPlaceholder from '@/app/components/BookCoverPlaceholder'

type Circle = {
  id: string
  name: string
}

type ParsedBook = {
  title: string
  author: string
  isbn?: string
  isbn13?: string
  myRating?: number
  dateRead?: string
  bookshelves?: string
  exclusiveShelf?: string // 'read', 'currently-reading', 'to-read', or custom
  coverUrl?: string
  selectedCircles: string[]
  selected: boolean
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
  
  // Shelf filters (pills)
  type ShelfFilter = 'owned' | 'read' | 'to-read' | 'all'
  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('owned')
  
  const router = useRouter()
  const supabase = createClient()

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

    try {
      const text = await selectedFile.text()
      const lines = text.split('\n')
      
      if (lines.length < 2) {
        setError('CSV file is empty or invalid')
        setParsing(false)
        return
      }

      // Parse header
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

      // Parse books (skip header)
      const parsedBooks: ParsedBook[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Simple CSV parsing (handles quoted fields)
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

        // Check if book is owned (in bookshelves or explicit "owned" shelf)
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
            selected: isOwned || false // Pre-select owned books
          })
        }
      }

      setBooks(parsedBooks)
      setParsing(false)
      
      if (parsedBooks.length === 0) {
        setError('No valid books found in CSV')
      } else {
        setShowCuration(true)
        setSuccess(`Found ${parsedBooks.length} books! Select which ones to import.`)
      }
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`)
      setParsing(false)
    }
  }

  // Filter books based on shelf filter
  const filteredBooks = useMemo(() => {
    if (activeShelf === 'all') return books
    
    return books.filter(book => {
      const shelf = book.exclusiveShelf || ''
      const shelves = book.bookshelves || ''
      
      switch (activeShelf) {
        case 'owned':
          return shelves.includes('owned') || shelves.includes('own')
        case 'read':
          return shelf === 'read' || shelves.includes('read')
        case 'to-read':
          return shelf === 'to-read' || shelves.includes('to-read')
        default:
          return true
      }
    })
  }, [books, activeShelf])

  // Count books per shelf for filter pills
  const shelfCounts = useMemo(() => {
    const counts = { owned: 0, read: 0, 'to-read': 0, all: books.length }
    
    books.forEach(book => {
      const shelf = book.exclusiveShelf || ''
      const shelves = book.bookshelves || ''
      
      if (shelves.includes('owned') || shelves.includes('own')) counts.owned++
      if (shelf === 'read' || shelves.includes('read')) counts.read++
      if (shelf === 'to-read' || shelves.includes('to-read')) counts['to-read']++
    })
    
    return counts
  }, [books])

  const selectedCount = filteredBooks.filter(b => b.selected).length

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
        const index = prev.indexOf(book)
        updated[index].selected = true
      })
      return updated
    })
  }

  const deselectAll = () => {
    setBooks(prev => prev.map(b => ({ ...b, selected: false })))
  }

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

  const handleProceedToCircleSelection = () => {
    setShowCuration(false)
  }

  const handleImport = async () => {
    const selectedBooks = books.filter(b => b.selected && b.selectedCircles.length > 0)
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
        const { data: newBook, error: bookError} = await supabase
          .from('books')
          .insert({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            owner_id: userId,
            status: 'available'
            // Don't set circle_id - we use book_circle_visibility instead
          })
          .select()
          .single()

        if (bookError) throw bookError

        const visibilityEntries = book.selectedCircles.map(circleId => ({
          book_id: newBook.id,
          circle_id: circleId,
          is_visible: true
        }))

        const { error: visError } = await supabase
          .from('book_circle_visibility')
          .insert(visibilityEntries)

        if (visError) throw visError

        successCount++
      } catch (err) {
        console.error('Failed to import book:', book.title, err)
        errorCount++
      }
    }

    setImporting(false)
    setImportProgress({ current: 0, total: 0 })
    
    // Show toast notification
    const message = `✅ Imported ${successCount} book${successCount !== 1 ? 's' : ''}!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
    setToast(message)
    
    setTimeout(() => {
      setToast(null)
      router.push('/library')
      router.refresh()
    }, 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Mobile guidance */}
      <details className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <summary className="font-medium text-blue-900 cursor-pointer">
          📱 Doing this on your phone? Here's how
        </summary>
        <div className="mt-2 text-sm text-blue-800">
          <p>For the best experience, we recommend using a desktop computer to import your Goodreads library.</p>
          <p className="mt-2">Mobile import instructions coming soon!</p>
        </div>
      </details>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Upload Goodreads CSV
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {parsing && (
          <p className="text-sm text-gray-600 mt-2">Parsing CSV...</p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-800 p-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Curation Step */}
      {showCuration && books.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Select Books to Import</h3>
            
            {/* Shelf Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveShelf('owned')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeShelf === 'owned' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📚 Owned ({shelfCounts.owned})
              </button>
              
              <button
                onClick={() => setActiveShelf('read')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeShelf === 'read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✅ Read ({shelfCounts.read})
              </button>
              
              <button
                onClick={() => setActiveShelf('to-read')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeShelf === 'to-read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📖 To-Read ({shelfCounts['to-read']})
              </button>
              
              <button
                onClick={() => setActiveShelf('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeShelf === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({shelfCounts.all})
              </button>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{selectedCount}</span> book{selectedCount !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={selectAllVisible}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Select all visible
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          <div className="max-h-[500px] overflow-y-auto border rounded-lg p-3 mb-4">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No books in this shelf</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredBooks.map((book, index) => (
                  <div
                    key={index}
                    onClick={() => toggleBookSelection(index)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                      book.selected 
                        ? 'ring-2 ring-blue-600 ring-offset-1' 
                        : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  >
                    {/* Book Cover */}
                    <div className="aspect-[2/3] relative">
                      <BookCoverPlaceholder
                        title={book.title}
                        author={book.author}
                        isbn={book.isbn}
                        className="w-full h-full"
                      />
                      
                      {/* Selection Checkbox Overlay */}
                      <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition ${
                        book.selected 
                          ? 'bg-blue-600' 
                          : 'bg-white/80 border border-gray-300'
                      }`}>
                        {book.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Title (truncated) */}
                    <div className="p-1.5 bg-white">
                      <p className="text-xs font-medium truncate">{book.title}</p>
                      <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleProceedToCircleSelection}
            disabled={selectedCount === 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Continue with {selectedCount} book{selectedCount !== 1 ? 's' : ''}
          </button>
        </>
      )}

      {/* Circle Selection Step */}
      {!showCuration && books.length > 0 && books.some(b => b.selected) && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Choose Circles ({books.filter(b => b.selected).length} books)</h3>
            <p className="text-sm text-gray-600">
              Select which circles can see each book.
            </p>
          </div>

          <div className="h-96 overflow-y-auto border rounded-lg mb-4">
            {books.filter(b => b.selected).map((book, index) => {
              const actualIndex = books.indexOf(book)
              return (
                <div key={actualIndex} className="p-4 border-b last:border-b-0">
                  <div className="mb-2">
                    <h4 className="font-medium text-sm">{book.title}</h4>
                    <p className="text-xs text-gray-600">{book.author}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userCircles.map(circle => {
                      const isSelected = book.selectedCircles.includes(circle.id)
                      return (
                        <label
                          key={circle.id}
                          className={`px-3 py-1 rounded-full text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCircleForBook(actualIndex, circle.id)}
                            className="sr-only"
                          />
                          {circle.name}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Import Button with Progress */}
          {importing ? (
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Importing books...</span>
                <span className="text-sm font-medium">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Import {books.filter(b => b.selected && b.selectedCircles.length > 0).length} Books
            </button>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
