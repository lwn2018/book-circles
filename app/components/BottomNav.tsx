'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// SVG Icons as components
const CirclesIcon = ({ active }: { active: boolean }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={active ? '#55B2DE' : '#64748B'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="8" />
  </svg>
)

const LibraryIcon = ({ active }: { active: boolean }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={active ? '#55B2DE' : '#64748B'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const ShelfIcon = ({ active }: { active: boolean }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={active ? '#55B2DE' : '#64748B'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    {
      id: 'circles',
      label: 'Circles',
      icon: CirclesIcon,
      path: '/circles'
    },
    {
      id: 'library',
      label: 'Library',
      icon: LibraryIcon,
      path: '/library'
    },
    {
      id: 'shelf',
      label: 'Shelf',
      icon: ShelfIcon,
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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#334155] z-50 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const IconComponent = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center justify-center py-2 px-4 flex-1 min-w-0 transition-colors duration-200 ${
                active 
                  ? 'text-[#55B2DE]' 
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <div className={`mb-1 ${active ? 'transform scale-105' : ''}`}>
                <IconComponent active={active} />
              </div>
              <span className={`text-xs font-medium tracking-wide ${
                active ? 'text-[#55B2DE]' : 'text-[#64748B]'
              }`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
