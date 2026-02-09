'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  message: string
  action_url: string | null
  book_id: string | null
  sender_id: string | null
  read: boolean
  created_at: string
  metadata?: {
    action_buttons?: Array<{
      label: string
      action: string
    }>
  }
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const url = filter === 'unread' 
        ? '/api/notifications?unreadOnly=true&limit=100'
        : '/api/notifications?limit=100'
      const response = await fetch(url)
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Don't navigate if it's a soft reminder (has action buttons)
    if (notification.type === 'soft_reminder') {
      return
    }

    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const handleStillReading = async (notification: Notification) => {
    try {
      const response = await fetch('/api/notifications/actions/still-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: notification.book_id,
          notification_id: notification.id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message) // "No rush — enjoy!"
        fetchNotifications()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to handle still reading:', error)
      alert('Failed to process action')
    }
  }

  const handleReadyToPagepass = (notification: Notification) => {
    // Navigate to My Shelf (borrowed books)
    markAsRead(notification.id)
    router.push('/dashboard/borrowed')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_ready': return '📚'
      case 'pass_reminder': return '⏰'
      case 'book_due': return '📅'
      case 'book_returned': return '↩️'
      case 'invite_accepted': return '🎉'
      case 'new_book': return '✨'
      case 'soft_reminder': return '📖'
      default: return '🔔'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && filter === 'all' && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p className="text-5xl mb-3">🔔</p>
          <p className="font-medium">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm mt-2">
            {filter === 'unread' 
              ? "You're all caught up!"
              : "You'll be notified when books are ready, due soon, and more."}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-5 pl-8 hover:bg-gray-50 transition cursor-pointer relative ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              {/* Unread indicator dot on left */}
              {!notification.read && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full" />
              )}
              
              <div className="flex gap-4">
                <span className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-base">{notification.message}</h3>
                    <button
                      onClick={(e) => markNotificationAsRead(notification.id, e)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{formatTime(notification.created_at)}</p>
                  
                  {/* Action Buttons for Soft Reminders */}
                  {notification.type === 'soft_reminder' && notification.metadata?.action_buttons && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStillReading(notification)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Still reading
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReadyToPagepass(notification)
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                      >
                        Ready to pagepass
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
