'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase, Resource, ResourceFile } from '@/lib/supabase'
import {
  FileText, FileSpreadsheet, File, Link2, Code2, Search, Filter,
  Download, Eye, Loader2, X, Send, CheckCircle, Star,
  MessageSquare, Lock, Calendar, ChevronRight, Sparkles,
  RefreshCw, ArrowUpDown, ThumbsUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const FILE_ICONS: Record<string, { color: string; bg: string; label: string; Icon: any }> = {
  pdf:  { color: '#E85C5C', bg: 'rgba(232,92,92,0.1)',   label: 'PDF',        Icon: FileText },
  docx: { color: '#5C8CE8', bg: 'rgba(92,140,232,0.1)',  label: 'Word',       Icon: File },
  xlsx: { color: '#5CC87B', bg: 'rgba(92,200,123,0.1)',  label: 'Excel',      Icon: FileSpreadsheet },
  pptx: { color: '#C8955C', bg: 'rgba(200,149,92,0.1)',  label: 'PowerPoint', Icon: FileText },
  link: { color: '#9C5CE8', bg: 'rgba(156,92,232,0.1)', label: 'Link',       Icon: Link2 },
  html: { color: '#34D399', bg: 'rgba(52,211,153,0.1)',   label: 'HTML',       Icon: Code2 },
} as const

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StarRow({ value, size = 14, showEmpty = true }: { value: number; size?: number; showEmpty?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={size}
          style={{
            color: s <= Math.round(value) ? '#F5A623' : showEmpty ? 'rgba(200,190,170,0.2)' : 'rgba(200,190,170,0.2)',
            fill:  s <= Math.round(value) ? '#F5A623' : 'none',
          }}
        />
      ))}
    </div>
  )
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

