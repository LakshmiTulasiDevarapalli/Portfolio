import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Test 1: Check which Supabase URL we're connecting to
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    // Test 2: Try a raw query to list all public tables
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables')
      .select('*')

    // Test 3: Try direct query on resources
    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('count')
      .limit(1)

    // Test 4: Try information_schema directly
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    return NextResponse.json({
      env: {
        supabaseUrl,
        hasServiceKey,
        nodeEnv: process.env.NODE_ENV,
      },
      resourcesTableTest: {
        data: resources,
        error: resourceError,
      },
      schemaTest: {
        data: schemaInfo,
        error: schemaError,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ fatalError: err.message }, { status: 500 })
  }
}