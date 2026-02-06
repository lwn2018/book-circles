'use client'

import { useState } from 'react'

type Props = {
  book: {
    id?: string
    title: string
    author?: string | null
    isbn?: string | null
  }
  context: 
    | 'unavailable_to_borrow'
    | 'post_read_buy_own_copy'
    | 'browsing_recommendation'
    | 'gift_purchase'
    | 'post_pagepass_self'
    | 'post_pagepass_gift'
  circleId?: string
  searchQuery?: string
  variant?: 'primary' | 'secondary' | 'link'
  children?: React.ReactNode
}

export default function BuyAmazonButton({
  book,
  context,
  circleId,
  searchQuery,
  variant = 'primary',
  children
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)

    try {
      // Generate Amazon affiliate URL
      const affiliateTag = 'pagepass-20'
      let amazonUrl: string

      if (book.isbn) {
        amazonUrl = `https://www.amazon.ca/dp/${book.isbn}?tag=${affiliateTag}`
      } else {
        const searchQuery = encodeURIComponent(`${book.title} ${book.author || ''}`.trim())
        amazonUrl = `https://www.amazon.ca/s?k=${searchQuery}&tag=${affiliateTag}`
      }

      // Track the click
      await fetch('/api/track-purchase-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id || null,
          isbn: book.isbn || null,
          book_title: book.title,
          book_author: book.author || null,
          click_context: context,
          circle_id: circleId || null,
          search_query: searchQuery || null,
          affiliate_url: amazonUrl
        })
      })

      // Open Amazon in new tab
      window.open(amazonUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to track purchase click:', error)
      // Still open Amazon even if tracking fails
      const affiliateTag = 'pagepass-20'
      const fallbackUrl = book.isbn
        ? `https://www.amazon.ca/dp/${book.isbn}?tag=${affiliateTag}`
        : `https://www.amazon.ca/s?k=${encodeURIComponent(book.title)}&tag=${affiliateTag}`
      
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  // Style variants
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition disabled:opacity-50'
  const variantStyles = {
    primary: 'px-4 py-2 bg-orange-600 text-white hover:bg-orange-700',
    secondary: 'px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50',
    link: 'text-blue-600 hover:underline'
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {loading ? 'Opening...' : (children || '🛒 Buy on Amazon')}
    </button>
  )
}
