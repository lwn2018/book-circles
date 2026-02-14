/**
 * Format a phone number to (XXX) XXX-XXXX format
 * Handles 10-digit North American numbers
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10)
  
  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return limited
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Convert formatted phone number to E.164 format for links
 * (416) 555-5555 → +14165555555
 */
export function phoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `+1${digits}`
}

/**
 * Create an SMS link from a phone number
 */
export function phoneToSmsLink(phone: string): string {
  return `sms:${phoneToE164(phone)}`
}
