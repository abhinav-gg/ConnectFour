
// Helper function to mask email
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  const masked = user[0] + '*'.repeat(7) + user.slice(-1)
  return `${masked}@${domain}`
}