// ── Google-style Ratings & Reviews ───────────────────────────────────────────
function ReviewSection({ resourceId }: { resourceId: string }) {
  const [average, setAverage]       = useState(0)
  const [count, setCount]           = useState(0)
  const [breakdown, setBreakdown]   = useState<{ star: number; count: number }[]>([])
  const [reviews, setReviews]       = useState<any[]>([])  // merged ratings+comments
  const [loadingData, setLoadingData] = useState(true)
  const [sortBy, setSortBy]         = useState<SortOption>('newest')
  const [showForm, setShowForm]     = useState(false)

  // Form state
  const [hoverStar, setHoverStar]   = useState(0)
  const [pickedStar, setPickedStar] = useState(0)
  const [rName, setRName]           = useState('')
  const [rEmail, setREmail]         = useState('')
  const [rLocation, setRLocation]   = useState('')
  const [rComment, setRComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingData(true)
      try {
        const [ratingsRes, commentsRes] = await Promise.all([
          fetch(`/api/ratings?resource_id=${resourceId}`),
          fetch(`/api/comments?resource_id=${resourceId}`),
        ])
        if (cancelled) return
        const ratingsData  = await ratingsRes.json()
        const commentsData = await commentsRes.json()
        if (cancelled) return

        setAverage(ratingsData.average || 0)
        setCount(ratingsData.count || 0)
        setBreakdown(ratingsData.breakdown || [])

        const ratingsList: any[] = ratingsData.ratings || []
        const commentsList: any[] = commentsData.comments || []
        const ratingByName: Record<string, number> = {}
        ratingsList.forEach((r: any) => {
          ratingByName[r.reviewer_name?.toLowerCase()] = r.rating
        })
        const merged = commentsList.map((c: any) => ({
          ...c, rating: ratingByName[c.author?.toLowerCase()] ?? null, type: 'review',
        }))
        const commentAuthors = new Set(commentsList.map((c: any) => c.author?.toLowerCase()))
        ratingsList.forEach((r: any) => {
          if (!commentAuthors.has(r.reviewer_name?.toLowerCase())) {
            merged.push({ id: r.id, author: r.reviewer_name, location: r.reviewer_location || null, comment: null, rating: r.rating, created_at: r.created_at, type: 'rating-only' })
          }
        })
        setReviews(merged)
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [resourceId])

  async function loadData() {
    setLoadingData(true)
    try {
      const [ratingsRes, commentsRes] = await Promise.all([
        fetch(`/api/ratings?resource_id=${resourceId}`),
        fetch(`/api/comments?resource_id=${resourceId}`),
      ])
      const ratingsData  = await ratingsRes.json()
      const commentsData = await commentsRes.json()

      setAverage(ratingsData.average || 0)
      setCount(ratingsData.count || 0)
      setBreakdown(ratingsData.breakdown || [])

      // Build merged review list: match comments to ratings by name
      const ratingsList: any[] = ratingsData.ratings || []
      const commentsList: any[] = commentsData.comments || []

      // Create a map of ratings by reviewer_name for quick lookup
      const ratingByName: Record<string, number> = {}
      ratingsList.forEach((r: any) => {
        ratingByName[r.reviewer_name?.toLowerCase()] = r.rating
      })

      // Merge: comments get their matching star rating
      const merged = commentsList.map((c: any) => ({
        ...c,
        rating: ratingByName[c.author?.toLowerCase()] ?? null,
        type: 'review',
      }))

      // Add rating-only entries (people who rated but didn't comment)
      const commentAuthors = new Set(commentsList.map((c: any) => c.author?.toLowerCase()))
      ratingsList.forEach((r: any) => {
        if (!commentAuthors.has(r.reviewer_name?.toLowerCase())) {
          merged.push({
            id: r.id,
            author: r.reviewer_name,
            location: r.reviewer_location || null,
            comment: null,
            rating: r.rating,
            created_at: r.created_at,
            type: 'rating-only',
          })
        }
      })

      setReviews(merged)
    } finally {
      setLoadingData(false)
    }
  }

  function getSortedReviews() {
    const sorted = [...reviews]
    switch (sortBy) {
      case 'newest':  return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'oldest':  return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'highest': return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      case 'lowest':  return sorted.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
      default:        return sorted
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!rName.trim()) return toast.error('Please enter your name')
    if (!pickedStar)   return toast.error('Please select a star rating')
    if (!rLocation.trim()) return toast.error('Please enter your location')
    if (!rComment.trim()) return toast.error('Please write a review comment')
    setSubmitting(true)
    try {
      const ratingRes = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resourceId, rating: pickedStar,
          reviewer_name: rName.trim(), reviewer_email: rEmail.trim() || undefined,
          reviewer_location: rLocation.trim() || undefined,
        }),
      })
      if (!ratingRes.ok) throw new Error((await ratingRes.json()).error)

      if (rComment.trim()) {
        const commentRes = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: resourceId, comment: rComment.trim(),
            author: rName.trim(), location: rLocation.trim() || undefined,
          }),
        })
        if (!commentRes.ok) throw new Error((await commentRes.json()).error)
      }

      toast.success('Review submitted! Thank you ⭐')
      setShowForm(false)
      setPickedStar(0); setRName(''); setREmail(''); setRLocation(''); setRComment('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const maxCount = Math.max(...breakdown.map(b => b.count), 1)
  const sortedReviews = getSortedReviews()

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest',  label: 'Newest' },
    { value: 'oldest',  label: 'Oldest' },
    { value: 'highest', label: 'Highest Rating' },
    { value: 'lowest',  label: 'Lowest Rating' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Star size={15} style={{ color: '#F5A623', fill: '#F5A623' }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
            Ratings & Reviews
          </span>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C', border: '1px solid rgba(200,149,92,0.25)' }}
          >
            <Star size={12} /> Write a Review
          </button>
        )}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: '#C8955C' }} /></div>
      ) : (
        <>
          {/* Aggregate — Google style */}
          {count > 0 && (
            <div className="flex gap-5 mb-5 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
              {/* Big score */}
              <div className="text-center flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]">
                <p className="font-light" style={{ fontSize: '2.8rem', lineHeight: 1, color: '#F5F0E8', fontFamily: 'Cormorant Garamond, serif' }}>
                  {average.toFixed(1)}
                </p>
                <StarRow value={average} size={13} />
                <p className="text-xs mt-1" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                  {count} review{count !== 1 ? 's' : ''}
                </p>
              </div>
              {/* Bar breakdown */}
              <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                {breakdown.map(({ star, count: c }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-3 text-right flex-shrink-0" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{star}</span>
                    <Star size={10} style={{ color: '#F5A623', fill: '#F5A623', flexShrink: 0 }} />
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(200,190,170,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(c / maxCount) * 100}%`, background: 'linear-gradient(90deg, #F5A623, #E8952C)' }} />
                    </div>
                    <span className="text-xs w-4 flex-shrink-0 text-right" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Write Review Form */}
          {showForm && (
            <form onSubmit={submitReview} className="mb-5 rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(200,149,92,0.04)', border: '1px solid rgba(200,149,92,0.15)' }}>
              <div className="flex items-center justify-between">
                <p className="text-base font-medium" style={{ color: '#F5F0E8', fontFamily: 'Cormorant Garamond, serif' }}>Your Review</p>
                <button type="button"
                  onClick={() => { setShowForm(false); setPickedStar(0); setRName(''); setREmail(''); setRLocation(''); setRComment('') }}
                  className="p-1.5 rounded-lg" style={{ color: '#8A8478' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Star picker */}
              <div>
                <p className="text-xs mb-2" style={{ color: '#8A8478' }}>Rating <span style={{ color: '#C8955C' }}>*</span></p>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} type="button"
                      onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setPickedStar(s)} className="transition-transform hover:scale-110 active:scale-95">
                      <Star size={30} style={{
                        color: s <= (hoverStar || pickedStar) ? '#F5A623' : 'rgba(200,190,170,0.2)',
                        fill:  s <= (hoverStar || pickedStar) ? '#F5A623' : 'none',
                        transition: 'all 0.1s',
                      }} />
                    </button>
                  ))}
                  {pickedStar > 0 && (
                    <span className="text-sm ml-2" style={{ color: '#F5A623', fontFamily: 'DM Mono, monospace' }}>
                      {['','Poor','Fair','Good','Very Good','Excellent'][pickedStar]}
                    </span>
                  )}
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Name <span style={{ color: '#C8955C' }}>*</span></label>
                  <input className="input" style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    placeholder="Your name" value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    onClick={(e) => e.stopPropagation()} required />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Email <span className="opacity-50">(optional)</span></label>
                  <input className="input" style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    type="email" placeholder="you@example.com" value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    onClick={(e) => e.stopPropagation()} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Location <span style={{ color: '#C8955C' }}>*</span></label>
                  <input className="input" style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    placeholder="City, Country" value={rLocation}
                    onChange={(e) => setRLocation(e.target.value)}
                    onClick={(e) => e.stopPropagation()} />
                </div>
              </div>

              {/* Review text */}
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Review <span style={{ color: '#C8955C' }}>*</span></label>
                <textarea className="input resize-none" style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                  rows={3} placeholder="Share your experience with this resource..."
                  value={rComment} onChange={(e) => setRComment(e.target.value)}
                  onClick={(e) => e.stopPropagation()} />
              </div>

              <button type="submit" disabled={submitting || !pickedStar || !rName.trim()}
                className="btn-primary w-full justify-center">
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Send size={15} /> Submit Review</>}
              </button>
            </form>
          )}

          {/* Sort bar */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs flex items-center gap-1" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                <ArrowUpDown size={11} /> Sort:
              </span>
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)}
                  className="text-xs px-3 py-1 rounded-full transition-all"
                  style={{
                    background: sortBy === opt.value ? 'rgba(200,149,92,0.15)' : 'rgba(255,255,255,0.04)',
                    color:      sortBy === opt.value ? '#C8955C' : '#8A8478',
                    border:     sortBy === opt.value ? '1px solid rgba(200,149,92,0.3)' : '1px solid rgba(200,190,170,0.08)',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 && !showForm ? (
            <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
              <Star size={28} className="mx-auto mb-2" style={{ color: '#2A2A35' }} />
              <p className="text-sm mb-3" style={{ color: '#8A8478' }}>No reviews yet. Be the first!</p>
              <button onClick={() => setShowForm(true)} className="btn-ghost text-xs">Write a Review</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReviews.map((review) => (
                <div key={review.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.07)' }}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(200,149,92,0.25), rgba(200,149,92,0.1))', color: '#C8955C', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem' }}>
                      {review.author?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Name + location + date */}
                      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{review.author}</span>
                          {review.location && (
                            <span className="text-xs ml-2" style={{ color: '#8A8478' }}>
                              📍 {review.location}
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                          {new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Individual star rating for this review */}
                      {review.rating && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <StarRow value={review.rating} size={13} />
                          <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                            {review.rating}/5 · {['','Poor','Fair','Good','Very Good','Excellent'][review.rating]}
                          </span>
                        </div>
                      )}

                      {/* Comment text */}
                      {review.comment && (
                        <p className="text-sm leading-relaxed" style={{ color: '#B0A898', lineHeight: 1.7 }}>
                          {review.comment}
                        </p>
                      )}
                      {!review.comment && review.type === 'rating-only' && (
                        <p className="text-xs italic" style={{ color: '#8A8478' }}>Rated without a written review</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Request Access Modal ──────────────────────────────────────────────────────
function RequestModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [location, setLocation]   = useState('')
  const [reason, setReason]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return toast.error('Full name is required')
    if (!email) return toast.error('Email is required')
    if (!location) return toast.error('Location is required')
    if (!reason) return toast.error('Please tell us why you need this resource')
    setLoading(true)
    try {
      const res = await fetch('/api/request-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resource.id, name, email, location, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setSubmitted(true)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 300 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md rounded-2xl p-8"
        style={{ background: '#111118', border: '1px solid rgba(200,149,92,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg" style={{ color: '#8A8478' }}><X size={18} /></button>
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#5CC87B' }} />
            <h3 className="text-2xl font-light mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>Request Sent!</h3>
            <p className="text-sm" style={{ color: '#8A8478' }}>You'll receive a secure download link via email once approved.</p>
            <button className="btn-primary mt-6 mx-auto" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>Request Download Access</span>
              <h3 className="text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>{resource.title}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Full Name <span style={{ color: '#C8955C' }}>*</span></label>
                <input className="input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Email <span style={{ color: '#C8955C' }}>*</span></label>
                <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Location <span style={{ color: '#C8955C' }}>*</span></label>
                <input className="input" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Why do you need this? <span style={{ color: '#C8955C' }}>*</span></label>
                <textarea className="input resize-none" rows={2} placeholder="Brief reason..." value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ resource, onClose, onRequestAccess, onPreviewGenerated }: {
  resource: Resource; onClose: () => void
  onRequestAccess: () => void; onPreviewGenerated: (s: string) => void
}) {
  const [generatingPreview, setGeneratingPreview] = useState(false)
  const [synopsis, setSynopsis] = useState(resource.synopsis || '')
  const fileInfo = FILE_ICONS[resource.file_type] ?? FILE_ICONS.pdf
  const { Icon, color, bg, label } = fileInfo

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!synopsis && resource.file_type !== 'link') generatePreview()
  }, [resource.id])

  async function generatePreview() {
    setGeneratingPreview(true)
    try {
      const res = await fetch('/api/generate-synopsis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resource.id }),
      })
      const data = await res.json()
      if (res.ok && data.synopsis) { setSynopsis(data.synopsis); onPreviewGenerated(data.synopsis) }
    } catch (err) { console.error('Preview failed:', err) }
    finally { setGeneratingPreview(false) }
  }

  return (
    <>
      {/* Backdrop — only covers left side so panel inputs work */}
      <div className="fixed top-0 left-0 bottom-0"
        style={{ right: 'min(580px, 95vw)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 150 }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full flex flex-col"
        style={{ width: 'min(580px, 95vw)', background: '#0E0E16', borderLeft: '1px solid rgba(200,149,92,0.12)', zIndex: 160, overflowY: 'auto', animation: 'slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}>
        <style>{`@keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: '#0E0E16', borderColor: 'rgba(200,190,170,0.08)', zIndex: 1 }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg, color }}><Icon size={14} /></div>
            <span className="text-xs uppercase tracking-widest" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{label}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#8A8478' }}><X size={18} /></button>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Title + meta */}
          <div>
            <h2 className="text-3xl font-light leading-snug mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>{resource.title}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {resource.file_size > 0 && <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{formatBytes(resource.file_size)}</span>}
              {/* <span className="text-xs flex items-center gap-1" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                <Calendar size={11} />
                {new Date(resource.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span> */}
            </div>
          </div>

          {/* Tags */}
          {resource.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">{resource.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
          )}

          {/* File Preview */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(200,190,170,0.08)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: '#C8955C' }} />
                <span className="text-xs uppercase tracking-widest" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>File Preview</span>
              </div>
              {resource.file_type !== 'link' && (
                <button onClick={generatePreview} disabled={generatingPreview}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C', border: '1px solid rgba(200,149,92,0.2)' }}>
                  {generatingPreview ? <><Loader2 size={11} className="animate-spin" /> Extracting...</> : <><RefreshCw size={11} /> {synopsis ? 'Re-extract' : 'Extract Preview'}</>}
                </button>
              )}
            </div>
            <div className="p-4">
              {generatingPreview ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 size={16} className="animate-spin" style={{ color: '#C8955C' }} />
                  <p className="text-sm" style={{ color: '#8A8478' }}>Extracting text from file...</p>
                </div>
              ) : synopsis ? (
                <p className="text-sm leading-relaxed" style={{ color: '#C8BFB5', lineHeight: 1.85 }}>
                  {synopsis}
                </p>
              ) : (
                <p className="text-sm italic py-3" style={{ color: '#8A8478' }}>
                  {resource.file_type === 'link' ? resource.description || 'No description available.' : 'Click "Extract Preview" to generate one.'}
                </p>
              )}
            </div>
          </div>

          {/* Request Access */}
          {/* Files & Links Section */}
          <div className="space-y-3">
            {/* Show all resource_files if available */}
            {(resource.resource_files && resource.resource_files.length > 0) ? (
              resource.resource_files.map((rf) => {
                const info = FILE_ICONS[rf.file_type] || FILE_ICONS.pdf
                const RIcon = info.Icon
                if (rf.file_type === 'link' && rf.file_url) {
                  return (
                    <a key={rf.id} href={rf.file_url} target="_blank" rel="noopener noreferrer"
                      className="btn-primary w-full justify-center">
                      <Eye size={15} /> Visit Link
                    </a>
                  )
                }
                // Protected file — show request access per file
                return (
                  <div key={rf.id} className="rounded-2xl p-4" style={{ background: 'rgba(200,149,92,0.06)', border: '1px solid rgba(200,149,92,0.15)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: info.bg, color: info.color }}>
                        <RIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{rf.file_name || rf.file_type.toUpperCase()}</p>
                        <p className="text-xs" style={{ color: '#8A8478' }}>{info.label} {rf.file_size ? `· ${(rf.file_size / 1024).toFixed(0)} KB` : ''}</p>
                      </div>
                      <Lock size={14} style={{ color: '#8A8478', flexShrink: 0 }} />
                    </div>
                    <button onClick={onRequestAccess} className="btn-primary w-full justify-center">
                      <Download size={15} /> Request Access
                    </button>
                  </div>
                )
              })
            ) : (
              // Fallback to old single-file behaviour
              resource.file_type === 'link' ? (
                <a href={resource.file_url!} target="_blank" rel="noopener noreferrer"
                  className="btn-primary w-full justify-center">
                  <Eye size={15} /> Visit Link
                </a>
              ) : (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(200,149,92,0.06)', border: '1px solid rgba(200,149,92,0.15)' }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C' }}><Lock size={16} /></div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#F5F0E8' }}>Full file is access-protected</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#8A8478' }}>Submit your details to receive a secure download link via email once approved.</p>
                    </div>
                  </div>
                  <button onClick={onRequestAccess} className="btn-primary w-full justify-center">
                    <Download size={15} /> Request Download Access
                  </button>
                </div>
              )
            )}
          </div>

          {/* Ratings & Reviews */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
            <ReviewSection resourceId={resource.id} />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Resource Card — UNIFORM SIZE ─────────────────────────────────────────────
function ResourceListItem({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const info = FILE_ICONS[resource.file_type] || FILE_ICONS.pdf
  const Icon = info.Icon
  const synopsis = resource.synopsis || resource.description || ''
  const ratings = resource.resource_ratings || []
  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : null
  const commentCount = resource.resource_comments?.length || 0

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl cursor-pointer transition-all duration-200 group"
      style={{ border: '1px solid rgba(200,190,170,0.1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(200,149,92,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(200,190,170,0.1)')}
    >
      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: info.bg, color: info.color }}>
          <Icon size={18} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: info.bg, color: info.color, fontFamily: 'DM Mono, monospace' }}>
                  {info.label}
                </span>
                <h3 className="text-base font-medium" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
                  {resource.title}
                </h3>
              </div>

              {/* Synopsis */}
              {synopsis && (
                <p className="text-sm leading-relaxed mb-2" style={{ color: '#8A8478', lineHeight: 1.7 }}>
                  {synopsis.length > 200 ? synopsis.slice(0, 200).trimEnd() + '…' : synopsis}
                </p>
              )}

              {/* Tags + meta row */}
              <div className="flex items-center gap-3 flex-wrap">
                {(resource.tags || []).slice(0, 4).map((tag) => (
                  <span key={tag} className="tag" style={{ fontSize: '10px' }}>{tag}</span>
                ))}
                {/* <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                  {new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span> */}
                {avg && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#C8955C' }}>
                    ★ {avg} ({ratings.length})
                  </span>
                )}
                {commentCount > 0 && (
                  <span className="text-xs" style={{ color: '#8A8478' }}>{commentCount} review{commentCount > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-1" style={{ color: '#C8955C' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const fileInfo = FILE_ICONS[resource.file_type] ?? FILE_ICONS.pdf
  const { Icon, color, bg, label } = fileInfo

  const allRatings   = resource.resource_ratings ?? []
  const avgRating    = allRatings.length > 0
    ? Math.round((allRatings.reduce((s: number, r: any) => s + r.rating, 0) / allRatings.length) * 10) / 10
    : null
  const commentCount = resource.resource_comments?.length ?? 0
  const synopsis  = resource.synopsis || resource.description || ''
  const truncated = synopsis  // show full synopsis on card

  return (
    <div onClick={onClick}
      className="glass rounded-2xl cursor-pointer transition-all duration-200 group flex flex-col h-full"
      style={{ border: '1px solid rgba(200,190,170,0.1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(200,149,92,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(200,190,170,0.1)')}>

      {/* Top section */}
      <div className="p-5 flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Icon + title + rating */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: bg, color }}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: bg, color, fontFamily: 'DM Mono, monospace', fontSize: '0.62rem' }}>{label}</span>
              {resource.file_size > 0 && <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{formatBytes(resource.file_size)}</span>}
            </div>
            {/* Title — fixed 2 lines max */}
            <h3 className="text-base font-medium leading-snug line-clamp-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
              {resource.title}
            </h3>
            {/* Rating row */}
            {avgRating !== null && (
              <div className="flex items-center gap-1 mt-1">
                <StarRow value={avgRating} size={11} />
                <span className="text-xs ml-0.5" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                  {avgRating}/5 ({allRatings.length})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preview text — fixed height, always 2 lines */}
        <div className="flex-1 overflow-hidden">
          {truncated ? (
            <p className="text-xs leading-relaxed" style={{ color: '#B0A898', lineHeight: 1.7 }}>{truncated}</p>
          ) : (
            <p className="text-xs italic" style={{ color: '#8A8478' }}>Click to view details & preview</p>
          )}
        </div>

        {/* Tags — max 2 tags to save space */}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 2).map((tag) => <span key={tag} className="tag">{tag}</span>)}
            {resource.tags.length > 2 && <span className="tag">+{resource.tags.length - 2}</span>}
          </div>
        )}
      </div>

      {/* Footer — always at bottom */}
      <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: 'rgba(200,190,170,0.07)' }}>
        <div className="flex items-center gap-3">
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
              <MessageSquare size={11} /> {commentCount}
            </span>
          )}
          <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
            {new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs transition-all duration-200 group-hover:gap-2" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
          View details <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}

