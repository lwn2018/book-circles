import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to PagePass
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> February 13, 2026
          </p>

          <div className="prose max-w-none space-y-6">
            <p className="text-gray-700">
              PagePass ("we," "us," or "our") operates the PagePass web application at pagepass.app. This Privacy Policy explains what information we collect, how we use it, and your choices.
            </p>
            <p className="text-gray-700">
              PagePass is operated from Ontario, Canada.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">What We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700"><strong>Account information:</strong> When you create an account, we collect your email address, your name, and optionally your phone number. Your phone number is only shared with other users during an active book handoff — it is never displayed on your profile or visible to other members at any other time.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Contact preferences:</strong> During onboarding, you may choose how other members contact you for book pickups (email, phone, or neither). This preference is only revealed during active handoffs.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Book data:</strong> When you add books to your library, we store book metadata (title, author, cover image, ISBN) retrieved from third-party book databases including Google Books and Open Library. If you import your Goodreads library, we process the CSV file you upload to match books with our database. We store the books you select for import.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Activity data:</strong> We record actions you take in the app, such as adding books, creating or joining circles, requesting borrows, confirming handoffs, and toggling book availability. This data powers features like your lending stats, circle activity, and badge awards.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Analytics data:</strong> We use PostHog, a product analytics service, to understand how people use PagePass. PostHog collects information such as pages visited, features used, device type, browser type, and general geographic region. This helps us improve the app. PostHog data is used in aggregate and is not sold to third parties. You can learn more about PostHog's data practices at posthog.com/privacy.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Affiliate click data:</strong> When you click a "Buy" link for a book, we record that the click occurred (which book, when) for our own analytics. The link takes you to Amazon.ca or another retailer. We do not receive any information about whether you complete a purchase or what else you buy.</p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">What We Do Not Collect</h2>
              <p className="text-gray-700">
                We do not collect or store payment information. PagePass does not currently process payments.
              </p>
              <p className="text-gray-700 mt-2">
                We do not collect precise location data. We do not access your camera, microphone, or contacts.
              </p>
              <p className="text-gray-700 mt-2">
                We do not use cookies for advertising or tracking across other websites.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="text-gray-700">
                We use your information to operate PagePass: to let you manage your book library, participate in lending circles, coordinate handoffs with other members, and display your lending activity and stats.
              </p>
              <p className="text-gray-700 mt-2">
                We use analytics data to understand how people use the app, identify bugs, and prioritize improvements.
              </p>
              <p className="text-gray-700 mt-2">
                We may use your email address to send you notifications related to your account activity (handoff confirmations, borrow reminders, queue updates). You can adjust notification preferences in your profile settings.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">How We Share Your Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700"><strong>With other PagePass members:</strong> Your name and chosen avatar are visible to members of your circles. Your contact preference (phone or email) is shared only with the specific person involved in an active handoff. Your book library is visible only to members of circles you belong to.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>With service providers:</strong> We use the following third-party services to operate PagePass:</p>
                  <ul className="list-disc ml-6 mt-2 text-gray-700">
                    <li>Supabase (database hosting and authentication)</li>
                    <li>Vercel (application hosting)</li>
                    <li>PostHog (product analytics)</li>
                    <li>Resend (transactional email delivery)</li>
                    <li>Google Books API and Open Library API (book metadata)</li>
                  </ul>
                  <p className="text-gray-700 mt-2">
                    These services process data on our behalf and are subject to their own privacy policies.
                  </p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>With affiliate partners:</strong> When you click an affiliate link (such as "Buy on Amazon"), you leave PagePass and are subject to that retailer's privacy policy. We participate in the Amazon Associates Program, which means we earn a small commission on qualifying purchases made through our links. We do not share your personal information with Amazon or any other affiliate partner.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>We do not sell your personal information.</strong> We do not share your individual reading or lending data with publishers, advertisers, or any third party.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Aggregated data:</strong> In the future, we may share aggregated, anonymized insights about lending trends (such as "the most-borrowed book in Toronto this month"). This data will never identify individual users.</p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
              <p className="text-gray-700">
                Your data is stored on servers operated by Supabase (database) and Vercel (application), both of which use industry-standard security measures including encryption in transit and at rest. We use Row Level Security policies in our database to ensure users can only access data they are authorized to see.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Your Choices and Rights</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700"><strong>Access and correction:</strong> You can view and update your profile information, contact preferences, and book library at any time within the app.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Account deletion:</strong> You can request deletion of your account and associated data by contacting us at privacy@pagepass.app. We will process deletion requests within 30 days.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Analytics opt-out:</strong> PostHog respects Do Not Track browser settings. If you enable Do Not Track in your browser, PostHog will not collect analytics data from your sessions.</p>
                </div>

                <div>
                  <p className="text-gray-700"><strong>Canadian privacy rights:</strong> If you are a resident of Canada, you have rights under the Personal Information Protection and Electronic Documents Act (PIPEDA) to access your personal information, request corrections, and withdraw consent for its use. To exercise these rights, contact us at privacy@pagepass.app.</p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-gray-700">
                PagePass is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us at privacy@pagepass.app and we will delete it.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. If we make significant changes, we will notify you through the app or by email. The "Last updated" date at the top reflects the most recent revision.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or your data, contact us at:
              </p>
              <p className="text-gray-700 mt-4">
                <strong>Email:</strong> privacy@pagepass.app<br />
                <strong>Location:</strong> Ontario, Canada
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
