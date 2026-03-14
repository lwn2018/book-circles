import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  
  // Check for auth code (PKCE flow)
  const code = params.code as string | undefined
  const type = params.type as string | undefined
  
  if (code) {
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)
    
    // If this is a password recovery, go to update-password
    if (type === 'recovery') {
      redirect('/auth/update-password')
    }
  }
  
  const { data: { session } } = await supabase.auth.getSession()

  // If logged in, go to circles
  if (session) {
    // Check if this might be a recovery session by looking at params
    if (type === 'recovery') {
      redirect('/auth/update-password')
    }
    redirect('/circles')
  }

  // If not logged in, go to signin
  redirect('/auth/signin')
}
