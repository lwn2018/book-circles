const PRESET_AVATARS = [
  { id: 'preset-1', emoji: '📚', color: 'bg-blue-100' },
  { id: 'preset-2', emoji: '🌟', color: 'bg-yellow-100' },
  { id: 'preset-3', emoji: '🎨', color: 'bg-purple-100' },
  { id: 'preset-4', emoji: '🌈', color: 'bg-pink-100' },
  { id: 'preset-5', emoji: '🚀', color: 'bg-indigo-100' },
  { id: 'preset-6', emoji: '🌻', color: 'bg-green-100' },
  { id: 'preset-7', emoji: '🎭', color: 'bg-red-100' },
  { id: 'preset-8', emoji: '⭐', color: 'bg-orange-100' }
]

type AvatarProps = {
  avatarType?: 'upload' | 'preset' | 'initials' | null
  avatarId?: string | null
  avatarUrl?: string | null
  userName: string
  userId: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({
  avatarType,
  avatarId,
  avatarUrl,
  userName,
  userId,
  size = 'md',
  className = ''
}: AvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-32 h-32 text-4xl'
  }

  const emojiSizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-6xl'
  }

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

  // Render uploaded photo
  if (avatarType === 'upload' && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={userName}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  // Render preset emoji
  if (avatarType === 'preset' && avatarId) {
    const preset = PRESET_AVATARS.find(p => p.id === avatarId)
    if (preset) {
      return (
        <div className={`${sizeClasses[size]} rounded-full ${preset.color} flex items-center justify-center ${className}`}>
          <span className={emojiSizes[size]}>{preset.emoji}</span>
        </div>
      )
    }
  }

  // Default: initials
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor: getUserColor(userId) }}
    >
      {getInitials(userName)}
    </div>
  )
}
