'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type ParsedBook = {
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  myRating: number | null
  exclusiveShelf: string | null
  selected: boolean
}

export default function OnboardingImport() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // States
  const [step, setStep] = useState<'upload' | 'select' | 'success'>('upload')
  const [books, setBooks] = useState<ParsedBook[]>([])
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')

  // Filters
  const [activeShelf, setActiveShelf] = useState<'all' | 'read' | 'to-read'>('all')

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (activeShelf === 'all') return true
      return book.exclusiveShelf === activeShelf
    })
  }, [books, activeShelf])

  const selectedCount = books.filter(b => b.selected).length
  const shelfCounts = useMemo(() => ({
    all: books.length,
    read: books.filter(b => b.exclusiveShelf === 'read').length,
    'to-read': books.filter(b => b.exclusiveShelf === 'to-read').length
  }), [books])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
      
      const titleIdx = headers.findIndex(h => h === 'title')
      const authorIdx = headers.findIndex(h => h === 'author')
      const isbnIdx = headers.findIndex(h => h === 'isbn')
      const isbn13Idx = headers.findIndex(h => h === 'isbn13')
      const ratingIdx = headers.findIndex(h => h === 'my rating')
      const shelfIdx = headers.findIndex(h => h === 'exclusive shelf')

      const parsed: ParsedBook[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue
        
        // Simple CSV parsing (handles basic cases)
        const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
        
        if (values[titleIdx]) {
          parsed.push({
            title: values[titleIdx] || '',
            author: values[authorIdx] || 'Unknown',
            isbn: values[isbnIdx] || null,
            isbn13: values[isbn13Idx] || null,
            myRating: ratingIdx >= 0 ? parseInt(values[ratingIdx]) || null : null,
            exclusiveShelf: values[shelfIdx] || null,
            selected: false
          })
        }
      }

      setBooks(parsed)
      setStep('select')
    } catch (err: any) {
      setError('Failed to parse CSV file')
    } finally {
      setUploading(false)
    }
  }

  const toggleBook = (index: number) => {
    const bookIndex = books.findIndex(b => b === filteredBooks[index])
    if (bookIndex >= 0) {
      const updated = [...books]
      updated[bookIndex].selected = !updated[bookIndex].selected
      setBooks(updated)
    }
  }

  const selectAll = () => {
    const filteredSet = new Set(filteredBooks)
    setBooks(books.map(b => ({ ...b, selected: filteredSet.has(b) ? true : b.selected })))
  }

  const deselectAll = () => {
    setBooks(books.map(b => ({ ...b, selected: false })))
  }

  const handleImport = async () => {
    const selected = books.filter(b => b.selected)
    if (selected.length === 0) return

    setImporting(true)
    setImportProgress({ current: 0, total: selected.length })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's circles
      const { data: circles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)
      
      const circleIds = circles?.map(c => c.circle_id) || []

      for (let i = 0; i < selected.length; i++) {
        const book = selected[i]
        setImportProgress({ current: i + 1, total: selected.length })

        try {
          await fetch('/api/books/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: book.title,
              author: book.author,
              isbn: book.isbn13 || book.isbn,
              selectedCircles: circleIds,
              userCircles: circleIds.map(id => ({ id })),
              source: 'goodreads'
            })
          })
        } catch (err) {
          console.error('Failed to import book:', book.title)
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200))
      }

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleSkip = () => router.push('/onboarding/welcome')

  // SUCCESS SCREEN
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#121212] px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={handleSkip} className="text-white font-medium">Skip</button>
        </div>

        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Import Success</h1>
          <p className="text-gray-400 mb-12">Your books have been added to your library.</p>

          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-40 h-40 bg-[#55B2DE] rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-[#1E293B] rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -top-2 right-0 w-12 h-12 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -left-4 w-12 h-12 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">Success!</h2>
            <p className="text-gray-400 mb-2">{selectedCount} books imported to your library</p>
            <p className="text-gray-500 text-sm">You can add more anytime from Settings</p>
          </div>

          <button
            onClick={() => router.push('/onboarding/welcome')}
            className="w-full py-4 bg-[#55B2DE] text-white rounded-full font-semibold hover:bg-[#4A9FCB] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // SELECT BOOKS SCREEN
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#121212] px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep('upload')} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={handleSkip} className="text-white font-medium">Skip</button>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
          <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
          <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Select books to import</h1>
        <p className="text-gray-400 mb-4">We found {books.length} books. Select the ones you want to add.</p>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['all', 'read', 'to-read'] as const).map(shelf => (
            <button
              key={shelf}
              onClick={() => setActiveShelf(shelf)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeShelf === shelf ? 'bg-[#55B2DE] text-white' : 'bg-[#1E293B] text-gray-400'
              }`}
            >
              {shelf === 'all' ? '📚 All' : shelf === 'read' ? '✅ Read' : '📖 To-Read'} ({shelfCounts[shelf]})
            </button>
          ))}
        </div>

        {/* Selection controls */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400"><strong className="text-white">{selectedCount}</strong> selected</span>
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-sm text-[#55B2DE]">Select all</button>
            <button onClick={deselectAll} className="text-sm text-gray-500">Clear</button>
          </div>
        </div>

        {/* Book list */}
        <div className="bg-[#1E293B] rounded-xl overflow-hidden mb-4 max-h-[50vh] overflow-y-auto">
          {filteredBooks.map((book, index) => (
            <div
              key={index}
              onClick={() => toggleBook(index)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[#333] last:border-0 cursor-pointer ${
                book.selected ? 'bg-[#55B2DE]/10' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                book.selected ? 'bg-[#55B2DE] border-[#55B2DE]' : 'border-gray-500'
              }`}>
                {book.selected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{book.title}</p>
                <p className="text-gray-500 text-xs truncate">{book.author}</p>
              </div>
              {book.myRating && book.myRating > 0 && (
                <span className="text-amber-500 text-xs">{'★'.repeat(book.myRating)}</span>
              )}
            </div>
          ))}
        </div>

        {/* Import button */}
        {importing ? (
          <div className="bg-[#1E293B] rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white">Importing...</span>
              <span className="text-sm text-[#55B2DE]">{importProgress.current}/{importProgress.total}</span>
            </div>
            <div className="w-full bg-[#27272A] rounded-full h-2">
              <div
                className="bg-[#55B2DE] h-2 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={handleImport}
            disabled={selectedCount === 0}
            className="w-full py-4 bg-[#55B2DE] text-white rounded-full font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors"
          >
            Import {selectedCount} Book{selectedCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    )
  }

  // UPLOAD SCREEN
  return (
    <div className="min-h-screen bg-[#121212] px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={handleSkip} className="text-white font-medium">Skip</button>
      </div>

      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-gray-700 rounded-full" />
      </div>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Import your books</h1>
        <p className="text-gray-400 mb-8">
          Let's build your library! You can import your books now, or add them manually later.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Import from Goodreads */}
          <div className="bg-[#1E293B] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📚</span> Import from Goodreads
            </h2>
            
            <div className="bg-[#27272A] rounded-xl p-4 mb-4">
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex gap-2">
                  <span className="text-gray-500">1.</span>
                  <span>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-[#55B2DE] hover:underline">Goodreads Export</a></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500">2.</span>
                  <span>Click "Export Library"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500">3.</span>
                  <span>Download the CSV file</span>
                </li>
              </ol>
            </div>

            {/* Mobile warning */}
            <div className="bg-[#27272A] rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400">
                <span className="text-[#55B2DE]">📱 On mobile?</span> Downloading your books from Goodreads doesn't work well on mobile. Download it on desktop and add it to your library at <span className="text-[#55B2DE]">PagePass.app</span>
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-[#55B2DE] hover:bg-[#55B2DE]/5 transition-colors mb-4 disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-gray-400">Processing...</span>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#55B2DE]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <span className="text-gray-400 text-sm">Tap to select your CSV file</span>
                </>
              )}
            </button>
          </div>

          {/* Add Manually */}
          <button
            onClick={handleSkip}
            className="w-full py-4 bg-[#1E293B] rounded-2xl hover:bg-[#27272A] transition-colors"
          >
            <span className="text-white font-medium flex items-center justify-center gap-2">
              <span>✏️</span> I'll add my books one at a time
            </span>
          </button>

          {/* Skip */}
          <button onClick={handleSkip} className="w-full py-3 text-gray-500 hover:text-white transition-colors">
            Don't import now
          </button>
        </div>
      </div>
    </div>
  )
}
