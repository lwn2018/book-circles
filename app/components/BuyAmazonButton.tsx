'use client'

import { isNative } from '@/lib/platform'
import { openExternal } from '@/lib/externalLinks'

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
  // Generate Amazon affiliate URL
  const affiliateTag = 'pagepass04-20'
  const query = book.isbn 
    ? encodeURIComponent(book.isbn)
    : encodeURIComponent(`${book.title} ${book.author || ''}`.trim())
  const amazonUrl = `https://www.amazon.ca/s?k=${query}&tag=${affiliateTag}`

  // Track click asynchronously (fire and forget)
  const trackClick = () => {
    fetch('/api/track-purchase-click', {
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
    }).catch(err => console.error('Failed to track purchase click:', err))
  }

  // Handle click - use external browser on native, normal behavior on web
  const handleClick = async (e: React.MouseEvent) => {
    trackClick()
    
    if (isNative()) {
      e.preventDefault()
      await openExternal(amazonUrl)
    }
    // On web, let the anchor tag handle it normally
  }

  // Style variants
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition'
  const variantStyles = {
    primary: 'px-4 py-2 bg-orange-600 text-white hover:bg-orange-700',
    secondary: 'px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50',
    link: 'text-blue-600 hover:underline'
  }

  // Use anchor tag - Safari NEVER blocks regular anchor tags
  // On native, we intercept and use Browser plugin to open in system browser
  return (
    <a
      href={amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children || '🛒 Buy on Amazon'}
    </a>
  )
}
