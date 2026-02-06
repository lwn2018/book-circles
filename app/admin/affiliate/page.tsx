import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AffiliateSettingsForm from './AffiliateSettingsForm'

export default async function AffiliateSettings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Get current affiliate settings
  const { data: bookshopSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'bookshop_affiliate_id')
    .single()

  const { data: amazonSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'amazon_associate_tag')
    .single()

  const { data: prioritySetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'affiliate_priority')
    .single()

  const bookshopId = bookshopSetting?.value as string || ''
  const amazonTag = amazonSetting?.value as string || ''
  const priority = prioritySetting?.value as string || 'bookshop'

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Affiliate Settings</h1>
          <p className="text-gray-600 mb-8">
            Configure your affiliate IDs to earn commission when users buy books through your links.
          </p>

          <AffiliateSettingsForm
            initialBookshopId={bookshopId}
            initialAmazonTag={amazonTag}
            initialPriority={priority}
          />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📚 How to Get Your Affiliate IDs</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong>Bookshop.org:</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Sign up at <a href="https://bookshop.org/pages/affiliates" target="_blank" className="underline">bookshop.org/pages/affiliates</a></li>
                  <li>Complete the affiliate application</li>
                  <li>Find your Shop Name in your affiliate dashboard</li>
                  <li>Enter it above (e.g., "your-shop-name")</li>
                </ol>
              </div>
              <div>
                <strong>Amazon Associates:</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Sign up at <a href="https://affiliate-program.amazon.com/" target="_blank" className="underline">affiliate-program.amazon.com</a></li>
                  <li>Complete the associate application</li>
                  <li>Get your Associate Tag from your dashboard</li>
                  <li>Enter it above (e.g., "yoursite-20")</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
            <ul className="list-disc ml-5 text-sm text-yellow-800 space-y-1">
              <li>Affiliate links only appear when Ads are enabled in Admin Dashboard</li>
              <li>Links are generated from book ISBNs when available</li>
              <li>All clicks are tracked in your analytics dashboard</li>
              <li>Bookshop.org generally pays higher commissions and supports indie bookstores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
