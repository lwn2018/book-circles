'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignupRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to signin page with signup tab active and preserve circleCode
    const circleCode = searchParams.get('circleCode')
    const invite = searchParams.get('invite')
    
    const params = new URLSearchParams()
    if (circleCode) params.set('circleCode', circleCode)
    if (invite) params.set('invite', invite)
    params.set('tab', 'signup') // Signal to open signup tab
    
    const url = `/auth/signin${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(url)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <SignupRedirect />
    </Suspense>
  )
}
