'use client'

export default function ProgressBar({ 
  currentStep, 
  totalSteps = 4 
}: { 
  currentStep: number
  totalSteps?: number
}) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-colors ${
              index < currentStep
                ? 'bg-blue-600'
                : index === currentStep
                ? 'bg-blue-400'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-center text-sm text-gray-600 mt-2">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  )
}
