'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCuration, setShowCuration] = useState(false)
  
  // Filters
  const [ratingFilter, setRatingFilter] = useState(false) // 4+ stars
  const [dateFilter, setDateFilter] = useState(false) // Last 3 years
  const [ownedFilter, setOwnedFilter] = useState(false) // Books marked as owned
  
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
      const bookshelvesIdx = headers.findIndex(h => h.toLowerCase().includes('bookshel') || h.toLowerCase().includes('exclusive shelf'))

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

        if (title) {
          parsedBooks.push({
            title,
            author,
            isbn: isbn13 || isbn,
            myRating,
            dateRead,
            bookshelves,
            selectedCircles: userCircles.map(c => c.id),
            selected: false // None selected by default for curation
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

  // Filter books based on active filters
  const filteredBooks = useMemo(() => {
    let result = books

    if (ratingFilter) {
      result = result.filter(b => b.myRating && b.myRating >= 4)
    }

    if (dateFilter) {
      const threeYearsAgo = new Date()
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
      result = result.filter(b => {
        if (!b.dateRead) return false
        const bookDate = new Date(b.dateRead)
        return bookDate >= threeYearsAgo
      })
    }

    if (ownedFilter) {
      result = result.filter(b => b.bookshelves?.includes('owned') || b.bookshelves?.includes('own'))
    }

    return result
  }, [books, ratingFilter, dateFilter, ownedFilter])

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
    setError('')
    let successCount = 0
    let errorCount = 0

    for (const book of selectedBooks) {
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
    setSuccess(`✅ Imported ${successCount} books!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
    
    setTimeout(() => {
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
      {showCuration && filteredBooks.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Select Books to Import</h3>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <label className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                ratingFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.checked)}
                  className="sr-only"
                />
                4+ Stars Only
              </label>
              
              <label className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                dateFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={dateFilter}
                  onChange={(e) => setDateFilter(e.target.checked)}
                  className="sr-only"
                />
                Last 3 Years
              </label>
              
              <label className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                ownedFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={ownedFilter}
                  onChange={(e) => setOwnedFilter(e.target.checked)}
                  className="sr-only"
                />
                Books I Own
              </label>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                {selectedCount} book{selectedCount !== 1 ? 's' : ''} ready to share
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllVisible}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Select all visible
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>
          </div>

          {/* Books List */}
          <div className="h-96 overflow-y-auto border rounded-lg mb-4">
            {filteredBooks.map((book, index) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
                  book.selected ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={book.selected}
                  onChange={() => toggleBookSelection(index)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{book.title}</div>
                  <div className="text-xs text-gray-600">{book.author}</div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    {book.myRating && <span>⭐ {book.myRating}/5</span>}
                    {book.dateRead && <span>📅 {book.dateRead}</span>}
                  </div>
                </div>
              </label>
            ))}
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

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {importing ? 'Importing...' : `Import ${books.filter(b => b.selected && b.selectedCircles.length > 0).length} Books`}
          </button>
        </>
      )}
    </div>
  )
}
