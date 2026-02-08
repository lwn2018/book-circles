'use client'

import { useState } from 'react'
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
  coverUrl?: string
  selectedCircles: string[]
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

        if (title) {
          parsedBooks.push({
            title,
            author,
            isbn: isbn13 || isbn, // Prefer ISBN13
            selectedCircles: userCircles.map(c => c.id) // Default: all circles
          })
        }
      }

      setBooks(parsedBooks)
      setParsing(false)
      
      if (parsedBooks.length === 0) {
        setError('No valid books found in CSV')
      } else {
        setSuccess(`Found ${parsedBooks.length} books!`)
      }
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`)
      setParsing(false)
    }
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

  const toggleAllCirclesForBook = (bookIndex: number) => {
    setBooks(prev => {
      const updated = [...prev]
      const book = updated[bookIndex]
      book.selectedCircles = book.selectedCircles.length === userCircles.length
        ? []
        : userCircles.map(c => c.id)
      return updated
    })
  }

  const handleImport = async () => {
    if (books.length === 0) return

    setImporting(true)
    setError('')
    let successCount = 0
    let errorCount = 0

    for (const book of books) {
      if (book.selectedCircles.length === 0) continue // Skip if no circles selected

      try {
        // Create the book
        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            owner_id: userId,
            status: 'available',
            circle_id: book.selectedCircles[0] // Use first selected circle as legacy field
          })
          .select()
          .single()

        if (bookError) throw bookError

        // Create visibility entries
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

      {/* Books Preview */}
      {books.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Review & Select Circles ({books.length} books)</h3>
            <p className="text-sm text-gray-600">
              Choose which circles can see each book. Uncheck a book from all circles to skip importing it.
            </p>
          </div>

          <div className="h-96 overflow-y-auto border rounded-lg flex-shrink-0">
            {books.map((book, index) => (
              <div key={index} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-gray-600">{book.author}</p>
                    {book.isbn && (
                      <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleAllCirclesForBook(index)}
                    className="text-xs text-blue-600 hover:underline ml-4"
                  >
                    {book.selectedCircles.length === userCircles.length ? 'Deselect All' : 'Select All'}
                  </button>
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
                          onChange={() => toggleCircleForBook(index, circle.id)}
                          className="sr-only"
                        />
                        {circle.name}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || books.every(b => b.selectedCircles.length === 0)}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {importing ? 'Importing...' : `Import ${books.filter(b => b.selectedCircles.length > 0).length} Books`}
          </button>
        </>
      )}
    </div>
  )
}
