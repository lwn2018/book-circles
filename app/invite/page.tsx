'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function InvitePage() {
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    setInvites(data || [])
    setLoading(false)
  }

  const generateInvite = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/invite/generate', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.invite) {
        await fetchInvites()
      }
    } catch (error) {
      console.error('Failed to generate invite:', error)
      alert('Failed to generate invite')
    } finally {
      setGenerating(false)
    }
  }

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/auth/signup?invite=${code}`
    navigator.clipboard.writeText(url)
    alert('Invite link copied to clipboard!')
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Invite Friends</h1>
          <p className="text-gray-600 mb-6">
            Share PagePass with friends and family. Each invite link is unique to you.
          </p>

          <button
            onClick={generateInvite}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium mb-8"
          >
            {generating ? 'Generating...' : '✨ Generate New Invite Link'}
          </button>

          {/* Invite Links List */}
          {loading ? (
            <p className="text-gray-500">Loading your invites...</p>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-2">No invite links yet</p>
              <p className="text-sm text-gray-400">Click the button above to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-3">Your Invite Links</h2>
              {invites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-lg font-bold text-blue-600">{invite.code}</p>
                      <p className="text-xs text-gray-500">
                        Created {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => copyInviteLink(invite.code)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                    >
                      📋 Copy Link
                    </button>
                  </div>
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono break-all text-gray-600">
                    {window.location.origin}/auth/signup?invite={invite.code}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
            <ul className="list-disc ml-5 text-sm text-blue-800 space-y-1">
              <li>Each link is unique and tracks back to you</li>
              <li>Links never expire and have unlimited uses</li>
              <li>Anyone who signs up with your link becomes your referral</li>
              <li>You'll be able to see who you invited in the future</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
