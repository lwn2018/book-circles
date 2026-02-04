'use client'

import { useState } from 'react'
import AddBookModal from '../components/AddBookModal'

type Circle = {
  id: string
  name: string
}

export default function AddBookButton({ userId, userCircles }: { userId: string, userCircles: Circle[] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        + Add Book
      </button>

      {showModal && (
        <AddBookModal 
          userId={userId}
          userCircles={userCircles}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
