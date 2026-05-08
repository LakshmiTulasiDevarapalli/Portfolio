import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Log env vars to debug (remove after fixing)
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      error: 'Supabase environment variables missing. Check .env.local file.',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }, { status: 500 })
  }

  try {
    const supabase = createAdminClient()

    const { data: requests, error } = await supabase
      .from('access_requests')
      .select('*, resources(id, title, file_type)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching requests:', JSON.stringify(error))
      return NextResponse.json({ 
        error: 'Failed to fetch requests', 
        details: error.message,
        code: error.code,
        hint: (error as any).hint
      }, { status: 500 })
    }

    return NextResponse.json({ requests }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    })
  } catch (err: any) {
    console.error('Fatal error in admin-requests:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}