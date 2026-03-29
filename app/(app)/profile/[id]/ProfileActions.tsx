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
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <span>Report or block</span>
        <UserActionsMenu
          userId={profileId}
          userName={profileName}
          currentUserId={currentUserId}
          onBlockSuccess={() => router.push('/circles')}
          buttonClassName="bg-[#27272A] p-2 rounded-full hover:bg-zinc-600"
        />
      </div>
    </div>
  )
}