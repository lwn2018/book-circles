'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TabbedAuthForm from './TabbedAuthForm'

function SignInContent() {
  const [circleName, setCircleName] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const circleCode = searchParams.get('circleCode')
  const tab = searchParams.get('tab') as 'signin' | 'signup' | null
  const supabase = createClient()

  // Look up circle name if circleCode is present
  useEffect(() => {
    if (circleCode) {
      const fetchCircleName = async () => {
        const { data } = await supabase
          .from('circles')
          .select('name')
          .eq('invite_code', circleCode.toUpperCase())
          .maybeSingle()
        
        if (data) {
          setCircleName(data.name)
        }
      }
      fetchCircleName()
    }
  }, [circleCode, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl p-8" style={{ backgroundColor: '#27272A' }}>
        <TabbedAuthForm 
          circleCode={circleCode} 
          circleName={circleName}
          initialTab={tab || 'signin'}
        />
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121212' }}>
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
