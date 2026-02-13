'use client'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: string
  gift_on_borrow?: boolean
  current_holder?: { full_name: string } | null
}

export default function LibraryListView({ books, userId }: { books: Book[]; userId: string }) {
  if (books.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {books.map((book) => (
        <div 
          key={book.id}
          className="flex items-center gap-3 p-3 border rounded-lg bg-white"
        >
          {/* Compact Cover */}
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={book.title}
              className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📚</span>
            </div>
          )}

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{book.title}</h3>
            {book.author && (
              <p className="text-xs text-gray-600 truncate">{book.author}</p>
            )}
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {book.gift_on_borrow && (
              <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded font-medium">
                🎁
              </span>
            )}
            {book.status === 'in_transit' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Passing
              </span>
            )}
            {book.status === 'borrowed' && book.current_holder && (
              <span className="text-xs text-gray-600">
                With {book.current_holder.full_name}
              </span>
            )}
            {book.status === 'available' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                On Shelf
              </span>
            )}
            {book.status === 'off_shelf' && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                Off Shelf
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
