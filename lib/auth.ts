import crypto from 'crypto'

// Use ADMIN_PASSWORD as signing secret — stable and always available
function getSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-key-portfolio'
}

export function generateToken(email: string): string {
  const payload = { email, exp: Date.now() + 24 * 60 * 60 * 1000 }
  const data    = Buffer.from(JSON.stringify(payload)).toString('base64')
  const sig     = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    const data     = token.substring(0, dotIndex)
    const sig      = token.substring(dotIndex + 1)
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
    if (sig !== expected) return null
    const payload  = JSON.parse(Buffer.from(data, 'base64').toString())
    if (payload.exp < Date.now()) return null
    return { email: payload.email }
  } catch {
    return null
  }
}