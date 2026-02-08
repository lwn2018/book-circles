type AvatarProps = {
  name: string
  userId: string
  size?: 'sm' | 'lg'
}

// 10 muted jewel tones (warm and bookish)
const AVATAR_COLORS = [
  '#8B9D83', // Sage green
  '#C89F9C', // Dusty rose
  '#6B7C93', // Slate blue
  '#C07D5F', // Warm terracotta
  '#8B6F8F', // Muted plum
  '#6B9696', // Soft teal
  '#CCA15C', // Amber
  '#9B8FAB', // Dusty lavender
  '#A67B5B', // Warm clay
  '#5D8D8D', // Deep seafoam
]

// Hash string to number (simple djb2 algorithm)
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return Math.abs(hash)
}

// Get initials from name (e.g. "John Doe" -> "JD")
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Deterministically assign color based on user ID
function getAvatarColor(userId: string): string {
  const hash = hashString(userId)
  const colorIndex = hash % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

export default function Avatar({ name, userId, size = 'sm' }: AvatarProps) {
  const initials = getInitials(name)
  const backgroundColor = getAvatarColor(userId)
  
  const sizeClasses = size === 'lg' 
    ? 'w-12 h-12 text-lg' 
    : 'w-8 h-8 text-sm'
  
  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor }}
      title={name}
    >
      {initials}
    </div>
  )
}
