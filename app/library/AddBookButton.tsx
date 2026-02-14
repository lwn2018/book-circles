'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import AddBookModal from '../components/AddBookModal'

type Circle = {
  id: string
  name: string
}

export default function AddBookButton({ userId, userCircles }: { userId: string, userCircles: Circle[] }) {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Portal needs to wait for client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClose = (success?: boolean, bookTitle?: string) => {
    setShowModal(false)
    if (success && bookTitle) {
      setToast(`📚 "${bookTitle}" added to your library!`)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        + Add Book
      </button>

      {showModal && mounted && createPortal(
        <AddBookModal 
          userId={userId}
          userCircles={userCircles}
          onClose={handleClose}
        />,
        document.body
      )}

      {/* Success toast */}
      {toast && mounted && createPortal(
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            {toast}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
