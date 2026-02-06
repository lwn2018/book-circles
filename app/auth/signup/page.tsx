import { Suspense } from 'react'
import SignupForm from './SignupForm'

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
