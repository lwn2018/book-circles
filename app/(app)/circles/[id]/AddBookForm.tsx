'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { fetchBookCover } from '@/lib/fetch-book-cover'

export default function AddBookForm({ circleId, userId }: { circleId: string; userId: string }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lookupStatus, setLookupStatus] = useState('')
  const scannerRef = useRef<HTMLDivElement>(null)
  const quaggaRef = useRef<any>(null)
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

  const startScanning = async () => {
    if (!scannerRef.current) {
      setError('Scanner initialization failed')
      return
    }
    
    setScanning(true)
    setError('')

    try {
      // Dynamically import Quagga2 for browser-only execution
      const Quagga = (await import('@ericblade/quagga2')).default
      quaggaRef.current = Quagga

      await Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        },
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader']
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        }
      }, (err) => {
        if (err) {
          console.error('Quagga init error:', err)
          setError('Camera failed to start. Make sure you allowed camera access.')
          setScanning(false)
          return
        }
        
        Quagga.start()
        
        Quagga.onDetected((result) => {
          if (result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code
            if (code.length === 13 || code.length === 10) {
              setIsbn(code)
              lookupISBN(code)
              stopScanning()
            }
          }
        })
      })
    } catch (err: any) {
      console.error('Scanner error:', err)
      setError('Failed to start camera. Try typing the ISBN instead.')
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (quaggaRef.current) {
      quaggaRef.current.stop()
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (quaggaRef.current && scanning) {
        quaggaRef.current.stop()
      }
    }
  }, [scanning])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Try to fetch cover if we don't have one yet
    let finalCoverUrl = coverUrl || null
    if (!finalCoverUrl) {
      setLookupStatus('Checking for cover art...')
      const coverResult = await fetchBookCover(
        isbn || null,
        title,
        author || null
      )
      if (coverResult.coverUrl) {
        finalCoverUrl = coverResult.coverUrl
        setCoverUrl(coverResult.coverUrl)
        setLookupStatus(`✓ Found cover via ${coverResult.source}`)
      } else {
        setLookupStatus('')
      }
    }

    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert({
        title,
        author: author || null,
        isbn: isbn || null,
        cover_url: finalCoverUrl,
        added_by: userId,
        owner_id: userId,
        status: 'available'
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Make visible in this circle
    await supabase
      .from('book_circle_visibility')
      .insert({
        book_id: newBook.id,
        circle_id: circleId,
        is_visible: true
      })

    // Reset form
    setTitle('')
    setAuthor('')
    setIsbn('')
    setCoverUrl('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">ISBN</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={isbn}
            onChange={(e) => handleIsbnChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Enter or scan ISBN"
          />
          <button
            type="button"
            onClick={scanning ? stopScanning : startScanning}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              scanning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {scanning ? '🛑 Stop' : '📷 Scan'}
          </button>
        </div>
        {lookupStatus && (
          <p className="text-xs text-gray-600 mt-1">{lookupStatus}</p>
        )}
      </div>

      {/* Scanner container - always rendered but hidden when not scanning */}
      <div className={`border rounded-lg overflow-hidden bg-black ${scanning ? '' : 'hidden'}`}>
        <div ref={scannerRef} className="w-full h-64" style={{ position: 'relative' }}>
          <canvas className="drawingBuffer" style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%'
          }} />
        </div>
        <p className="text-xs text-white text-center py-2 bg-gray-800">
          Point camera at the barcode on the back of the book
        </p>
      </div>

      {coverUrl && (
        <div>
          <label className="block text-sm font-medium mb-1">Cover Preview</label>
          <img src={coverUrl} alt="Book cover" className="h-32 rounded border" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? 'Adding...' : 'Add Book'}
      </button>
    </form>
  )
}
