'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, Trash2, CheckCircle, XCircle, Loader2,
  FileSpreadsheet, File, Presentation, Link2, LogOut, Bell,
  Plus, X, CloudUpload, RefreshCw, ChevronDown, Star,
  Sparkles, MessageSquare, Send, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, Resource, AccessRequest } from '@/lib/supabase'

const FILE_ICONS: Record<string, any> = {
  pdf:  { icon: FileText,        color: '#E85C5C', bg: 'rgba(232,92,92,0.1)',   label: 'PDF' },
  docx: { icon: File,            color: '#5C8CE8', bg: 'rgba(92,140,232,0.1)',  label: 'Word' },
  xlsx: { icon: FileSpreadsheet, color: '#5CC87B', bg: 'rgba(92,200,123,0.1)',  label: 'Excel' },
  pptx: { icon: Presentation,   color: '#C8955C', bg: 'rgba(200,149,92,0.1)',  label: 'PowerPoint' },
  link: { icon: Link2,           color: '#9C5CE8', bg: 'rgba(156,92,232,0.1)', label: 'Link' },
}

const FILE_TYPE_OPTIONS = [
  { value: 'pdf',  label: 'PDF Document',            icon: FileText,        color: '#E85C5C' },
  { value: 'docx', label: 'Word Document',            icon: File,            color: '#5C8CE8' },
  { value: 'xlsx', label: 'Excel Spreadsheet',        icon: FileSpreadsheet, color: '#5CC87B' },
  { value: 'pptx', label: 'PowerPoint Presentation',  icon: Presentation,   color: '#C8955C' },
]

function detectFileType(filename: string): 'pdf' | 'docx' | 'xlsx' | 'pptx' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf')                    return 'pdf'
  if (['doc', 'docx'].includes(ext))   return 'docx'
  if (['xls', 'xlsx'].includes(ext))   return 'xlsx'
  if (['ppt', 'pptx'].includes(ext))   return 'pptx'
  return 'pdf'
}

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type RequestWithResource = AccessRequest & { resources: Resource }

