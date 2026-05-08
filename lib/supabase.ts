import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Public client for frontend use
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// Singleton for convenience — created fresh each call to avoid stale closures
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  auth: {
    getSession: () => getSupabaseClient().auth.getSession(),
    signOut: () => getSupabaseClient().auth.signOut(),
  },
  storage: {
    from: (bucket: string) => getSupabaseClient().storage.from(bucket),
  },
}

// Admin client using service role key (server-side only)
export function createAdminClient(): SupabaseClient {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type Resource = {
  id: string
  title: string
  description: string | null
  synopsis: string | null
  synopsis_generated: boolean
  file_type: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'link'
  file_name: string | null
  file_size: number
  file_data?: string | null
  mime_type: string | null
  file_url: string | null
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  resource_ratings?: { rating: number }[]
  resource_comments?: { id: string; comment: string; author: string; created_at: string }[]
}

export type AccessRequest = {
  id: string
  resource_id: string
  requester_name: string
  requester_email: string
  requester_reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  download_token: string | null
  token_expires_at: string | null
  created_at: string
  updated_at: string
}

export type ResourceComment = {
  id: string
  resource_id: string
  comment: string
  author: string
  location?: string | null
  created_at: string
}

export const MIME_TYPES: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}