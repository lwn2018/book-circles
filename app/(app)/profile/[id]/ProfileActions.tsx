'use client'

import UserActionsMenu from '@/app/components/UserActionsMenu'
import { useRouter } from 'next/navigation'

type Props = {
  profileId: string
  profileName: string
  currentUserId: string
}

export default function ProfileActions({ profileId, profileName, currentUserId }: Props) {
  const router = useRouter()

  // Don't show for own profile
  if (profileId === currentUserId) {
    return null
  }

  return (
    <div className="flex justify-center mt-4">
      <UserActionsMenu
        userId={profileId}
        userName={profileName}
        currentUserId={currentUserId}
        onBlockSuccess={() => router.push('/circles')}
        buttonClassName="bg-[#1E293B] px-4 py-2 rounded-full text-zinc-300"
      />
    </div>
  )
}