// ── Custom Dropdown (no overflow clipping) ────────────────────────────────────
function FileTypeDropdown({
  value,
  onChange,
}: {
  value: 'pdf' | 'docx' | 'xlsx' | 'pptx'
  onChange: (v: 'pdf' | 'docx' | 'xlsx' | 'pptx') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = FILE_TYPE_OPTIONS.find((o) => o.value === value) || FILE_TYPE_OPTIONS[0]
  const SelectedIcon = selected.icon

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between gap-3 cursor-pointer w-full"
        style={{ textAlign: 'left' }}
      >
        <span className="flex items-center gap-2">
          <SelectedIcon size={16} style={{ color: selected.color, flexShrink: 0 }} />
          <span style={{ color: '#F5F0E8' }}>{selected.label}</span>
        </span>
        <ChevronDown
          size={16}
          style={{
            color: '#8A8478',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown — rendered via fixed position to escape overflow */}
      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: '#1A1A25',
            border: '1px solid rgba(200,149,92,0.25)',
            zIndex: 9999,
          }}
        >
          {FILE_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value as any); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  background: isSelected ? 'rgba(200,149,92,0.1)' : 'transparent',
                  color: isSelected ? '#C8955C' : '#F5F0E8',
                  borderBottom: '1px solid rgba(200,190,170,0.06)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <Icon size={16} style={{ color: option.color, flexShrink: 0 }} />
                <span className="text-sm">{option.label}</span>
                {isSelected && (
                  <CheckCircle size={14} className="ml-auto" style={{ color: '#C8955C' }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── Admin Resource Card ────────────────────────────────────────────────────────
function AdminResourceCard({ resource, onDelete, actionLoading, onRefresh, selected, onToggleSelect }: {
  resource: Resource
  onDelete: (id: string, title: string) => void
  actionLoading: string | null
  onRefresh: () => void
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const fileInfo = FILE_ICONS[resource.file_type] || FILE_ICONS.pdf
  const Icon = fileInfo.icon

  const [rating, setRating]           = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [savingRating, setSavingRating] = useState(false)
  const [comment, setComment]         = useState('')
  const [comments, setComments]       = useState<any[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [addingComment, setAddingComment]   = useState(false)
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false)
  const [synopsis, setSynopsis]       = useState(resource.synopsis || '')

  // Load existing rating
  useEffect(() => {
    fetch(`/api/ratings?resource_id=${resource.id}`)
      .then(r => r.json()).then(d => { if (d.rating) setRating(d.rating) })
  }, [resource.id])

  async function saveRating(val: number) {
    setSavingRating(true)
    setRating(val)
    const token = sessionStorage.getItem('admin_token')
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resource_id: resource.id, rating: val }),
    })
    setSavingRating(false)
    toast.success(`Rated ${val}/5 ⭐`)
  }

  async function loadComments() {
    if (!commentsLoaded) {
      const res = await fetch(`/api/comments?resource_id=${resource.id}`)
      const data = await res.json()
      setComments(data.comments || [])
      setCommentsLoaded(true)
    }
    setShowComments(v => !v)
  }

  async function submitComment() {
    if (!comment.trim()) return
    setAddingComment(true)
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resource_id: resource.id, comment }),
    })
    const data = await res.json()
    if (res.ok) {
      setComments(prev => [data.data, ...prev])
      setComment('')
      setShowComments(true)
      setCommentsLoaded(true)
      toast.success('Comment added')
      onRefresh()
    } else { toast.error(data.error) }
    setAddingComment(false)
  }

  async function deleteComment(comment_id: string) {
    const token = sessionStorage.getItem('admin_token')
    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comment_id }),
    })
    setComments(prev => prev.filter(c => c.id !== comment_id))
    toast.success('Comment deleted')
    onRefresh()
  }

  async function generateSynopsis() {
    setGeneratingSynopsis(true)
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('/api/generate-synopsis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resource_id: resource.id }),
    })
    const data = await res.json()
    if (res.ok) { setSynopsis(data.synopsis); toast.success('Synopsis generated!') }
    else toast.error(data.error || 'Failed to generate')
    setGeneratingSynopsis(false)
  }

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col transition-all duration-150" style={{ border: selected ? '1px solid rgba(200,149,92,0.4)' : '1px solid rgba(200,190,170,0.08)', background: selected ? 'rgba(200,149,92,0.04)' : undefined }}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3 border-b" style={{ borderColor: 'rgba(200,190,170,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fileInfo.bg, color: fileInfo.color }}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: '#F5F0E8', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem' }}>{resource.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: fileInfo.bg, color: fileInfo.color, fontFamily: 'DM Mono, monospace', fontSize: '0.6rem' }}>{fileInfo.label}</span>
            {resource.file_size > 0 && <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{formatBytes(resource.file_size)}</span>}
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: resource.is_active ? 'rgba(92,200,123,0.1)' : 'rgba(232,92,92,0.1)', color: resource.is_active ? '#5CC87B' : '#E85C5C', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem' }}>
              {resource.is_active ? '● Active' : '● Inactive'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(resource.id) }}
            className="w-5 h-5 rounded border flex items-center justify-center transition-all"
            style={{
              borderColor: selected ? '#C8955C' : 'rgba(200,190,170,0.25)',
              background:   selected ? '#C8955C' : 'transparent',
              flexShrink: 0,
            }}
          >
            {selected && <span style={{ color: 'white', fontSize: '11px', lineHeight: 1 }}>✓</span>}
          </button>
          {/* Delete */}
          <button onClick={() => onDelete(resource.id, resource.title)} disabled={actionLoading === resource.id} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: '#8A8478' }}>
            {actionLoading === resource.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Synopsis section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} style={{ color: '#C8955C' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>Synopsis</span>
            </div>
            <button
              onClick={generateSynopsis}
              disabled={generatingSynopsis}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C', border: '1px solid rgba(200,149,92,0.2)' }}
            >
              {generatingSynopsis ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {generatingSynopsis ? 'Generating...' : synopsis ? 'Re-extract' : 'Extract File Preview'}
            </button>
          </div>
          {synopsis ? (
            <p className="text-xs leading-relaxed" style={{ color: '#B0A898', lineHeight: 1.7 }}>{synopsis}</p>
          ) : (
            <p className="text-xs italic" style={{ color: '#8A8478' }}>No synopsis yet. Click "Extract File Preview" to create one.</p>
          )}
        </div>

        {/* Star Rating */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>Your Rating</p>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => saveRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={savingRating}
                className="transition-transform hover:scale-110"
              >
                <Star size={20} style={{
                  color: s <= (hoverRating || rating) ? '#F5A623' : 'rgba(200,190,170,0.2)',
                  fill:  s <= (hoverRating || rating) ? '#F5A623' : 'none',
                  transition: 'all 0.1s',
                }} />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs ml-2" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{rating}/5</span>
            )}
            {savingRating && <Loader2 size={12} className="animate-spin ml-1" style={{ color: '#C8955C' }} />}
          </div>
        </div>

        {/* Comments */}
        <div>
          <button onClick={loadComments} className="flex items-center gap-1.5 text-xs mb-2 transition-colors" style={{ color: showComments ? '#C8955C' : '#8A8478', fontFamily: 'DM Mono, monospace' }}>
            <MessageSquare size={12} />
            {comments.length > 0 || commentsLoaded ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showComments && (
            <div className="space-y-2 mb-3">
              {comments.length === 0 && <p className="text-xs italic" style={{ color: '#8A8478' }}>No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg p-2.5 group/comment relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,190,170,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium" style={{ color: '#C8955C' }}>{c.author}</span>
                    <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteComment(c.id)} className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity p-0.5 rounded" style={{ color: '#E85C5C' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#B0A898' }}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment input */}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              style={{ padding: '7px 10px', fontSize: '0.75rem' }}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() }}}
            />
            <button
              onClick={submitComment}
              disabled={addingComment || !comment.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0"
              style={{ background: 'rgba(200,149,92,0.15)', color: '#C8955C', border: '1px solid rgba(200,149,92,0.2)' }}
            >
              {addingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [fileType, setFileType]       = useState<'pdf' | 'docx' | 'xlsx' | 'pptx'>('pdf')
  const [tags, setTags]               = useState('')
  const [linkUrl, setLinkUrl]         = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [progress, setProgress]       = useState('')
  const [mode, setMode]               = useState<'file' | 'link'>('file')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(selected: File) {
    setFile(selected)
    const detected = detectFileType(selected.name)
    setFileType(detected)
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return toast.error('Title is required')
    if (mode === 'file' && !file) return toast.error('Please select a file')
    if (mode === 'link' && !linkUrl.trim()) return toast.error('Please enter a URL')
    setLoading(true); setProgress('Preparing...')
    const token = sessionStorage.getItem('admin_token')
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('file_type', mode === 'link' ? 'link' : fileType)
      formData.append('tags', tags)
      if (file && mode === 'file') formData.append('file', file)
      if (mode === 'link') formData.append('link_url', linkUrl.trim())
      formData.append('admin_token', token || '')
      setProgress('Uploading to database...')
      const res = await fetch('/api/upload-resource', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      toast.success(`"${title}" uploaded successfully!`)
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error(err.message); setProgress('')
    } finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="w-full rounded-2xl relative" style={{ background: '#111118', border: '1px solid rgba(200,149,92,0.2)', maxWidth: '700px' }}>
        {/* Compact header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(200,190,170,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>Upload Resource</span>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#8A8478' }}><X size={16} /></button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5">
            {/* Row 1: Mode toggle */}
            <div className="flex gap-2 mb-4">
              {(['file', 'link'] as const).map((m) => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); setFile(null); setLinkUrl('') }}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: mode === m ? 'rgba(200,149,92,0.15)' : 'rgba(255,255,255,0.04)',
                    color: mode === m ? '#C8955C' : '#8A8478',
                    border: mode === m ? '1px solid rgba(200,149,92,0.3)' : '1px solid rgba(200,190,170,0.1)',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                  {m === 'file' ? '📄 File Upload' : '🔗 External Link'}
                </button>
              ))}
            </div>

            {/* Row 2: Drop zone (compact horizontal) */}
            {mode === 'file' && (
              <div
                className="border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 mb-4"
                style={{
                  borderColor: dragging ? '#C8955C' : file ? 'rgba(92,200,123,0.5)' : 'rgba(200,190,170,0.2)',
                  background: dragging ? 'rgba(200,149,92,0.05)' : file ? 'rgba(92,200,123,0.04)' : 'transparent',
                  padding: '10px 16px',
                }}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    {(() => { const info = FILE_ICONS[fileType]; const Icon = info.icon; return <Icon size={18} style={{ color: info.color, flexShrink: 0 }} /> })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{file.name}</p>
                      <p className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{formatBytes(file.size)} · {FILE_ICONS[fileType]?.label}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="p-1 flex-shrink-0" style={{ color: '#8A8478' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CloudUpload size={22} style={{ color: '#8A8478', flexShrink: 0 }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>Drop file here or click to browse</p>
                      <p className="text-xs" style={{ color: '#8A8478' }}>PDF, Word, Excel, PowerPoint — max 25 MB</p>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
              </div>
            )}

            {/* Link URL */}
            {mode === 'link' && (
              <div className="mb-4">
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>URL *</label>
                <input className="input" style={{ padding: '9px 12px' }} type="url" placeholder="https://example.com/resource" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
            )}

            {/* Row 3: Title + Tags side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Title <span style={{ color: '#C8955C' }}>*</span></label>
                <input className="input" style={{ padding: '9px 12px' }} placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Tags <span className="opacity-50">(comma separated)</span></label>
                <input className="input" style={{ padding: '9px 12px' }} placeholder="finance, 2024" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>

            {/* Row 4: Description + File type side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>Description</label>
                <textarea className="input resize-none" style={{ padding: '9px 12px' }} rows={2} placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {mode === 'file' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8A8478' }}>File Type <span className="opacity-40">(auto-detected)</span></label>
                  <FileTypeDropdown value={fileType} onChange={setFileType} />
                </div>
              )}
            </div>

            {/* Progress */}
            {loading && progress && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm mt-3" style={{ background: 'rgba(200,149,92,0.08)', color: '#C8955C' }}>
                <Loader2 size={14} className="animate-spin" /> {progress}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 pb-5">
            <button type="button" className="btn-ghost flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload Resource</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab]                     = useState<'resources' | 'requests'>('resources')
  const [resources, setResources]         = useState<Resource[]>([])
  const [requests, setRequests]           = useState<RequestWithResource[]>([])
  const [loading, setLoading]             = useState(true)
  const [showUpload, setShowUpload]       = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refreshing, setRefreshing]       = useState(false)
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [deletingMultiple, setDeletingMultiple] = useState(false)
  const [confirmModal, setConfirmModal]         = useState<{ open: boolean; title: string; ids: string[]; single: boolean }>({ open: false, title: '', ids: [], single: true })
  const [requestFilter, setRequestFilter]       = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (!token) { router.push('/admin') } else { fetchResources(); fetchRequests() }
  }, [])

  async function fetchResources() {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, description, synopsis, synopsis_generated, file_type, file_name, file_size, mime_type, file_url, tags, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (!error && data) setResources(data as Resource[])
    setLoading(false)
  }

  async function fetchRequests() {
    const token = sessionStorage.getItem('admin_token')
    try {
      const res = await fetch(`/api/admin-requests?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      } as any)
      const data = await res.json()
      if (!res.ok) {
        console.error('admin-requests error:', data)
        toast.error('Failed to load requests: ' + (data.error || res.status))
        setRequests([])
        return
      }
      setRequests(data.requests || [])
    } catch (e) {
      console.error('Failed to fetch requests', e)
      setRequests([])
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([fetchResources(), fetchRequests()])
    setRefreshing(false)
    toast.success('Refreshed!')
  }

  async function deleteResource(id: string, title: string) {
    setConfirmModal({ open: true, title, ids: [id], single: true })
  }

  async function executeDelete(ids: string[]) {
    const token = sessionStorage.getItem('admin_token')
    if (ids.length === 1) {
      setActionLoading(ids[0])
      try {
        const res = await fetch('/api/upload-resource', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: ids[0] }),
        })
        if (!res.ok) throw new Error('Delete failed')
        toast.success('Resource deleted')
        await fetchResources()
      } catch (err: any) { toast.error(err.message) }
      finally { setActionLoading(null) }
    } else {
      setDeletingMultiple(true)
      let count = 0
      for (const id of ids) {
        try {
          const res = await fetch('/api/upload-resource', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id }),
          })
          if (res.ok) count++
        } catch {}
      }
      toast.success(`Deleted ${count} resource${count > 1 ? 's' : ''}`)
      setSelectedIds(new Set())
      setDeletingMultiple(false)
      await fetchResources()
    }
  }

  async function deleteMultiple() {
    if (selectedIds.size === 0) return
    setConfirmModal({ open: true, title: `${selectedIds.size} selected resource${selectedIds.size > 1 ? 's' : ''}`, ids: Array.from(selectedIds), single: false })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(resources.map(r => r.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleRequest(requestId: string, action: 'approved' | 'rejected') {
    setActionLoading(requestId)
    try {
      const res = await fetch('/api/approve-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` },
        body: JSON.stringify({ request_id: requestId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(action === 'approved' ? '✅ Approved — download email sent!' : '❌ Request rejected')
      await fetchRequests()
    } catch (err: any) { toast.error(err.message) }
    finally { setActionLoading(null) }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest block mb-1" style={{ color: '#5C7BC8', fontFamily: 'DM Mono, monospace' }}>Admin Panel</span>
          <h1 className="text-3xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>Dashboard</h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn-ghost" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Upload Resource
          </button>
          <button className="btn-ghost" onClick={() => { sessionStorage.removeItem('admin_token'); router.push('/admin') }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Resources', value: resources.length, color: '#C8955C' },
          { label: 'Pending Requests', value: pendingCount, color: pendingCount > 0 ? '#E85C5C' : '#5CC87B' },
          { label: 'Total Requests', value: requests.length, color: '#5C7BC8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-5 text-center">
            <p className="text-3xl font-light mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color }}>{value}</p>
            <p className="text-xs" style={{ color: '#8A8478' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,190,170,0.08)', width: 'fit-content' }}>
        {(['resources', 'requests'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="relative px-6 py-2.5 rounded-lg text-sm capitalize transition-all"
            style={{ background: tab === t ? 'rgba(200,149,92,0.12)' : 'transparent', color: tab === t ? '#C8955C' : '#8A8478', border: tab === t ? '1px solid rgba(200,149,92,0.2)' : '1px solid transparent' }}>
            {t}
            {t === 'requests' && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#E85C5C', color: 'white' }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Resources Tab */}
      {tab === 'resources' && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: '#C8955C' }} />
            <p className="text-sm" style={{ color: '#8A8478' }}>Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-24">
            <CloudUpload size={48} className="mx-auto mb-4" style={{ color: '#2A2A35' }} />
            <p className="text-lg mb-2" style={{ color: '#F5F0E8', fontFamily: 'Cormorant Garamond, serif' }}>No resources yet</p>
            <p className="text-sm mb-6" style={{ color: '#8A8478' }}>Upload your first file to get started</p>
            <button className="btn-primary mx-auto" onClick={() => setShowUpload(true)}><Plus size={16} /> Upload Resource</button>
          </div>
        ) : (
          <>
            {/* Multi-select toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectedIds.size === resources.length ? clearSelection : selectAll}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#8A8478', border: '1px solid rgba(200,190,170,0.1)' }}
                >
                  <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: selectedIds.size === resources.length ? '#C8955C' : 'rgba(200,190,170,0.3)', background: selectedIds.size === resources.length ? '#C8955C' : 'transparent' }}>
                    {selectedIds.size === resources.length && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                  </div>
                  {selectedIds.size === resources.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-xs" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={clearSelection} className="btn-ghost text-xs py-1.5 px-3">
                    Clear
                  </button>
                  <button
                    onClick={deleteMultiple}
                    disabled={deletingMultiple}
                    className="flex items-center gap-2 text-xs px-4 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: 'rgba(232,92,92,0.12)', color: '#E85C5C', border: '1px solid rgba(232,92,92,0.25)' }}
                  >
                    {deletingMultiple ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    {deletingMultiple ? 'Deleting...' : `Delete ${selectedIds.size}`}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resources.map((r) => (
                <AdminResourceCard
                  key={r.id}
                  resource={r}
                  onDelete={deleteResource}
                  actionLoading={actionLoading}
                  onRefresh={fetchResources}
                  selected={selectedIds.has(r.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </>
        )
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {/* Filter bar */}
          {requests.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => {
                const count = f === 'all' ? requests.length : requests.filter(r => r.status === f).length
                return (
                  <button key={f} onClick={() => setRequestFilter(f)}
                    className="text-xs px-3 py-1.5 rounded-lg capitalize transition-all"
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      background: requestFilter === f ? 'rgba(200,149,92,0.15)' : 'rgba(255,255,255,0.04)',
                      color: requestFilter === f ? '#C8955C' : '#8A8478',
                      border: requestFilter === f ? '1px solid rgba(200,149,92,0.3)' : '1px solid rgba(200,190,170,0.1)',
                    }}>
                    {f === 'all' ? 'All' : f} ({count})
                  </button>
                )
              })}
            </div>
          )}
          {requests.length === 0 ? (
            <div className="text-center py-24">
              <Bell size={40} className="mx-auto mb-3" style={{ color: '#2A2A35' }} />
              <p style={{ color: '#8A8478' }}>No access requests yet</p>
            </div>
          ) : requests.filter(r => requestFilter === 'all' || r.status === requestFilter).length === 0 ? (
            <div className="text-center py-16">
              <p style={{ color: '#8A8478' }}>No {requestFilter} requests</p>
            </div>
          ) : requests.filter(r => requestFilter === 'all' || r.status === requestFilter).map((req) => (
            <div key={req.id} className="glass rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded font-medium uppercase" style={{
                    background: req.status === 'pending' ? 'rgba(200,149,92,0.12)' : req.status === 'approved' ? 'rgba(92,200,123,0.12)' : 'rgba(232,92,92,0.12)',
                    color: req.status === 'pending' ? '#C8955C' : req.status === 'approved' ? '#5CC87B' : '#E85C5C',
                    fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.05em',
                  }}>{req.status}</span>
                  <span className="text-xs" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
                    {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{req.requester_name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A8478' }}>{req.requester_email}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#C8955C' }}>📄 {(req as any).resources?.title || 'Unknown resource'}</p>
                {req.requester_reason && <p className="text-xs mt-1 italic" style={{ color: '#8A8478' }}>"{req.requester_reason}"</p>}
              </div>
              {req.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleRequest(req.id, 'approved')} disabled={actionLoading === req.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(92,200,123,0.1)', color: '#5CC87B', border: '1px solid rgba(92,200,123,0.25)' }}>
                    {actionLoading === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                  </button>
                  <button onClick={() => handleRequest(req.id, 'rejected')} disabled={actionLoading === req.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(232,92,92,0.1)', color: '#E85C5C', border: '1px solid rgba(232,92,92,0.25)' }}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
              {req.status === 'approved' && (
                <span className="text-xs flex items-center gap-1.5 flex-shrink-0" style={{ color: '#5CC87B' }}><CheckCircle size={14} /> Email sent</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { fetchResources(); setTab('resources') }} />
      )}

      {/* ── Custom Delete Confirm Modal ── */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(m => ({ ...m, open: false })) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ background: '#111118', border: '1px solid rgba(232,92,92,0.25)' }}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(232,92,92,0.1)', color: '#E85C5C' }}>
              <Trash2 size={26} />
            </div>

            <h3 className="text-2xl font-light mb-2"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
              Delete {confirmModal.single ? 'Resource' : `${confirmModal.ids.length} Resources`}
            </h3>

            <p className="text-sm mb-2" style={{ color: '#8A8478' }}>
              {confirmModal.single
                ? <>Are you sure you want to delete <strong style={{ color: '#F5F0E8' }}>"{confirmModal.title}"</strong>?</>
                : <>Are you sure you want to delete <strong style={{ color: '#E85C5C' }}>{confirmModal.ids.length} resources</strong>?</>
              }
            </p>
            <p className="text-xs mb-8" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1 justify-center"
                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
              >
                Cancel
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #E85C5C, #C84040)', color: 'white', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  const ids = confirmModal.ids
                  setConfirmModal(m => ({ ...m, open: false }))
                  executeDelete(ids)
                }}
              >
                <Trash2 size={15} />
                Delete {confirmModal.single ? '' : `${confirmModal.ids.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}