'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
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

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_ready': return '📚'
      case 'pass_reminder': return '⏰'
      case 'book_due': return '📅'
      case 'book_returned': return '↩️'
      case 'invite_accepted': return '🎉'
      case 'new_book': return '✨'
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
              className={`p-5 hover:bg-gray-50 transition cursor-pointer relative ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex gap-4">
                <span className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-base">{notification.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">{formatTime(notification.created_at)}</p>
                </div>
              </div>
              {!notification.read && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