const ALL_TYPES = ['all', 'pdf', 'docx', 'xlsx', 'pptx', 'link'] as const

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const [resources, setResources]     = useState<Resource[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState<string>('all')

  // Read filter from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const filter = params.get('filter')
    if (filter) setFilterType(filter)
  }, [])
  const [selected, setSelected]       = useState<Resource | null>(null)
  const [showRequest, setShowRequest] = useState(false)

  useEffect(() => { fetchResources() }, [])

  async function fetchResourceDetail(resource: Resource) {
    // Fetch full resource including file_data only when needed
    setSelected(resource) // show panel immediately with metadata
    try {
      const { data } = await supabase
        .from('resources')
        .select(`
          *, 
          resource_files ( id, file_type, file_name, file_size, mime_type, file_url, file_data )
        `)
        .eq('id', resource.id)
        .single()
      if (data) setSelected(data as Resource)
    } catch (e) {
      console.error('Failed to load resource detail:', e)
    }
  }

  async function fetchResources() {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select(`
        id, title, description, synopsis, synopsis_generated,
        file_type, file_name, file_size, mime_type, file_url,
        tags, is_active, created_at, updated_at,
        resource_ratings ( rating ),
        resource_comments ( id ),
        resource_files ( id, file_type, file_name, file_size, mime_type, file_url )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (!error && data) setResources(data as Resource[])
    else if (error) toast.error('Failed to load resources')
    setLoading(false)
  }

  function handlePreviewGenerated(resourceId: string, synopsis: string) {
    setResources((prev) => prev.map((r) => r.id === resourceId ? { ...r, synopsis, synopsis_generated: true } : r))
    setSelected((prev) => prev?.id === resourceId ? { ...prev, synopsis, synopsis_generated: true } : prev)
  }

  // Build tag-based filter tabs dynamically from loaded resources
  const ALL_TAGS = ['all', ...Array.from(new Set(resources.flatMap((r) => r.tags || []))).sort()]

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase()
    const match = !q || r.title.toLowerCase().includes(q) || r.synopsis?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
    return match && (filterType === 'all' || (r.tags || []).some((t) => t.toLowerCase() === filterType.toLowerCase()))
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-10 animate-fade-up">
        <span className="text-xs uppercase tracking-[0.25em] mb-3 block" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>Knowledge Base</span>
        <h1 className="text-4xl md:text-6xl font-light mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>Resources</h1>

        {/* Callout box */}
        <div className="max-w-2xl rounded-2xl px-6 py-5" style={{
          border: '1px solid rgba(200,149,92,0.3)',
          background: 'rgba(200,149,92,0.05)',
        }}>
          <p className="text-sm leading-relaxed" style={{ color: '#C8BFB5', lineHeight: 1.85 }}>
            A curated library of original clinical compliance tools, protocols, and frameworks — developed in the field, refined through real-world survey experience, and adopted across nursing home networks in the United States.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8A8478' }} />
          <input className="input input-search" placeholder="Search by title, preview, or tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_TAGS.map((tag) => (
            <button key={tag} onClick={() => setFilterType(tag)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ fontFamily: 'DM Mono, monospace', background: filterType === tag ? 'rgba(200,149,92,0.15)' : 'rgba(255,255,255,0.04)', color: filterType === tag ? '#C8955C' : '#8A8478', border: filterType === tag ? '1px solid rgba(200,149,92,0.3)' : '1px solid rgba(200,190,170,0.1)' }}>
              {tag === 'all' ? 'All' : tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin" style={{ color: '#C8955C' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Filter size={40} className="mx-auto mb-4" style={{ color: '#2A2A35' }} />
          <p style={{ color: '#8A8478' }}>{resources.length === 0 ? 'No resources available yet.' : 'No resources match your search.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((resource, i) => (
            <div key={resource.id} className="animate-fade-up" style={{ animationDelay: `${0.04 * i}s` }}>
              <ResourceListItem resource={resource} onClick={() => fetchResourceDetail(resource)} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailPanel
          resource={selected}
          onClose={() => { setSelected(null); setShowRequest(false) }}
          onRequestAccess={() => setShowRequest(true)}
          onPreviewGenerated={(s) => handlePreviewGenerated(selected.id, s)}
        />
      )}

      {showRequest && selected && (
        <RequestModal resource={selected} onClose={() => setShowRequest(false)} />
      )}
    </div>
  )
}