import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, MIME_TYPES } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === 'pdf') {
      const pdfParse = require('pdf-parse')
      const parsed = await pdfParse(buffer)
      return parsed.text || ''
    }
    if (fileType === 'docx') {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ''
    }
    if (fileType === 'xlsx') {
      const str = buffer.toString('latin1', 0, Math.min(buffer.length, 300000))
      const matches = str.match(/<t[^>]*>([^<]+)<\/t>/g) || []
      return matches.map((m: string) => m.replace(/<[^>]+>/g, '').trim()).filter((s: string) => s.length > 1).join(' ')
    }
    if (fileType === 'pptx') {
      const str = buffer.toString('latin1', 0, Math.min(buffer.length, 300000))
      const matches = str.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
      return matches.map((m: string) => m.replace(/<[^>]+>/g, '').trim()).filter((s: string) => s.length > 1).join(' ')
    }
    if (fileType === 'html') {
      const str = buffer.toString('utf-8')
      return str
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim()
    }
  } catch (err) {
    console.error(`Text extraction failed for ${fileType}:`, err)
  }
  return ''
}

function buildPreview(rawText: string, maxChars = 600): string {
  if (!rawText) return ''
  const cleaned = rawText
    .replace(/\r\n|\r/g, '\n').replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n')
    .replace(/[^\x20-\x7E\n]/g, ' ').trim()
  const lines = cleaned.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5)
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

function detectFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'docx'
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx'
  if (['ppt', 'pptx'].includes(ext)) return 'pptx'
  if (['html', 'htm'].includes(ext)) return 'html'
  return 'pdf'
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const adminToken = formData.get('admin_token') as string
  if (!adminToken || !verifyToken(adminToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const title          = formData.get('title') as string
  const description    = formData.get('description') as string
  const tagsRaw        = formData.get('tags') as string
  const linkUrl        = (formData.get('link_url') as string || '').trim()
  const manualSynopsis = (formData.get('synopsis') as string || '').trim()

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Collect all uploaded files
  const files: File[] = []
  const mainFile = formData.get('file') as File | null
  if (mainFile && mainFile.size > 0) files.push(mainFile)
  let i = 1
  while (true) {
    const extra = formData.get(`file_${i}`) as File | null
    if (!extra) break
    if (extra.size > 0) files.push(extra)
    i++
  }

  if (files.length === 0 && !linkUrl) {
    return NextResponse.json({ error: 'Please provide at least one file or a link' }, { status: 400 })
  }

  const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : []
  const supabase = createAdminClient()

  // Determine primary file_type for the resource record
  // If only link → 'link', if files → use first file's type
  const primaryFileType = files.length > 0 ? detectFileType(files[0].name) : 'link'

  // Build synopsis from first file or use manual
  let synopsis = manualSynopsis
  let firstFileData: { base64: string; mimeType: string; fileType: string } | null = null

  if (files.length > 0 && !synopsis) {
    try {
      const ft = detectFileType(files[0].name)
      const buf = Buffer.from(await files[0].arrayBuffer())
      const raw = await extractTextFromFile(buf, ft)
      synopsis = buildPreview(raw, 600)
    } catch (e) {
      console.error('Synopsis extraction failed:', e)
    }
  }

  // Create the main resource record
  const { data: resource, error: resError } = await supabase
    .from('resources')
    .insert({
      title,
      description: description || null,
      file_type: primaryFileType,
      file_url: linkUrl || null,
      synopsis: synopsis || null,
      synopsis_generated: synopsis.length > 0,
      tags,
      is_active: true,
      // Keep first file data in resources table for backward compat
      file_name: files.length > 0 ? files[0].name : null,
      file_size: files.length > 0 ? files[0].size : 0,
      mime_type: files.length > 0 ? (MIME_TYPES[detectFileType(files[0].name)] || files[0].type) : null,
    })
    .select('id, title, file_type, created_at')
    .single()

  if (resError) {
    console.error('Resource insert error:', resError)
    return NextResponse.json({ error: resError.message }, { status: 500 })
  }

  const resourceId = resource.id
  const fileInserts = []

  // Insert link as a resource_file entry
  if (linkUrl) {
    fileInserts.push({
      resource_id: resourceId,
      file_type: 'link',
      file_url: linkUrl,
      file_name: null,
      file_data: null,
      file_size: 0,
      mime_type: null,
    })
  }

  // Insert each uploaded file into resource_files
  for (const file of files) {
    const ft = detectFileType(file.name)
    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = buf.toString('base64')
    const mime = MIME_TYPES[ft] || file.type || 'application/octet-stream'

    // Also store first file's data in resources table for backward compat
    if (file === files[0]) {
      await supabase.from('resources').update({
        file_data: base64,
        mime_type: mime,
      }).eq('id', resourceId)
    }

    fileInserts.push({
      resource_id: resourceId,
      file_type: ft,
      file_name: file.name,
      file_data: base64,
      file_size: file.size,
      mime_type: mime,
      file_url: null,
    })
  }

  if (fileInserts.length > 0) {
    const { error: filesError } = await supabase
      .from('resource_files')
      .insert(fileInserts)
    if (filesError) {
      console.error('resource_files insert error:', filesError)
      // Don't fail — resource was created, files just didn't save to new table
    }
  }

  return NextResponse.json({
    message: `"${title}" uploaded successfully with ${fileInserts.length} file(s)${linkUrl ? ' and link' : ''}!`,
    resource,
  })
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
  // resource_files will cascade delete automatically
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}