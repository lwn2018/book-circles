import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support - PagePass',
  description: 'Get help with PagePass. FAQs, troubleshooting, and contact information.',
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img 
              src="/brand/pagepass-logo.svg" 
              alt="PagePass" 
              className="h-8 w-auto dark:hidden"
            />
            <img 
              src="/brand/pagepass-logo-white.svg" 
              alt="PagePass" 
              className="h-8 w-auto hidden dark:block"
            />
          </Link>
          <Link 
            href="/" 
            className="text-sm text-[#55B2DE] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Support</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Need help? We're here for you.</p>

        {/* Getting Started */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Getting Started</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I add books?</h3>
              <p className="text-gray-600 dark:text-gray-400">Tap "+ Add Book" at the top of your Library screen. You can search by title or author, scan a barcode, or import your Goodreads library using a CSV file.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I join a circle?</h3>
              <p className="text-gray-600 dark:text-gray-400">If someone invited you, tap the invite link they shared — it will add you to their circle automatically. You can also join a circle by entering an invite code on the Circles screen.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I create a circle?</h3>
              <p className="text-gray-600 dark:text-gray-400">On the Circles screen, tap "Create Circle." Give it a name, then share the invite link or code with the people you want to include.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I lend a book?</h3>
              <p className="text-gray-600 dark:text-gray-400">When someone in your circle requests to borrow a book, you'll receive a notification. Coordinate a time and place to meet, and both of you confirm the handoff in the app.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I import from Goodreads?</h3>
              <p className="text-gray-600 dark:text-gray-400">Go to your Goodreads account settings, export your library as a CSV file, then use the import option during onboarding or from your Library screen.</p>
            </div>
          </div>
        </section>

        {/* Account & Privacy */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Account & Privacy</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I reset my password?</h3>
              <p className="text-gray-600 dark:text-gray-400">On the sign-in screen, tap "Forgot password?" and enter your email. You'll receive a reset link.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">How do I delete my account?</h3>
              <p className="text-gray-600 dark:text-gray-400">Email us at <a href="mailto:privacy@pagepass.app" className="text-[#55B2DE] hover:underline">privacy@pagepass.app</a> and we'll process your deletion request within 30 days.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Who can see my books?</h3>
              <p className="text-gray-600 dark:text-gray-400">Only members of your circles can see the books in your library. Your books are never visible to people outside your circles.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Who can see my contact information?</h3>
              <p className="text-gray-600 dark:text-gray-400">Your phone number or email is only shared with the specific person involved in an active handoff. It's never displayed on your profile or visible to other members at any other time.</p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Troubleshooting</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">I'm not receiving email notifications.</h3>
              <p className="text-gray-600 dark:text-gray-400">Check your spam or junk folder — email from a new sender sometimes lands there. If you find PagePass emails in junk, mark them as "Not Spam" to fix it going forward. If you're still not receiving emails, contact us.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">A book I'm looking for isn't showing up in search.</h3>
              <p className="text-gray-600 dark:text-gray-400">Try searching by the author's name as well as the title. If the book still doesn't appear, you can search for it on Amazon using the "Buy on Amazon" link and add it to your library manually.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">I found a bug or something doesn't look right.</h3>
              <p className="text-gray-600 dark:text-gray-400">Use the feedback button in the app — we read every message. Or email us directly.</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Contact</h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong className="text-gray-900 dark:text-white">Email:</strong>{' '}
            <a href="mailto:support@pagepass.app" className="text-[#55B2DE] hover:underline">support@pagepass.app</a>
          </p>
          
          <p className="text-gray-600 dark:text-gray-400">
            We're a small team and we read everything. During beta, you can expect a response within 24 hours.
          </p>
        </section>

        {/* Affiliate Disclosure */}
        <section className="mb-10 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Affiliate Disclosure</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            PagePass participates in the Amazon Associates Program. When you tap a "Buy on Amazon" link in the app, PagePass may earn a small commission on qualifying purchases. This doesn't affect the price you pay.
          </p>
        </section>

        {/* Footer links */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-6 text-sm">
          <Link href="/privacy" className="text-[#55B2DE] hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-[#55B2DE] hover:underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  )
}
