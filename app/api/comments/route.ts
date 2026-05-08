import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createAdminClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const resource_id = req.nextUrl.searchParams.get('resource_id')
  if (!resource_id) return NextResponse.json({ error: 'resource_id required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('resource_comments')
    .select('id, comment, author, location, created_at')
    .eq('resource_id', resource_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const { resource_id, comment, author, location } = await req.json()
    if (!resource_id) return NextResponse.json({ error: 'resource_id required' }, { status: 400 })
    if (!comment?.trim()) return NextResponse.json({ error: 'Comment text required' }, { status: 400 })
    if (!author?.trim()) return NextResponse.json({ error: 'Author name required' }, { status: 400 })
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('resource_comments')
      .insert({ resource_id, comment: comment.trim(), author: author.trim(), location: location?.trim() || null })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Comment added', data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { comment_id } = await req.json()
  if (!comment_id) return NextResponse.json({ error: 'comment_id required' }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase.from('resource_comments').delete().eq('id', comment_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}