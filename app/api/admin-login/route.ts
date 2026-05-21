import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

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

    const response = NextResponse.json({ token, message: 'Login successful' })

    // Set httpOnly cookie so Navigation can detect admin session
    response.cookies.set('admin_session', token, {
      httpOnly: false,   // false so client-side JS in Navigation can read it
      secure: process.env.NODE_ENV === 'production',  // https only in prod
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,  // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}