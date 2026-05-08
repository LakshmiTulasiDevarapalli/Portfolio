import { createClient } from '@supabase/supabase-js'

// Lazy client - only created when called, not at module load time
export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

// Keep backward compat - but lazy
let _supabase: ReturnType<typeof createClient> | null = null
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (url && key) _supabase = createClient(url, key)
      else return () => ({ data: null, error: { message: 'Supabase not configured' } })
    }
    return (_supabase as any)[prop]
  }
})

export const createAdminClient = () => {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) throw new Error('Supabase admin env vars missing')
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