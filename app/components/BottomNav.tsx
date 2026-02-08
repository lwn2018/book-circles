'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    {
      id: 'circles',
      label: 'Circles',
      icon: '🏘️',
      path: '/circles'
    },
    {
      id: 'handoffs',
      label: 'Handoffs',
      icon: '🤝',
      path: '/handoffs'
    },
    {
      id: 'library',
      label: 'Library',
      icon: '📚',
      path: '/library'
    },
    {
      id: 'shelf',
      label: 'Shelf',
      icon: '📖',
      path: '/shelf'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/circles') {
      return pathname === '/circles' || pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto flex justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center py-3 px-6 flex-1 transition ${
                active 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
