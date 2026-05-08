import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
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
  } catch (err) {
    console.error('Extract error:', err)
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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { resource_id } = await req.json()
  if (!resource_id) return NextResponse.json({ error: 'resource_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: resource, error } = await supabase
    .from('resources')
    .select('id, title, description, file_type, file_data')
    .eq('id', resource_id).single()

  if (error || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

  let synopsis = ''
  if (resource.file_type === 'link') {
    synopsis = resource.description || ''
  } else if (resource.file_data) {
    const buffer = Buffer.from(resource.file_data, 'base64')
    const rawText = await extractText(buffer, resource.file_type)
    synopsis = buildPreview(rawText, 600)
  }

  if (!synopsis) synopsis = resource.description || ''

  const { error: updateError } = await supabase
    .from('resources')
    .update({ synopsis, synopsis_generated: true })
    .eq('id', resource_id)

  if (updateError) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json({ synopsis })
}