import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function generateToken(email: string): string {
  const payload = { email, exp: Date.now() + 24 * 60 * 60 * 1000 }
  const data    = Buffer.from(JSON.stringify(payload)).toString('base64')
  const secret  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-key'
  const sig     = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    const data    = token.substring(0, dotIndex)
    const sig     = token.substring(dotIndex + 1)
    const secret  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-key'
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(data, 'base64').toString())
    if (payload.exp < Date.now()) return null
    return { email: payload.email }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const adminEmail    = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured. Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local' },
        { status: 500 }
      )
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = generateToken(email)
    return NextResponse.json({ token, message: 'Login successful' })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
