import { getAvatarBySlug, AvatarSlug } from '@/lib/avatars'

type AvatarProps = {
  avatarType?: 'upload' | 'preset' | 'initials' | null
  avatarId?: string | null
  avatarUrl?: string | null
  avatarSlug?: AvatarSlug | string | null  // New: illustrated avatar slug
  userName: string
  userId: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showRing?: boolean
  ringColor?: string
}

export default function Avatar({
  avatarType,
  avatarId,
  avatarUrl,
  avatarSlug,
  userName,
  userId,
  size = 'md',
  className = '',
  showRing = false,
  ringColor = '#55B2DE'
}: AvatarProps) {
  // Size classes - matching design spec
  const sizeClasses: Record<string, { container: string, pixels: number }> = {
    xs: { container: 'w-6 h-6', pixels: 24 },
    sm: { container: 'w-10 h-10', pixels: 40 },     // 40px - nav/header
    md: { container: 'w-12 h-12', pixels: 48 },     // 48px - lists
    lg: { container: 'w-24 h-24', pixels: 96 },     // 96px - picker grid
    xl: { container: 'w-28 h-28', pixels: 112 }     // 112px - picker preview
  }

  const { container } = sizeClasses[size] || sizeClasses.md

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Get color for user (consistent hash-based color)
  const getUserColor = (id: string): string => {
    const colors = [
      '#8B9D83', '#C89F9C', '#6B7C93', '#C07D5F', '#8B6F8F',
      '#6B9696', '#CCA15C', '#9B8FAB', '#A67B5B', '#5D8D8D'
    ]
    let hash = 5381
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) + hash) + id.charCodeAt(i)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const ringStyles = showRing ? {
    boxShadow: `0 0 0 2.5px ${ringColor}, 0 0 12px rgba(85,178,222,0.28)`
  } : {}

  // NEW: Render illustrated avatar (butterfly/bee)
  if (avatarSlug) {
    const avatar = getAvatarBySlug(avatarSlug)
    return (
      <div 
        className={`${container} rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={ringStyles}
        dangerouslySetInnerHTML={{ __html: avatar.svg }}
        aria-label={`${avatar.name} ${avatar.description}`}
      />
    )
  }

  // LEGACY: Render preset emoji (for backwards compat during migration)
  if (avatarType === 'preset' && avatarId) {
    const PRESET_AVATARS = [
      { id: 'preset-1', emoji: '📚', color: 'bg-blue-100' },
      { id: 'preset-2', emoji: '🌟', color: 'bg-yellow-100' },
      { id: 'preset-3', emoji: '🎨', color: 'bg-purple-100' },
      { id: 'preset-4', emoji: '🌈', color: 'bg-pink-100' },
      { id: 'preset-5', emoji: '🚀', color: 'bg-indigo-100' },
      { id: 'preset-6', emoji: '🌻', color: 'bg-green-100' },
      { id: 'preset-7', emoji: '🎭', color: 'bg-red-100' },
      { id: 'preset-8', emoji: '⭐', color: 'bg-[#55B2DE]/20' }
    ]
    const preset = PRESET_AVATARS.find(p => p.id === avatarId)
    if (preset) {
      const emojiSizes: Record<string, string> = {
        xs: 'text-xs',
        sm: 'text-base',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-5xl'
      }
      return (
        <div 
          className={`${container} rounded-full ${preset.color} flex items-center justify-center flex-shrink-0 ${className}`}
          style={ringStyles}
        >
          <span className={emojiSizes[size] || 'text-2xl'}>{preset.emoji}</span>
        </div>
      )
    }
  }

  // Default: initials
  const initialsSizes: Record<string, string> = {
    xs: 'text-[10px]',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div
      className={`${container} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: getUserColor(userId), ...ringStyles }}
    >
      <span className={initialsSizes[size] || 'text-lg'}>{getInitials(userName)}</span>
    </div>
  )
}
