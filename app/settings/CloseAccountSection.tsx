'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CloseAccountSection() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [checkResult, setCheckResult] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCheckDeletion = async () => {
    setChecking(true)
    setError('')

    try {
      const response = await fetch('/api/account/check-deletion')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check account status')
      }

      setCheckResult(data)

      if (data.can_delete) {
        setShowConfirmation(true)
      } else {
        // Show blockers
        setError('Cannot close account yet')
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmText })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Success - redirect to homepage
      alert('Your account has been closed. Your data will be permanently deleted in 30 days.')
      router.push('/')

    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const renderBlockers = () => {
    if (!checkResult || checkResult.can_delete) return null

    const { active_borrows, blockers } = checkResult

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="font-semibold text-red-900 mb-2">
          ⚠️ Cannot close account - active obligations:
        </p>
        
        {blockers.has_active_borrows && active_borrows.borrowing.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-800 mb-1">
              Books you're currently borrowing ({active_borrows.borrowing.length}):
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {active_borrows.borrowing.map((book: any) => (
                <li key={book.id}>{book.title} {book.author ? `by ${book.author}` : ''}</li>
              ))}
            </ul>
            <p className="text-xs text-red-600 mt-1">
              Please return these books before closing your account.
            </p>
          </div>
        )}

        {blockers.has_lent_books && active_borrows.lent_out.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-800 mb-1">
              Your books currently lent out ({active_borrows.lent_out.length}):
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {active_borrows.lent_out.map((book: any) => (
                <li key={book.id}>
                  {book.title} {book.author ? `by ${book.author}` : ''} 
                  (with {book.current_borrower?.full_name || 'someone'})
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-600 mt-1">
              Please wait for these books to be returned before closing your account.
            </p>
          </div>
        )}

        {blockers.has_pending_handoffs && active_borrows.pending_handoffs.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-800 mb-1">
              Pending handoff confirmations ({active_borrows.pending_handoffs.length}):
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {active_borrows.pending_handoffs.map((handoff: any) => (
                <li key={handoff.id}>{handoff.book?.title || 'Book'}</li>
              ))}
            </ul>
            <p className="text-xs text-red-600 mt-1">
              Please complete or cancel these handoffs before closing your account.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-red-200">
      <h2 className="text-xl font-bold mb-4 text-red-900">Close Account</h2>
      
      {!showConfirmation ? (
        <>
          <p className="text-gray-600 mb-4">
            Permanently close your PagePass account. This action cannot be undone after 30 days.
          </p>

          {checkResult && renderBlockers()}

          {error && !checkResult && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckDeletion}
            disabled={checking}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Close Account'}
          </button>
        </>
      ) : (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="font-semibold text-yellow-900 mb-2">
              ⚠️ Are you sure you want to close your account?
            </p>
            <p className="text-sm text-yellow-800 mb-2">
              This will:
            </p>
            <ul className="text-sm text-yellow-700 list-disc list-inside mb-2">
              <li>Remove you from all circles</li>
              <li>Hide all your books from others</li>
              <li>Anonymize your name in borrow history</li>
              <li>Permanently delete all your data in 30 days</li>
            </ul>
            <p className="text-xs text-yellow-600">
              You will be signed out immediately. This cannot be undone after 30 days.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== 'DELETE'}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Closing Account...' : 'Close My Account'}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setConfirmText('')
                setError('')
              }}
              disabled={deleting}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
