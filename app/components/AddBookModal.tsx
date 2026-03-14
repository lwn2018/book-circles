'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { fetchBookCover } from '@/lib/fetch-book-cover'
import { trackEvent } from '@/lib/analytics'
import { isNative } from '@/lib/platform'
import { scanBarcode, validateISBN, checkScanPermissions, requestScanPermission } from '@/lib/barcodeScanner'

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
    const validation = validateISBN(isbnValue)
    if (!validation.valid) {
      setLookupStatus(validation.message || 'Invalid barcode')
      setTimeout(() => setLookupStatus(''), 5000)
      return
    }
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
    if (value.length >= 10) lookupISBN(value)
  }

  const searchByTitle = async (query: string) => {
    if (query.length < 3) {
      setTitleSearchResults([])
      setShowTitleDropdown(false)
      return
    }
    try {
      const response = await fetch(`/api/book-search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        setTitleSearchResults(data.results)
        setShowTitleDropdown(true)
      } else {
        setTitleSearchResults([])
        setShowTitleDropdown(false)
      }
    } catch (err) {
      setTitleSearchResults([])
      setShowTitleDropdown(false)
    }
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleSearchTimer.current) clearTimeout(titleSearchTimer.current)
    if (value.length >= 3) {
      titleSearchTimer.current = setTimeout(() => searchByTitle(value), 300)
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
      prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId]
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
      let finalCoverUrl = coverUrl.trim() || null
      if (!finalCoverUrl) {
        setLookupStatus('Checking for cover art...')
        const coverResult = await fetchBookCover(isbn.trim() || null, title.trim(), author.trim() || null)
        if (coverResult.coverUrl) {
          finalCoverUrl = coverResult.coverUrl
          setCoverUrl(coverResult.coverUrl)
          setLookupStatus(`✓ Found cover via ${coverResult.source}`)
        } else {
          setLookupStatus('')
        }
      }
      const retailPrice = fullMetadata?.retail_price_cad || 20.0
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
      if (!response.ok) throw new Error(result.error || 'Failed to add book')
      trackEvent.bookAdded(result.book.id, bookSource, !!finalCoverUrl, selectedCircles)
      router.refresh()
      handleClose(true, title.trim())
    } catch (err: any) {
      setError(err.message || 'Failed to add book')
      setLoading(false)
    }
  }

  const startNativeScanner = async () => {
    setError('')
    setLookupStatus('Opening camera...')
    try {
      const permStatus = await checkScanPermissions()
      if (!permStatus.granted && permStatus.canRequest) {
        const granted = await requestScanPermission()
        if (!granted) {
          setError('Camera permission required')
          setLookupStatus('')
          return
        }
      } else if (!permStatus.granted) {
        setError(permStatus.message || 'Camera access denied')
        setLookupStatus('')
        return
      }
      setLookupStatus('Scanning...')
      const result = await scanBarcode()
      if (result) {
        setIsbn(result.isbn)
        setLookupStatus('')
        await lookupISBN(result.isbn)
      } else {
        setLookupStatus('Scan cancelled')
        setTimeout(() => setLookupStatus(''), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan')
      setLookupStatus('')
    }
  }

  const startWebScanner = () => {
    setScanning(true)
    setError('')
  }

  const startScanner = () => {
    isNative() ? startNativeScanner() : startWebScanner()
  }

  useEffect(() => {
    if (!scanning || !scannerRef.current) return
    const initQuagga = async () => {
      try {
        const Quagga = (await import('@ericblade/quagga2')).default
        Quagga.init({
          inputStream: { type: 'LiveStream', target: scannerRef.current!, constraints: { facingMode: 'environment', width: { min: 640 }, height: { min: 480 } } },
          decoder: { readers: ['ean_reader', 'ean_8_reader'] }
        }, (err: any) => {
          if (err) { setError('Failed to start camera'); setScanning(false); return }
          Quagga.start()
        })
        Quagga.onDetected((data: any) => { handleIsbnChange(data.codeResult.code); stopScanner() })
        quaggaRef.current = Quagga
      } catch (err) { setError('Failed to initialize scanner'); setScanning(false) }
    }
    initQuagga()
  }, [scanning])

  const stopScanner = () => {
    if (quaggaRef.current) { quaggaRef.current.stop(); quaggaRef.current = null }
    setScanning(false)
  }

  useEffect(() => { return () => { if (quaggaRef.current) quaggaRef.current.stop() } }, [])
  useEffect(() => { return () => { if (titleSearchTimer.current) clearTimeout(titleSearchTimer.current) } }, [])

  // Dark theme input styles
  const inputClass = "w-full px-4 py-3 bg-[#1E1E1E] border border-[#333] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent"
  const labelClass = "block text-sm font-medium text-[#9CA3AF] mb-2"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-lg p-6 my-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Add Book to Library
          </h2>
          <button 
            onClick={() => handleClose()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#9CA3AF] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ISBN */}
          <div>
            <label className={labelClass}>ISBN (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={isbn}
                onChange={(e) => handleIsbnChange(e.target.value)}
                className={inputClass}
                placeholder="Enter ISBN or scan barcode"
                disabled={scanning}
              />
              <button
                type="button"
                onClick={scanning ? stopScanner : startScanner}
                className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                  scanning 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-[#55B2DE] text-white hover:bg-[#4A9FCB]'
                }`}
              >
                <span>📷</span>
                <span>{scanning ? 'Stop' : 'Scan'}</span>
              </button>
            </div>
            {lookupStatus && (
              <p className="text-sm text-[#55B2DE] mt-2">{lookupStatus}</p>
            )}
          </div>

          {/* Scanner view */}
          {scanning && !isNative() && (
            <div className="rounded-xl overflow-hidden bg-black">
              <div ref={scannerRef} className="w-full h-48" />
              <p className="text-center text-sm text-white py-2">Position barcode in camera view</p>
            </div>
          )}

          {/* Title */}
          <div className="relative">
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => titleSearchResults.length > 0 && setShowTitleDropdown(true)}
              className={inputClass}
              placeholder="Start typing to search books..."
              required
            />
            {showTitleDropdown && titleSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-[#27272A] border border-[#333] rounded-xl shadow-xl max-h-72 overflow-y-auto">
                {titleSearchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full flex gap-3 p-3 hover:bg-[#3F3F46] border-b border-[#333] last:border-0 text-left transition-colors"
                  >
                    {result.coverUrl ? (
                      <img src={result.coverUrl} alt={result.title} className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 bg-[#3F3F46] rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📚</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm line-clamp-2">{result.title}</div>
                      {result.author && <div className="text-xs text-[#9CA3AF] mt-1">{result.author}</div>}
                      {result.isbn && <div className="text-xs text-[#6B7280] mt-1">ISBN: {result.isbn}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Author */}
          <div>
            <label className={labelClass}>Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={inputClass}
              placeholder="Author name"
            />
          </div>

          {/* Cover Preview */}
          {coverUrl && (
            <div>
              <label className={labelClass}>Cover Preview</label>
              <img src={coverUrl} alt="Book cover" className="w-20 h-28 object-cover rounded-lg shadow-lg" />
            </div>
          )}

          {/* Circles */}
          <div>
            <label className={labelClass}>Make visible in:</label>
            <div className="space-y-2">
              {userCircles.map(circle => (
                <label 
                  key={circle.id} 
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] transition-colors"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedCircles.includes(circle.id)}
                      onChange={() => toggleCircle(circle.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedCircles.includes(circle.id)
                        ? 'bg-[#55B2DE] border-[#55B2DE]'
                        : 'border-[#6B7280]'
                    }`}>
                      {selectedCircles.includes(circle.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-white text-sm">{circle.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
            <button
              type="button"
              onClick={() => handleClose()}
              className="px-6 py-3 bg-[#27272A] text-[#9CA3AF] rounded-xl font-medium hover:bg-[#3F3F46] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
