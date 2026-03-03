/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return crypto.randomUUID().split('-')[0]
}
