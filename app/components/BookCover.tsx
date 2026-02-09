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
  sizes
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false)

  // Show placeholder if no cover URL or if image failed to load
  if (!coverUrl || imageError) {
    return (
      <BookCoverPlaceholder
        title={title}
        author={author}
        isbn={isbn}
        className={className}
      />
    )
  }

  // For Next.js Image component (when using fill or explicit dimensions)
  if (fill || (width && height)) {
    return (
      <Image
        src={coverUrl}
        alt={alt || `Cover of ${title}`}
        className={className}
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
      className={className}
      onError={() => setImageError(true)}
    />
  )
}
