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

  // Portal needs to wait for client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

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
          onClose={() => setShowModal(false)}
        />,
        document.body
      )}
    </>
  )
}
