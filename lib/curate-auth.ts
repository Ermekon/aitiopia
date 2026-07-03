import 'server-only'

import { createHash, timingSafeEqual } from 'crypto'

export const CURATE_COOKIE = 'curate_session'

// The session cookie stores a hash derived from the password, not the
// password itself. Rotating CURATE_PASSWORD invalidates every session.
export function sessionToken(): string {
  const password = process.env.CURATE_PASSWORD
  if (!password) throw new Error('CURATE_PASSWORD is not set in .env.local')
  return createHash('sha256').update(`aitiopia-curate:${password}`).digest('hex')
}

export function passwordMatches(input: string): boolean {
  const expected = Buffer.from(sessionToken())
  const actual   = Buffer.from(
    createHash('sha256').update(`aitiopia-curate:${input}`).digest('hex')
  )
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function isConfigured(): boolean {
  return Boolean(process.env.CURATE_PASSWORD)
}
