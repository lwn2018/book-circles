import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">📚 Book Circles</h1>
        <p className="text-gray-600 mb-8">
          Share books with your friends and family. Create reading circles, track borrowed books, and build your community library.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
