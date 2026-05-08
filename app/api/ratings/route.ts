import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const resource_id = req.nextUrl.searchParams.get('resource_id')
  if (!resource_id) return NextResponse.json({ error: 'resource_id required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('resource_ratings')
    .select('id, rating, reviewer_name, reviewer_location, created_at')
    .eq('resource_id', resource_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ratings   = data || []
  const count     = ratings.length
  const average   = count > 0 ? Math.round((ratings.reduce((s: number, r: any) => s + r.rating, 0) / count) * 10) / 10 : 0
  const breakdown = [5, 4, 3, 2, 1].map(star => ({ star, count: ratings.filter((r: any) => r.rating === star).length }))
  return NextResponse.json({ ratings, average, count, breakdown })
}

export async function POST(req: NextRequest) {
  try {
    const { resource_id, rating, reviewer_name, reviewer_email, reviewer_location } = await req.json()
    if (!resource_id) return NextResponse.json({ error: 'resource_id required' }, { status: 400 })
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    if (!reviewer_name?.trim()) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    const supabase = createAdminClient()
    // Update if same email already rated
    if (reviewer_email?.trim()) {
      const { data: existing } = await supabase
        .from('resource_ratings').select('id').eq('resource_id', resource_id)
        .eq('reviewer_email', reviewer_email.trim().toLowerCase()).maybeSingle()
      if (existing) {
        const { data, error } = await supabase
          .from('resource_ratings')
          .update({ rating, reviewer_name: reviewer_name.trim(), reviewer_location: reviewer_location?.trim() || '' })
          .eq('id', existing.id).select().single()
        if (error) throw error
        return NextResponse.json({ message: 'Rating updated', data })
      }
    }
    const { data, error } = await supabase
      .from('resource_ratings')
      .insert({ resource_id, rating, reviewer_name: reviewer_name.trim(), reviewer_email: reviewer_email?.trim().toLowerCase() || '', reviewer_location: reviewer_location?.trim() || '' })
      .select().single()
    if (error) throw error
    return NextResponse.json({ message: 'Rating saved', data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}