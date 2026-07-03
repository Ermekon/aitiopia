import 'server-only'

import { createHash, createHmac, timingSafeEqual } from 'crypto'

export const CURATE_COOKIE = 'curate_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

// Key material is derived from the password, so rotating CURATE_PASSWORD
// invalidates every outstanding session.
function signingKey(): Buffer {
  const password = process.env.CURATE_PASSWORD
  if (!password) throw new Error('CURATE_PASSWORD is not set in .env.local')
  return createHash('sha256').update(`aitiopia-curate:${password}`).digest()
}

// Session token = "<expiry-ms>.<hmac(expiry-ms)>". Unlike a bare password hash,
// it expires server-side: a leaked cookie value stops working after 30 days
// instead of remaining a permanent credential.
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const signature = createHmac('sha256', signingKey())
    .update(String(expiresAt))
    .digest('hex')
  return `${expiresAt}.${signature}`
}

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const expiresAt = Number(token.slice(0, dot))
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  const expected = createHmac('sha256', signingKey())
    .update(String(expiresAt))
    .digest()
  const actual = Buffer.from(token.slice(dot + 1), 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function passwordMatches(input: string): boolean {
  const expected = signingKey()
  const actual = createHash('sha256').update(`aitiopia-curate:${input}`).digest()
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function isConfigured(): boolean {
  return Boolean(process.env.CURATE_PASSWORD)
}
