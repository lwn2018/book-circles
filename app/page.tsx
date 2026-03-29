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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 px-4 py-3 backdrop-blur-md" style={{ backgroundColor: 'rgba(18, 18, 18, 0.9)', borderBottom: '1px solid var(--border-muted)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold font-display" style={{ color: 'var(--foreground)' }}>
            PagePass
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="btn-primary text-sm px-4 py-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Hero */}
      <section className="px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--foreground)' }}>
            You lend books because you love them.
            <br />
            <span style={{ color: 'var(--primary)' }}>PagePass makes sure they find their way back.</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
            Share books with friends, track who has what, and let books pass directly between readers — no awkward "do you still have my copy?" texts required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/auth/signup" 
              className="btn-primary text-lg px-8 py-3 w-full sm:w-auto"
            >
              Get Started
            </Link>
            <a 
              href="#how-it-works" 
              className="flex items-center gap-2 text-base font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              See how it works <ChevronDownIcon />
            </a>
          </div>

          {/* App Store Buttons */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <a 
              href="#" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors hover:bg-white/10"
              style={{ 
                borderColor: 'var(--foreground-muted)', 
                color: 'var(--foreground)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-sm font-medium">Get iOS App</span>
            </a>
            <a 
              href="#" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors hover:bg-white/10"
              style={{ 
                borderColor: 'var(--foreground-muted)', 
                color: 'var(--foreground)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.55.69.55 1.19 0 .51-.21.93-.55 1.19l-2.63 1.52-2.5-2.5 2.5-2.5 2.63 1.1M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
              </svg>
              <span className="text-sm font-medium">Get Android App</span>
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
      <section className="px-4 py-16 md:py-24" style={{ backgroundColor: 'var(--background-card)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: 'var(--foreground)' }}>
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
                className="p-6 rounded-xl"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--background-card)', color: 'var(--primary)' }}>
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--foreground-muted)' }}>
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
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4" style={{ color: 'var(--foreground)' }}>
            Sharing books should be easy.
          </h2>
          <p className="text-center text-lg mb-12" style={{ color: 'var(--primary)' }}>
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
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                >
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    {item.title}
                  </h3>
                  <p className="text-base" style={{ color: 'var(--foreground-muted)' }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: The Pass-Along Differentiator */}
      <section className="px-4 py-16 md:py-24" style={{ backgroundColor: 'var(--background-card)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-6" style={{ color: 'var(--foreground)' }}>
            Your book. Their hands. Your peace of mind.
          </h2>
          <p className="text-center text-lg mb-12 max-w-2xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
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
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2"
                    style={{ 
                      backgroundColor: i === 0 || i === 3 ? 'var(--primary)' : 'var(--background)',
                      color: i === 0 || i === 3 ? 'var(--background)' : 'var(--foreground)',
                      border: i === 0 || i === 3 ? 'none' : '2px solid var(--border)'
                    }}
                  >
                    {person.label[0]}
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{person.label}</p>
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{person.sublabel}</p>
                </div>
                {i < 3 && (
                  <div style={{ color: 'var(--primary)' }}>
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
          <p className="text-sm uppercase tracking-wider mb-8" style={{ color: 'var(--primary)' }}>
            Built for book lovers, by a book lover.
          </p>
          <blockquote className="text-xl md:text-2xl font-display italic mb-8" style={{ color: 'var(--foreground)' }}>
            "PagePass started at a kitchen table when my wife returned a book she'd forgotten she'd borrowed — and I realized she had three books on her shelf she didn't know who they belonged to. I built this to fix that."
          </blockquote>
          <p className="font-medium" style={{ color: 'var(--foreground-muted)' }}>
            — Mathieu, founder
          </p>
        </div>
      </section>

      {/* SECTION 6: Features Grid */}
      <section className="px-4 py-16 md:py-24" style={{ backgroundColor: 'var(--background-card)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4" style={{ color: 'var(--foreground)' }}>
            Everything you need.
          </h2>
          <p className="text-center text-lg mb-12" style={{ color: 'var(--foreground-muted)' }}>
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
              <div key={i} className="flex gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex-shrink-0" style={{ color: 'var(--primary)' }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
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
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Your books are meant to be shared.
          </h2>
          <p className="text-lg md:text-xl mb-8" style={{ color: 'var(--foreground-muted)' }}>
            Start a circle. Add your books. See where they go.
          </p>
          <Link 
            href="/auth/signup" 
            className="btn-primary inline-block text-xl px-10 py-4"
          >
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8" style={{ backgroundColor: 'var(--background-card)', borderTop: '1px solid var(--border-muted)' }}>
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
          <div className="flex items-center justify-center gap-6">
            <a href="#" aria-label="Instagram" className="transition-colors hover:opacity-80" style={{ color: 'var(--foreground-muted)' }}>
              <InstagramIcon />
            </a>
            <a href="#" aria-label="TikTok" className="transition-colors hover:opacity-80" style={{ color: 'var(--foreground-muted)' }}>
              <TikTokIcon />
            </a>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            As an Amazon Associate, PagePass earns from qualifying purchases.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            © 2026 PagePass
          </p>
        </div>
      </footer>
    </div>
  )
}
