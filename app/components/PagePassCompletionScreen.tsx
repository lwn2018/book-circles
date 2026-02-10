'use client'

import { useState } from 'react'

type Props = {
  book: {
    id: string
    title: string
    author: string | null
    isbn: string | null
    cover_url: string | null
  }
  onClose: () => void
}

export default function PagePassCompletionScreen({ book, onClose }: Props) {
  const [trackingBuy, setTrackingBuy] = useState(false)
  const [trackingGift, setTrackingGift] = useState(false)

  const handleBuyClick = async (context: 'post_pagepass_self' | 'post_pagepass_gift') => {
    const isGift = context === 'post_pagepass_gift'
    const setLoading = isGift ? setTrackingGift : setTrackingBuy
    
    setLoading(true)

    try {
      // Generate Amazon affiliate URL
      const affiliateTag = 'pagepass04-20'
      const searchQuery = book.isbn 
        ? encodeURIComponent(book.isbn)
        : encodeURIComponent(`${book.title} ${book.author || ''}`.trim())
      const amazonUrl = `https://www.amazon.ca/s?k=${searchQuery}&tag=${affiliateTag}`

      // Track the click
      await fetch('/api/track-purchase-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id,
          isbn: book.isbn,
          book_title: book.title,
          book_author: book.author,
          click_context: context,
          affiliate_url: amazonUrl
        })
      })

      // Open Amazon in new tab
      window.open(amazonUrl, '_blank', 'noopener,noreferrer')
      
      // Close the completion screen after a brief delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Failed to track purchase click:', error)
      // Still open Amazon even if tracking fails
      const affiliateTag = 'pagepass04-20'
      const fallbackQuery = book.isbn
        ? encodeURIComponent(book.isbn)
        : encodeURIComponent(book.title)
      const fallbackUrl = `https://www.amazon.ca/s?k=${fallbackQuery}&tag=${affiliateTag}`
      
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      
      setTimeout(() => {
        onClose()
      }, 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Completion Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          {/* Book Cover */}
          <div className="flex justify-center mb-6">
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={book.title}
                className="w-32 h-48 object-cover rounded shadow-lg"
              />
            ) : (
              <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-5xl">📚</span>
              </div>
            )}
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-center mb-2">
            Finished with {book.title}!
          </h2>
          
          {book.author && (
            <p className="text-center text-gray-600 mb-8">by {book.author}</p>
          )}

          {/* Action Buttons - Visually Muted */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleBuyClick('post_pagepass_self')}
              disabled={trackingBuy}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {trackingBuy ? 'Opening...' : 'Buy your own copy'}
            </button>
            
            <button
              onClick={() => handleBuyClick('post_pagepass_gift')}
              disabled={trackingGift}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {trackingGift ? 'Opening...' : 'Gift this book'}
            </button>
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
