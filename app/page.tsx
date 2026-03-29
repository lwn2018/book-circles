import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PagePass - Share Books with Your Circle',
  description: 'Share books with friends, track who has what, and let books pass directly between readers. No more awkward "do you still have my copy?" texts.',
  keywords: ['book sharing', 'book lending', 'reading circles', 'book clubs', 'physical books', 'book exchange', 'lending library'],
  authors: [{ name: 'PagePass' }],
  openGraph: {
    title: 'PagePass - Share Books with Your Circle',
    description: 'Share books with friends, track who has what, and let books pass directly between readers.',
    url: 'https://pagepass.app',
    siteName: 'PagePass',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PagePass - Share Books with Your Circle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PagePass - Share Books with Your Circle',
    description: 'Share books with friends, track who has what, and let books pass directly between readers.',
    images: ['/og-image.png'],
  },
}

// Book spine SVG component for visual texture
function BookSpine({ color, width = 12 }: { color: string; width?: number }) {
  return (
    <div 
      className="h-16 rounded-sm opacity-60"
      style={{ 
        backgroundColor: color, 
        width: `${width}px`,
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)'
      }}
    />
  )
}

// Icon components
function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function QuestionIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function QueueIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

export default function LandingPage() {
  const bookSpineColors = [
    '#8B4513', '#2F4F4F', '#800020', '#1E3A5F', '#4A4A4A',
    '#5D3A1A', '#2C5545', '#6B2737', '#3D5A80', '#704214',
    '#1B4D3E', '#722F37', '#4A6274', '#8B7355'
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 px-4 py-3 backdrop-blur-md bg-white/90 dark:bg-[#121212]/90 border-b border-gray-200 dark:border-[#1E293B]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold font-display text-gray-900 dark:text-white">
            PagePass
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-[#55B2DE] hover:bg-[#4A9FCB] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Hero */}
      <section className="px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900 dark:text-white">
            You lend books because you love them.
            <br />
            <span className="text-[#55B2DE]">PagePass makes sure they find their way back.</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
            Share books with friends, track who has what, and let books pass directly between readers — no awkward "do you still have my copy?" texts required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/auth/signup" 
              className="bg-[#55B2DE] hover:bg-[#4A9FCB] text-white text-lg font-semibold px-8 py-3 rounded-lg transition-colors w-full sm:w-auto text-center"
            >
              Get Started
            </Link>
            <a 
              href="#how-it-works" 
              className="flex items-center gap-2 text-base font-medium transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              See how it works <ChevronDownIcon />
            </a>
          </div>
          
          {/* Book spines visual texture */}
          <div className="flex items-end justify-center gap-1 opacity-40 overflow-hidden">
            {bookSpineColors.map((color, i) => (
              <BookSpine key={i} color={color} width={8 + Math.random() * 8} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: The Problem */}
      <section className="px-4 py-16 md:py-24 bg-white dark:bg-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Sound familiar?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: '"Whose book is this?"',
                description: 'You find a book on your shelf and have no idea who lent it to you.',
                icon: <QuestionIcon />
              },
              {
                title: '"I forgot I lent that out"',
                description: "A friend returns a book you didn't even know was missing.",
                icon: <BookIcon />
              },
              {
                title: '"Can I borrow that when you\'re done?"',
                description: 'Three friends want the same book. You become the bottleneck.',
                icon: <UsersIcon />
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#334155]"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-white dark:bg-[#1E293B] text-[#55B2DE]">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: How It Works */}
      <section id="how-it-works" className="px-4 py-16 md:py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Sharing books should be easy.
          </h2>
          <p className="text-center text-lg mb-12 text-[#55B2DE]">
            Now it is.
          </p>
          <div className="space-y-8 md:space-y-12">
            {[
              {
                step: 1,
                title: 'Create a circle',
                description: 'A circle is a group of friends who share books. Your book club. Your neighbours. Your family. Invite them with a link.',
                icon: <UsersIcon />
              },
              {
                step: 2,
                title: 'Add your books',
                description: 'Scan a barcode, search by title, or import your whole library from Goodreads. Choose which circles can see each book.',
                icon: <ScanIcon />
              },
              {
                step: 3,
                title: 'Books pass between friends',
                description: "Friends browse and borrow. When the next person is ready, the book passes straight to them — no need to come back to you first. You always know where your books are.",
                icon: <RefreshIcon />
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div 
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold bg-[#55B2DE] text-white"
                >
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-display text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: The Pass-Along Differentiator */}
      <section className="px-4 py-16 md:py-24 bg-white dark:bg-[#1E293B]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Your book. Their hands. Your peace of mind.
          </h2>
          <p className="text-center text-lg mb-12 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
            Most book-sharing is a two-way street: you lend it out, it comes back, you lend it again. PagePass turns it into a circle. Your book can pass from reader to reader without returning to your shelf each time. You stay in the loop at every step — you see who has it, who's next, and when it's coming home.
          </p>
          
          {/* Pass-along diagram */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {[
              { label: 'You', sublabel: 'Owner' },
              { label: 'Sarah', sublabel: 'Reading' },
              { label: 'Mike', sublabel: 'Next up' },
              { label: 'You', sublabel: 'Returns' }
            ].map((person, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-6">
                <div className="text-center">
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${
                      i === 0 || i === 3 
                        ? 'bg-[#55B2DE] text-white' 
                        : 'bg-gray-100 dark:bg-[#121212] text-gray-900 dark:text-white border-2 border-gray-300 dark:border-[#334155]'
                    }`}
                  >
                    {person.label[0]}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{person.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{person.sublabel}</p>
                </div>
                {i < 3 && (
                  <div className="text-[#55B2DE]">
                    <ArrowRightIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Social Proof / Founder Story */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wider mb-8 text-[#55B2DE]">
            Built for book lovers, by a book lover.
          </p>
          <blockquote className="text-xl md:text-2xl font-display italic mb-8 text-gray-900 dark:text-white">
            "PagePass started at a kitchen table when my wife returned a book she'd forgotten she'd borrowed — and I realized she had three books on her shelf she didn't know who they belonged to. I built this to fix that."
          </blockquote>
          <p className="font-medium text-gray-600 dark:text-gray-400">
            — Mathieu, founder
          </p>
        </div>
      </section>

      {/* SECTION 6: Features Grid */}
      <section className="px-4 py-16 md:py-24 bg-white dark:bg-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Everything you need.
          </h2>
          <p className="text-center text-lg mb-12 text-gray-600 dark:text-gray-400">
            Nothing you don't.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <ScanIcon />,
                title: 'Scan to add',
                description: 'Point your camera at a barcode. Done.'
              },
              {
                icon: <ImportIcon />,
                title: 'Import from Goodreads',
                description: 'Bring your whole library in one step.'
              },
              {
                icon: <QueueIcon />,
                title: 'Borrow queue',
                description: "See who's next. No more group texts."
              },
              {
                icon: <RefreshIcon />,
                title: 'Pass-along',
                description: 'Books move between friends without coming back to you.'
              },
              {
                icon: <CircleIcon />,
                title: 'Multiple circles',
                description: 'Book club. Neighbours. Family. Keep them separate.'
              },
              {
                icon: <MapPinIcon />,
                title: 'Always know where your books are',
                description: "That's the whole point."
              }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[#121212]">
                <div className="flex-shrink-0 text-[#55B2DE]">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Final CTA */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Your books are meant to be shared.
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-400">
            Start a circle. Add your books. See where they go.
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-block bg-[#55B2DE] hover:bg-[#4A9FCB] text-white text-xl font-semibold px-10 py-4 rounded-lg transition-colors"
          >
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-[#1E293B]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
          <div className="flex items-center justify-center gap-6">
            <a href="#" aria-label="Instagram" className="transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <InstagramIcon />
            </a>
            <a href="#" aria-label="TikTok" className="transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <TikTokIcon />
            </a>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            As an Amazon Associate, PagePass earns from qualifying purchases.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2026 PagePass
          </p>
        </div>
      </footer>
    </div>
  )
}
