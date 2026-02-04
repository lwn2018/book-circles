import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isbn = searchParams.get('isbn')

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN required' }, { status: 400 })
  }

  // Try Google Books API first
  try {
    const googleResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    )
    const googleData = await googleResponse.json()

    if (googleData.items && googleData.items.length > 0) {
      const book = googleData.items[0].volumeInfo
      return NextResponse.json({
        title: book.title || '',
        author: book.authors?.join(', ') || '',
        coverUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                  book.imageLinks?.smallThumbnail?.replace('http:', 'https:') || '',
        source: 'Google Books'
      })
    }
  } catch (error) {
    console.error('Google Books API error:', error)
  }

  // Fallback to Open Library
  try {
    const openLibResponse = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    )
    const openLibData = await openLibResponse.json()
    const bookKey = `ISBN:${isbn}`

    if (openLibData[bookKey]) {
      const book = openLibData[bookKey]
      return NextResponse.json({
        title: book.title || '',
        author: book.authors?.map((a: any) => a.name).join(', ') || '',
        coverUrl: book.cover?.large || book.cover?.medium || book.cover?.small || '',
        source: 'Open Library'
      })
    }
  } catch (error) {
    console.error('Open Library API error:', error)
  }

  return NextResponse.json({ error: 'Book not found' }, { status: 404 })
}
