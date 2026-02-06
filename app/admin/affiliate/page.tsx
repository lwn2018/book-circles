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
  const { data: indigoSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'indigo_affiliate_id')
    .single()

  const { data: amazonSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'amazon_associate_tag')
    .single()

  const { data: amazonCaSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'amazon_ca_associate_tag')
    .single()

  const { data: prioritySetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'affiliate_priority')
    .single()

  const indigoId = indigoSetting?.value as string || ''
  const amazonTag = amazonSetting?.value as string || ''
  const amazonCaTag = amazonCaSetting?.value as string || ''
  const priority = prioritySetting?.value as string || 'indigo'

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
            initialIndigoId={indigoId}
            initialAmazonTag={amazonTag}
            initialAmazonCaTag={amazonCaTag}
            initialPriority={priority}
          />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📚 How to Get Your Affiliate IDs</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong>Indigo/Chapters (Canada):</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Sign up at <a href="https://www.chapters.indigo.ca/en-ca/affiliate-program/" target="_blank" className="underline">Indigo Affiliate Program</a></li>
                  <li>Complete the affiliate application</li>
                  <li>Get your Affiliate ID from your dashboard</li>
                  <li>Enter it above (typically a numeric ID)</li>
                </ol>
              </div>
              <div>
                <strong>Amazon.ca Associates (Canada):</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Sign up at <a href="https://associates.amazon.ca/" target="_blank" className="underline">associates.amazon.ca</a></li>
                  <li>Complete the associate application</li>
                  <li>Get your .ca Associate Tag from your dashboard</li>
                  <li>Enter it above (e.g., "yoursite-20")</li>
                </ol>
              </div>
              <div>
                <strong>Amazon.com Associates (US/International):</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Sign up at <a href="https://affiliate-program.amazon.com/" target="_blank" className="underline">affiliate-program.amazon.com</a></li>
                  <li>Complete the associate application</li>
                  <li>Get your .com Associate Tag from your dashboard</li>
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
              <li>Indigo supports Canadian bookstores and typically has competitive commissions</li>
              <li>You can configure multiple services - users will see your priority first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
