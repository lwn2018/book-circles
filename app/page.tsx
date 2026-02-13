import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If logged in, go to circles
  if (session) {
    redirect('/circles')
  }

  // If not logged in, go to signin
  redirect('/auth/signin')
}
