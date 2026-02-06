import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SignupAnalytics() {
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

  // Get signup source breakdown
  const { data: signupSources } = await supabase
    .from('profiles')
    .select('signup_source')

  const sourceBreakdown = signupSources?.reduce((acc: Record<string, number>, p) => {
    const source = p.signup_source || 'direct'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  // Get top referrers
  const { data: referrals } = await supabase
    .from('profiles')
    .select('invited_by')
    .not('invited_by', 'is', null)

  // Count referrals per user
  const referralCounts: Record<string, number> = {}
  referrals?.forEach((r) => {
    if (r.invited_by) {
      referralCounts[r.invited_by] = (referralCounts[r.invited_by] || 0) + 1
    }
  })

  // Get profile info for referrers
  const referrerIds = Object.keys(referralCounts)
  const { data: referrerProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', referrerIds)

  const referrerCounts = referrerProfiles?.reduce((acc: Record<string, any>, profile) => {
    acc[profile.id] = {
      name: profile.full_name || profile.email,
      count: referralCounts[profile.id] || 0
    }
    return acc
  }, {})

  const topReferrers = Object.values(referrerCounts || {})
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)

  // Get recent signups
  const { data: recentSignupsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, signup_source, invited_by')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get inviter details
  const inviterIds = recentSignupsRaw?.map(s => s.invited_by).filter(Boolean) || []
  const { data: inviters } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', inviterIds)

  const invitersMap = new Map(inviters?.map(i => [i.id, i]) || [])

  const recentSignups = recentSignupsRaw?.map(signup => ({
    ...signup,
    inviter: signup.invited_by ? invitersMap.get(signup.invited_by) : null
  }))

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Signup Analytics</h1>

        {/* Signup Sources */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Signup Sources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(sourceBreakdown || {}).map(([source, count]) => (
              <div key={source} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{source}</p>
                <p className="text-3xl font-bold">{count as number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Referrers</h2>
          {topReferrers.length > 0 ? (
            <div className="space-y-3">
              {topReferrers.map((referrer: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{referrer.name}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {referrer.count} {referrer.count === 1 ? 'signup' : 'signups'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No referrals yet</p>
          )}
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Signups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Invited By</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups?.map((signup, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{signup.full_name || '-'}</td>
                    <td className="py-2 text-gray-600">{signup.email}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                        {signup.signup_source || 'direct'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{signup.inviter?.full_name || '-'}</td>
                    <td className="py-2 text-gray-600">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
