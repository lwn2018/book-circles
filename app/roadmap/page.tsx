import { Metadata } from 'next'
import Link from 'next/link'
import BetaFeedbackButton from '../components/BetaFeedbackButton'

export const metadata: Metadata = {
  title: 'Roadmap | PagePass',
  description: 'See what\'s coming to PagePass',
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      <BetaFeedbackButton />
      
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-40 bg-[#121212] border-b border-[#334155] px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <Link 
          href="/circles" 
          className="flex items-center gap-2 text-[#55B2DE] hover:text-[#4A9FCB] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </Link>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-4">What's Next for PagePass</h1>
          <p className="text-[#94A3B8]">
            You're one of the first 18 people to use PagePass. That means your feedback is literally shaping what gets built next. Here's where we're headed.
          </p>
        </div>

        {/* Coming Soon */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🚀</span> Coming Soon
          </h2>
          <div className="space-y-3">
            <div className="bg-[#1E293B] rounded-xl border border-green-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Find us in the App Store</h3>
              <p className="text-[#94A3B8] text-sm">No more "add to home screen." PagePass is coming to the App Store and Google Play so you can download it like any other app.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-green-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Real push notifications</h3>
              <p className="text-[#94A3B8] text-sm">Get notified instantly when someone borrows your book, when a handoff is ready, or when a book you're waiting for becomes available.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-green-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Your badge collection</h3>
              <p className="text-[#94A3B8] text-sm">You've already started earning badges. Soon you'll be able to see your full collection and choose which badge to show off.</p>
            </div>
          </div>
        </section>

        {/* On the Horizon */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🔭</span> On the Horizon
          </h2>
          <div className="space-y-3">
            <div className="bg-[#1E293B] rounded-xl border border-amber-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Your sharing stats</h3>
              <p className="text-[#94A3B8] text-sm">See how many books you've shared and which book in your circle has traveled the farthest.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-amber-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Barcode scanner</h3>
              <p className="text-[#94A3B8] text-sm">Add books to your library by scanning the barcode on the back cover. Point, scan, done.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-amber-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Sign in with Google or Apple</h3>
              <p className="text-[#94A3B8] text-sm">Faster login for when you don't want to remember another password.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-amber-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Monthly recognition</h3>
              <p className="text-[#94A3B8] text-sm">The most generous lender in each circle gets a little spotlight every month.</p>
            </div>
          </div>
        </section>

        {/* Dreaming Big */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">✨</span> Dreaming Big
          </h2>
          <div className="space-y-3">
            <div className="bg-[#1E293B] rounded-xl border border-purple-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Your Year in Books</h3>
              <p className="text-[#94A3B8] text-sm">An annual summary of your sharing year — like Spotify Wrapped, but for books.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-purple-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Support local bookstores</h3>
              <p className="text-[#94A3B8] text-sm">Buy from independent Canadian bookstores when you discover something you want to keep.</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl border border-purple-800/50 p-4">
              <h3 className="font-semibold text-white mb-1">Cover Artist</h3>
              <p className="text-[#94A3B8] text-sm">Spot a book with a missing cover? Submit one. Earn a badge. Help make PagePass beautiful.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-[#94A3B8] p-6 bg-[#1E293B] rounded-xl border border-[#334155]">
          <p>
            Something missing?{' '}
            <span className="font-medium text-white">Tap the feedback button</span> and tell us.
          </p>
          <p className="mt-2 text-[#64748B]">This is your app too.</p>
        </div>
      </div>
    </div>
  )
}
