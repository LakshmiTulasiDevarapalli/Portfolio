import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, MIME_TYPES } from '@/lib/supabase'
import { verifyToken } from '../admin-login/route'

export const maxDuration = 60

// ── Extract readable text from file buffer ────────────────────────────────────
async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const parsed   = await pdfParse(buffer)
      return parsed.text || ''
    }
    if (fileType === 'docx') {
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      return result.value || ''
    }
    if (fileType === 'xlsx') {
      // xlsx = ZIP with XML; shared strings are in <t> tags
      const str     = buffer.toString('utf-8', 0, Math.min(buffer.length, 200000))
      const matches = str.match(/<t[^>]*>([^<]+)<\/t>/g) || []
      return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(s => s.length > 1).join(' ')
    }
    if (fileType === 'pptx') {
      // pptx = ZIP with XML; slide text in <a:t> tags
      const str     = buffer.toString('utf-8', 0, Math.min(buffer.length, 200000))
      const matches = str.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
      return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(s => s.length > 1).join(' ')
    }
  } catch (err) {
    console.error('Text extraction error:', err)
  }
  return ''
}

// ── Clean extracted text into a readable preview ──────────────────────────────
function buildPreview(rawText: string, maxChars = 600): string {
  if (!rawText) return ''
  const cleaned = rawText
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim()

  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 5)
  let preview = ''
  for (const line of lines) {
    if ((preview + ' ' + line).length > maxChars) break
    preview += (preview ? ' ' : '') + line
  }
  if (preview.length > maxChars) {
    preview = preview.slice(0, maxChars).trimEnd()
    const lastSpace = preview.lastIndexOf(' ')
    if (lastSpace > maxChars * 0.8) preview = preview.slice(0, lastSpace)
  }
  return preview.trim()
}

export async function POST(req: NextRequest) {
  const formData   = await req.formData()
  const adminToken = formData.get('admin_token') as string
  if (!adminToken || !verifyToken(adminToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const title       = formData.get('title') as string
  const description = formData.get('description') as string
  const fileType    = formData.get('file_type') as string
  const tagsRaw     = formData.get('tags') as string
  const linkUrl     = formData.get('link_url') as string
  const file        = formData.get('file') as File | null

  if (!title || !fileType) {
    return NextResponse.json({ error: 'Title and file type are required' }, { status: 400 })
  }

  const tags     = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
  const supabase = createAdminClient()

  // ── Link ──────────────────────────────────────────────────────────────────
  if (fileType === 'link') {
    if (!linkUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 })
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title, description: description || null,
        file_type: 'link', file_url: linkUrl,
        synopsis: description || '', synopsis_generated: true,
        tags, is_active: true,
      })
      .select('id, title, file_type, created_at').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Link saved!', resource: data })
  }

  // ── File ──────────────────────────────────────────────────────────────────
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const MAX_SIZE = 25 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({
      error: `File too large. Max 25MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`
    }, { status: 413 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer  = Buffer.from(arrayBuffer)
  const base64Data  = fileBuffer.toString('base64')
  const mimeType    = MIME_TYPES[fileType] || file.type || 'application/octet-stream'

  // Extract text preview from the actual file content
  let synopsis = ''
  try {
    const rawText = await extractTextFromFile(fileBuffer, fileType)
    synopsis = buildPreview(rawText, 600)
    console.log(`Extracted ${synopsis.length} chars from ${file.name}`)
  } catch (e) {
    console.error('Preview extraction failed:', e)
  }

  const { data, error } = await supabase
    .from('resources')
    .insert({
      title, description: description || null,
      file_type: fileType, file_name: file.name,
      file_size: file.size, file_data: base64Data,
      mime_type: mimeType, synopsis,
      synopsis_generated: synopsis.length > 0,
      tags, is_active: true,
    })
    .select('id, title, file_type, file_name, file_size, created_at').single()

  if (error) {
    console.error('DB insert error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ message: 'File uploaded!', resource: data, previewExtracted: synopsis.length > 0 })
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}