import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to PagePass
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> February 13, 2026
          </p>

          <div className="prose max-w-none space-y-6">
            <p className="text-gray-700">
              Welcome to PagePass. By creating an account or using the PagePass web application at pagepass.app ("the Service"), you agree to these Terms of Service ("Terms"). If you do not agree, please do not use the Service.
            </p>
            <p className="text-gray-700">
              PagePass is operated from Ontario, Canada.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">What PagePass Is</h2>
              <p className="text-gray-700">
                PagePass is a web application that helps friends share physical books within trusted circles. You can catalog your books, create or join lending circles, request to borrow books from other members, and coordinate physical handoffs.
              </p>
              <p className="text-gray-700 mt-2">
                PagePass facilitates coordination between people who already know and trust each other. We do not verify the identity of users, guarantee the condition of books, or mediate disputes between members.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Your Account</h2>
              <p className="text-gray-700">
                You must provide a valid email address to create an account. You are responsible for keeping your account credentials secure. You must be at least 13 years old to use PagePass.
              </p>
              <p className="text-gray-700 mt-2">
                You agree to provide accurate information when creating your account and to keep your profile information current.
              </p>
              <p className="text-gray-700 mt-2">
                We may suspend or terminate your account if you violate these Terms or if your account is inactive for an extended period.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Your Content</h2>
              <p className="text-gray-700">
                When you add books to your library, write descriptions, or provide other content through the Service, you retain ownership of that content. By posting content on PagePass, you grant us a non-exclusive, royalty-free license to display and distribute that content within the Service (for example, showing your book listing to members of your circles).
              </p>
              <p className="text-gray-700 mt-2">
                You agree not to post content that is unlawful, harassing, defamatory, or infringes on the rights of others.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Book Lending</h2>
              <p className="text-gray-700">
                PagePass is a coordination tool. The actual lending of physical books is a private arrangement between you and other members. PagePass is not a party to any lending transaction.
              </p>
              <p className="text-gray-700 mt-2">
                <strong>You are responsible for your own books.</strong> PagePass does not guarantee that borrowed books will be returned, returned in good condition, or returned on time. By lending a book through PagePass, you accept the risk that it may be lost or damaged.
              </p>
              <p className="text-gray-700 mt-2">
                <strong>You are responsible for returning borrowed books.</strong> When you borrow a book through PagePass, you agree to return it in the condition you received it, within a reasonable time.
              </p>
              <p className="text-gray-700 mt-2">
                PagePass provides reminder notifications as a courtesy. These reminders do not create any legal obligation or liability on our part.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Affiliate Links</h2>
              <p className="text-gray-700">
                PagePass includes links to third-party retailers such as Amazon.ca. These are affiliate links, which means PagePass may earn a small commission if you make a qualifying purchase after clicking the link. As an Amazon Associate, PagePass earns from qualifying purchases.
              </p>
              <p className="text-gray-700 mt-2">
                Clicking an affiliate link takes you to a third-party website that is not operated by PagePass. Your use of that website is subject to its own terms and privacy policy. We do not control and are not responsible for third-party websites.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Gift Transfers</h2>
              <p className="text-gray-700">
                When a book owner marks a book as "yours to keep" and a handoff is confirmed, ownership of the physical book transfers from the original owner to the recipient. This is a voluntary gift between two individuals. PagePass records the transfer in the app but is not responsible for the terms, conditions, or any disputes arising from gift transfers.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="text-gray-700 mb-2">You agree not to:</p>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Use PagePass for any unlawful purpose</li>
                <li>Attempt to access another user's account without authorization</li>
                <li>Scrape, crawl, or use automated tools to extract data from PagePass</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Impersonate another person or misrepresent your identity</li>
                <li>Use PagePass to send unsolicited messages or spam to other members</li>
                <li>Circumvent any security features of the Service</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="text-gray-700">
                The PagePass name, logo, and application design are the property of PagePass and its operators. You may not use our branding without written permission.
              </p>
              <p className="text-gray-700 mt-2">
                Book cover images and metadata displayed in PagePass are sourced from third-party databases (Google Books, Open Library) and remain the property of their respective owners.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p className="text-gray-700">
                PagePass is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
              </p>
              <p className="text-gray-700 mt-2">
                We do not warrant the accuracy or completeness of book metadata, cover images, or pricing information displayed in the Service. This information is sourced from third-party databases and may contain errors.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-gray-700">
                To the fullest extent permitted by applicable law, PagePass and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of or damage to physical books, loss of data, or loss of profits.
              </p>
              <p className="text-gray-700 mt-2">
                Our total liability to you for any claim arising from your use of the Service shall not exceed the amount you paid to PagePass in the twelve months preceding the claim, or $50 CAD, whichever is greater.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Beta Program</h2>
              <p className="text-gray-700">
                PagePass is currently in beta. During the beta period, features may change, be added, or be removed without notice. Data collected during beta may be reset. We appreciate your patience and feedback as we improve the Service.
              </p>
              <p className="text-gray-700 mt-2">
                By participating in the beta program, you acknowledge that the Service is still under development and may contain bugs or incomplete features.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to These Terms</h2>
              <p className="text-gray-700">
                We may update these Terms from time to time. If we make significant changes, we will notify you through the app or by email. Your continued use of PagePass after changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="text-gray-700">
                These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about these Terms, contact us at:
              </p>
              <p className="text-gray-700 mt-4">
                <strong>Email:</strong> support@pagepass.app<br />
                <strong>Location:</strong> Ontario, Canada
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
