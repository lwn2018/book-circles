'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { fetchBookCover } from '@/lib/fetch-book-cover'
import { trackEvent } from '@/lib/analytics'
import { logEvent } from '@/lib/gamification/log-event-action'

type Circle = {
  id: string
  name: string
}

export default function AddBookModal({ 
  userId, 
  userCircles,
  onClose 
}: { 
  userId: string
  userCircles: Circle[]
  onClose: (success?: boolean, bookTitle?: string) => void
}) {
  const handleClose = (success?: boolean, bookTitle?: string) => {
    if (quaggaRef.current) {
      quaggaRef.current.stop()
    }
    onClose(success, bookTitle)
  }
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [fullMetadata, setFullMetadata] = useState<any>(null)
  const [selectedCircles, setSelectedCircles] = useState<string[]>(userCircles.map(c => c.id))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupStatus, setLookupStatus] = useState('')
  const [scanning, setScanning] = useState(false)
  const [titleSearchResults, setTitleSearchResults] = useState<any[]>([])
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const [bookSource, setBookSource] = useState<'barcode' | 'search' | 'manual'>('manual')
  const scannerRef = useRef<HTMLDivElement>(null)
  const quaggaRef = useRef<any>(null)
  const titleSearchTimer = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  
  const supabase = createClient()

  const lookupISBN = async (isbnValue: string) => {
    if (!isbnValue || isbnValue.length < 10) return

    setLookupStatus('Looking up book...')
    try {
      const response = await fetch(`/api/isbn-lookup?isbn=${isbnValue}`)
      const data = await response.json()

      if (response.ok) {
        setTitle(data.title || '')
        setAuthor(data.author || '')
        setCoverUrl(data.coverUrl || '')
        setFullMetadata(data.fullMetadata || null)
        setBookSource('barcode')
        setLookupStatus(`✓ Found via ${data.source}`)
        setTimeout(() => setLookupStatus(''), 3000)
      } else {
        setLookupStatus('Book not found')
        setTimeout(() => setLookupStatus(''), 3000)
      }
    } catch (err) {
      setLookupStatus('Lookup failed')
      setTimeout(() => setLookupStatus(''), 3000)
    }
  }

  const handleIsbnChange = (value: string) => {
    setIsbn(value)
    if (value.length >= 10) {
      lookupISBN(value)
    }
  }

  const searchByTitle = async (query: string) => {
    if (query.length < 3) {
      setTitleSearchResults([])
      setShowTitleDropdown(false)
      return
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=5${apiKey ? `&key=${apiKey}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.items) {
        const results = data.items.map((item: any) => ({
          id: item.id,
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors?.join(', ') || null,
          isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => 
            id.type === 'ISBN_13' || id.type === 'ISBN_10'
          )?.identifier || null,
          coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || null
        }))
        setTitleSearchResults(results)
        setShowTitleDropdown(true)
      } else {
        setTitleSearchResults([])
        setShowTitleDropdown(false)
      }
    } catch (err) {
      console.error('Title search error:', err)
      setTitleSearchResults([])
      setShowTitleDropdown(false)
    }
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    
    // Clear previous timer
    if (titleSearchTimer.current) {
      clearTimeout(titleSearchTimer.current)
    }

    // Debounce search by 300ms
    if (value.length >= 3) {
      titleSearchTimer.current = setTimeout(() => {
        searchByTitle(value)
      }, 300)
    } else {
      setTitleSearchResults([])
      setShowTitleDropdown(false)
    }
  }

  const selectSearchResult = (result: any) => {
    setTitle(result.title)
    setAuthor(result.author || '')
    setIsbn(result.isbn || '')
    setBookSource('search')
    setCoverUrl(result.coverUrl || '')
    setTitleSearchResults([])
    setShowTitleDropdown(false)
  }

  const toggleCircle = (circleId: string) => {
    setSelectedCircles(prev => 
      prev.includes(circleId) 
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!title.trim()) {
      setError('Title is required')
      setLoading(false)
      return
    }

    if (selectedCircles.length === 0) {
      setError('Select at least one circle')
      setLoading(false)
      return
    }

    try {
      // Try to fetch cover if we don't have one yet
      let finalCoverUrl = coverUrl.trim() || null
      if (!finalCoverUrl) {
        setLookupStatus('Checking for cover art...')
        const coverResult = await fetchBookCover(
          isbn.trim() || null,
          title.trim(),
          author.trim() || null
        )
        if (coverResult.coverUrl) {
          finalCoverUrl = coverResult.coverUrl
          setCoverUrl(coverResult.coverUrl)
          setLookupStatus(`✓ Found cover via ${coverResult.source}`)
        } else {
          setLookupStatus('')
        }
      }

      // Use retail price from metadata, or default to $20 CAD
      const retailPrice = fullMetadata?.retail_price_cad || 20.0

      // Create the book via API route (handles auth server-side)
      const response = await fetch('/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || null,
          isbn: isbn.trim() || fullMetadata?.isbn13 || null,
          isbn10: fullMetadata?.isbn10 || null,
          cover_url: finalCoverUrl,
          cover_source: fullMetadata?.cover_source || null,
          retail_price_cad: retailPrice,
          format: fullMetadata?.format || null,
          page_count: fullMetadata?.page_count || null,
          publish_date: fullMetadata?.publish_date || null,
          publisher: fullMetadata?.publisher || null,
          description: fullMetadata?.description || null,
          language: fullMetadata?.language || null,
          metadata_sources: fullMetadata?.metadata_sources || [],
          metadata_updated_at: fullMetadata?.metadata_updated_at || new Date().toISOString(),
          selectedCircles,
          userCircles,
          source: bookSource
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add book')
      }

      const book = result.book

      // Track book added (client-side analytics)
      trackEvent.bookAdded(book.id, bookSource, !!finalCoverUrl, selectedCircles)

      router.refresh()
      handleClose(true, title.trim())
    } catch (err: any) {
      setError(err.message || 'Failed to add book')
      setLoading(false)
    }
  }

  const startScanner = () => {
    setScanning(true)
    setError('')
  }

  // Initialize Quagga when scanner element appears
  useEffect(() => {
    if (!scanning || !scannerRef.current) return

    const initQuagga = async () => {
      try {
        // Dynamically import Quagga
        const Quagga = (await import('@ericblade/quagga2')).default

        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: scannerRef.current!,
              constraints: {
                facingMode: 'environment',
                width: { min: 640 },
                height: { min: 480 }
              }
            },
            decoder: {
              readers: ['ean_reader', 'ean_8_reader']
            }
          },
          (err: any) => {
            if (err) {
              console.error('Quagga init error:', err)
              setError('Failed to start camera. Please check permissions.')
              setScanning(false)
              return
            }
            Quagga.start()
          }
        )

        Quagga.onDetected((data: any) => {
          const code = data.codeResult.code
          handleIsbnChange(code)
          stopScanner()
        })

        quaggaRef.current = Quagga
      } catch (err) {
        console.error('Failed to load scanner:', err)
        setError('Failed to initialize scanner')
        setScanning(false)
      }
    }

    initQuagga()
  }, [scanning])

  const stopScanner = () => {
    if (quaggaRef.current) {
      quaggaRef.current.stop()
      quaggaRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (quaggaRef.current) {
        quaggaRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (titleSearchTimer.current) {
        clearTimeout(titleSearchTimer.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="bg-white rounded-lg max-w-2xl p-6 my-auto" style={{ width: '100%', minWidth: '280px', maxWidth: '42rem', boxSizing: 'border-box' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add Book to Library</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', width: '100%' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label className="block text-sm font-medium">ISBN (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input
                type="text"
                value={isbn}
                onChange={(e) => handleIsbnChange(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                style={{ flex: '1 1 0', minWidth: '0', width: '100%', boxSizing: 'border-box' }}
                placeholder="Enter ISBN or scan barcode"
                disabled={scanning}
              />
              <button
                type="button"
                onClick={scanning ? stopScanner : startScanner}
                className={`px-4 py-2 rounded-lg font-medium ${
                  scanning 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {scanning ? '⏹ Stop' : '📷 Scan'}
              </button>
            </div>
            {lookupStatus && (
              <p className="text-sm text-gray-600 mt-1">{lookupStatus}</p>
            )}
          </div>

          {scanning && (
            <div className="border rounded-lg overflow-hidden bg-black">
              <div ref={scannerRef} className="w-full h-64" />
              <p className="text-center text-sm text-white py-2 bg-black">
                Position barcode in camera view
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.25rem', position: 'relative' }}>
            <label className="block text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => {
                if (titleSearchResults.length > 0) {
                  setShowTitleDropdown(true)
                }
              }}
              className="px-3 py-2 border rounded-lg"
              style={{ display: 'block', width: '100%', minWidth: '0', boxSizing: 'border-box' }}
              placeholder="Start typing to search books..."
              required
            />
            
            {/* Title search dropdown */}
            {showTitleDropdown && titleSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {titleSearchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full flex gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
                  >
                    {/* Cover thumbnail */}
                    {result.coverUrl ? (
                      <img 
                        src={result.coverUrl} 
                        alt={result.title}
                        className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📚</span>
                      </div>
                    )}
                    
                    {/* Book details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm line-clamp-2">{result.title}</div>
                      {result.author && (
                        <div className="text-xs text-gray-600 mt-1">{result.author}</div>
                      )}
                      {result.isbn && (
                        <div className="text-xs text-gray-400 mt-1">ISBN: {result.isbn}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label className="block text-sm font-medium">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              style={{ display: 'block', width: '100%', minWidth: '0', boxSizing: 'border-box' }}
              placeholder="Author name"
            />
          </div>

          {coverUrl && (
            <div>
              <label className="block text-sm font-medium mb-1">Cover Preview</label>
              <img src={coverUrl} alt="Book cover" className="w-24 h-32 object-cover rounded" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Make visible in:</label>
            <div className="space-y-2">
              {userCircles.map(circle => (
                <label key={circle.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCircles.includes(circle.id)}
                    onChange={() => toggleCircle(circle.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{circle.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
