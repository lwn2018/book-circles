import { Metadata } from 'next'
import BetaFeedbackButton from '../components/BetaFeedbackButton'

export const metadata: Metadata = {
  title: 'Roadmap | PagePass',
  description: 'See what\'s coming to PagePass',
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BetaFeedbackButton />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What's Next for PagePass</h1>
          <p className="text-lg text-gray-600">
            You're one of the first 18 people to use PagePass. That means your feedback is literally shaping what gets built next. Here's where we're headed.
          </p>
        </div>

        {/* Coming Soon */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span> Coming Soon
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-green-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Find us in the App Store</h3>
              <p className="text-gray-600 text-sm">No more "add to home screen." PagePass is coming to the App Store and Google Play so you can download it like any other app.</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Real push notifications</h3>
              <p className="text-gray-600 text-sm">Get notified instantly when someone borrows your book, when a handoff is ready, or when a book you're waiting for becomes available. No more checking the app to find out.</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Your badge collection</h3>
              <p className="text-gray-600 text-sm">You've already started earning badges (check your notifications). Soon you'll be able to see your full collection and choose which badge to show off next to your name.</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Dark mode</h3>
              <p className="text-gray-600 text-sm">For the late-night readers among us.</p>
            </div>
          </div>
        </section>

        {/* On the Horizon */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔭</span> On the Horizon
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-yellow-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Your sharing stats</h3>
              <p className="text-gray-600 text-sm">See how many books you've shared, how much value your circle has put into motion, and which book in your circle has traveled the farthest.</p>
            </div>
            <div className="bg-white rounded-lg border border-yellow-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Barcode scanner</h3>
              <p className="text-gray-600 text-sm">Add books to your library by scanning the barcode on the back cover. Point, scan, done.</p>
            </div>
            <div className="bg-white rounded-lg border border-yellow-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Sign in with Google or Apple</h3>
              <p className="text-gray-600 text-sm">Faster login for when you don't want to remember another password.</p>
            </div>
            <div className="bg-white rounded-lg border border-yellow-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Monthly recognition</h3>
              <p className="text-gray-600 text-sm">The most generous lender in each circle gets a little spotlight every month. Because sharing deserves celebrating.</p>
            </div>
          </div>
        </section>

        {/* Dreaming Big */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span> Dreaming Big
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-purple-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Your Year in Books</h3>
              <p className="text-gray-600 text-sm">An annual summary of your sharing year — how many books you lent, how many you borrowed, how far your books traveled, and the circles that made it happen. Think Spotify Wrapped, but for the books on your shelf.</p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Support local bookstores</h3>
              <p className="text-gray-600 text-sm">We'd love to help you buy from independent Canadian bookstores when you discover something you want to keep. We're exploring how to make that happen.</p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Cover Artist</h3>
              <p className="text-gray-600 text-sm">Spot a book with a missing cover? Submit one. Earn a badge. Help make PagePass more beautiful for everyone.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-600 mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <p>
            Something missing? Something you'd love to see?{' '}
            <span className="font-medium">Tap the feedback button</span> and tell us.
          </p>
          <p className="mt-2 text-gray-500">This is your app too.</p>
        </div>
      </div>
    </div>
  )
}
