import { NextRequest, NextResponse } from 'next/server'
import { fetchBookMetadata } from '@/lib/bookMetadata'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isbn = searchParams.get('isbn')

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN required' }, { status: 400 })
  }

  try {
    const metadata = await fetchBookMetadata(isbn)

    if (!metadata.title && !metadata.author) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Return in format expected by existing UI
    return NextResponse.json({
      title: metadata.title || '',
      author: metadata.author || '',
      coverUrl: metadata.cover_url || '',
      source: metadata.cover_source || 'unknown',
      // Include all metadata for storage
      fullMetadata: metadata
    })
  } catch (error) {
    console.error('ISBN lookup error:', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
