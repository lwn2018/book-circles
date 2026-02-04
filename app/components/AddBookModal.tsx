'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [selectedCircles, setSelectedCircles] = useState<string[]>(userCircles.map(c => c.id))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupStatus, setLookupStatus] = useState('')
  const router = useRouter()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
      // Create the book (without a specific circle_id, or use the first selected one)
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title: title.trim(),
          author: author.trim() || null,
          isbn: isbn.trim() || null,
          cover_url: coverUrl.trim() || null,
          owner_id: userId,
          status: 'available',
          circle_id: selectedCircles[0] // Use first selected circle as legacy field
        })
        .select()
        .single()

      if (bookError) throw bookError

      // Create visibility entries for all selected circles
      const visibilityEntries = selectedCircles.map(circleId => ({
        book_id: book.id,
        circle_id: circleId,
        is_visible: true
      }))

      const { error: visError } = await supabase
        .from('book_circle_visibility')
        .insert(visibilityEntries)

      if (visError) throw visError

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add book')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add Book to Library</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ISBN (Optional)</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => handleIsbnChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Scan or enter ISBN"
            />
            {lookupStatus && (
              <p className="text-sm text-gray-600 mt-1">{lookupStatus}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Book title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
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
              onClick={onClose}
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
