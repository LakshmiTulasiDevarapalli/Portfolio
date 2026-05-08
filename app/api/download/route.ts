import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return htmlResponse('Missing Token', 'No download token was provided.', 400)
  }

  const supabase = createAdminClient()

  // Fetch the access request + full resource (including file_data)
  const { data: accessRequest, error } = await supabase
    .from('access_requests')
    .select(`
      *,
      resources (
        id, title, file_type, file_name, file_data, mime_type, file_url, is_active
      )
    `)
    .eq('download_token', token)
    .eq('status', 'approved')
    .single()

  if (error || !accessRequest) {
    return htmlResponse(
      'Invalid Link',
      'This download link is invalid or does not exist.',
      404
    )
  }

  // Check token expiry
  if (accessRequest.token_expires_at && new Date(accessRequest.token_expires_at) < new Date()) {
    return htmlResponse(
      'Link Expired',
      'This download link has expired (valid for 72 hours). Please request access again.',
      410,
      '/resources'
    )
  }

  const resource = (accessRequest as any).resources

  if (!resource || !resource.is_active) {
    return htmlResponse('Resource Unavailable', 'This resource is no longer available.', 404)
  }

  // ── External link — redirect directly ────────────────────
  if (resource.file_type === 'link') {
    return NextResponse.redirect(resource.file_url)
  }

  // ── File — decode base64 and stream as download ───────────
  if (!resource.file_data) {
    return htmlResponse('File Not Found', 'The file data could not be found.', 404)
  }

  const fileBuffer = Buffer.from(resource.file_data, 'base64')
  const fileName   = resource.file_name || `${resource.title}.${resource.file_type}`
  const mimeType   = resource.mime_type || 'application/octet-stream'

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type':        mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length':      fileBuffer.length.toString(),
      'Cache-Control':       'no-store',
    },
  })
}

function htmlResponse(
  title: string,
  message: string,
  status: number,
  backLink = '/resources'
) {
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
    <head><title>${title}</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:80px 20px;background:#0A0A0F;color:#F5F0E8;">
      <div style="font-size:48px;margin-bottom:16px;">${status === 410 ? '⏰' : status === 404 ? '❌' : '⚠️'}</div>
      <h2 style="font-weight:300;margin-bottom:8px;">${title}</h2>
      <p style="color:#8A8478;margin-bottom:32px;">${message}</p>
      <a href="${backLink}" style="color:#C8955C;text-decoration:none;border:1px solid rgba(200,149,92,0.3);padding:10px 24px;border-radius:8px;">
        ← Back to Resources
      </a>
    </body>
    </html>`,
    { status, headers: { 'Content-Type': 'text/html' } }
  )
}
