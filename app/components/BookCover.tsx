'use client'

import { useState } from 'react'
import Image from 'next/image'
import BookCoverPlaceholder from './BookCoverPlaceholder'

interface BookCoverProps {
  coverUrl?: string | null
  title: string
  author?: string | null
  isbn?: string | null
  alt?: string
  className?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  status?: 'available' | 'borrowed' | 'in_transit' | 'off_shelf'
}

/**
 * Book cover component with automatic fallback to styled placeholder
 * Use this instead of raw <img> tags for book covers
 */
export default function BookCover({
  coverUrl,
  title,
  author,
  isbn,
  alt,
  className = '',
  priority = false,
  fill = false,
  width,
  height,
  sizes,
  status = 'available'
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false)

  // Apply opacity based on book status
  // Available: 100% (opacity-100), Borrowed/In Transit: 70% (opacity-70), Off Shelf: 50% (opacity-50)
  const getOpacityClass = () => {
    if (status === 'off_shelf') return 'opacity-50'
    if (status === 'borrowed' || status === 'in_transit') return 'opacity-70'
    return 'opacity-100'
  }

  const opacityClass = getOpacityClass()

  // Show placeholder if no cover URL or if image failed to load
  if (!coverUrl || imageError) {
    return (
      <BookCoverPlaceholder
        title={title}
        author={author}
        isbn={isbn}
        className={className}
        status={status}
      />
    )
  }

  // For Next.js Image component (when using fill or explicit dimensions)
  if (fill || (width && height)) {
    return (
      <Image
        src={coverUrl}
        alt={alt || `Cover of ${title}`}
        className={`${className} ${opacityClass}`}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        onError={() => setImageError(true)}
      />
    )
  }

  // For regular img tag (maintains existing behavior)
  return (
    <img
      src={coverUrl}
      alt={alt || `Cover of ${title}`}
      className={`${className} ${opacityClass}`}
      onError={() => setImageError(true)}
    />
  )
}
