import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Roadmap | PagePass',
  description: 'See what\'s coming to PagePass',
}

// Simple static roadmap data - edit this directly to update
const roadmapData = {
  comingSoon: [
    {
      title: 'Book Recommendations',
      description: 'Get personalized suggestions based on what your circle is reading.',
    },
    {
      title: 'Reading Stats',
      description: 'Track how many books you\'ve lent, borrowed, and shared over time.',
    },
  ],
  exploring: [
    {
      title: 'Wishlist Sharing',
      description: 'Let circle members know what books you\'d love to borrow.',
    },
    {
      title: 'Reading Challenges',
      description: 'Set goals with your circle and track progress together.',
    },
  ],
  shipped: [
    {
      title: 'Goodreads Import',
      description: 'Import your existing library from Goodreads with one click.',
      date: 'Feb 2026',
    },
    {
      title: 'Two-Way Handoff Confirmation',
      description: 'Both parties confirm when a book changes hands.',
      date: 'Feb 2026',
    },
    {
      title: 'Circle Invites',
      description: 'Invite friends with a simple link.',
      date: 'Feb 2026',
    },
  ],
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Roadmap</h1>
          <p className="text-lg text-gray-600">
            Here's what we're building. Have ideas?{' '}
            <span className="text-gray-500">Use the feedback button in the app.</span>
          </p>
        </div>

        {/* Coming Soon */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span> Coming Soon
          </h2>
          <div className="space-y-4">
            {roadmapData.comingSoon.map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-green-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exploring */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔍</span> Exploring
          </h2>
          <div className="space-y-4">
            {roadmapData.exploring.map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-yellow-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shipped */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span> Shipped
          </h2>
          <div className="space-y-4">
            {roadmapData.shipped.map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.date && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {item.date}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Last updated: February 2026</p>
        </div>
      </div>
    </div>
  )
}
