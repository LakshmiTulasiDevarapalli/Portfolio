import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyToken } from '../admin-login/route'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { request_id, action } = await req.json()
  if (!request_id || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch access request + resource (no file_data needed)
  const { data: accessRequest, error } = await supabase
    .from('access_requests')
    .select('*, resources(id, title, file_type)')
    .eq('id', request_id)
    .single()

  if (error || !accessRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const resource = (accessRequest as any).resources

  // ── Reject ────────────────────────────────────────────────
  if (action === 'rejected') {
    await supabase
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id)

    try {
      const transporter = createTransporter()
      await transporter.sendMail({
        from:    `"Portfolio" <${process.env.SMTP_USER}>`,
        to:      accessRequest.requester_email,
        subject: `Update on your access request`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0A0A0F;color:#F5F0E8;padding:40px;border-radius:16px;">
            <h2 style="font-weight:300;">Access Request Update</h2>
            <p style="color:#8A8478;">Hi ${accessRequest.requester_name},</p>
            <p style="color:#8A8478;">Your request for <strong style="color:#F5F0E8;">${resource?.title}</strong> was not approved at this time.</p>
            <p style="color:#8A8478;">Feel free to reach out directly for more information.</p>
          </div>
        `,
      })
    } catch (e) { console.error('Rejection email failed:', e) }

    return NextResponse.json({ message: 'Request rejected' })
  }

  // ── Approve ───────────────────────────────────────────────
  const downloadToken = crypto.randomBytes(32).toString('hex')
  const expiresAt     = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('access_requests')
    .update({
      status:           'approved',
      download_token:   downloadToken,
      token_expires_at: expiresAt,
    })
    .eq('id', request_id)

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const downloadUrl = `${appUrl}/api/download?token=${downloadToken}`

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from:    `"Portfolio" <${process.env.SMTP_USER}>`,
      to:      accessRequest.requester_email,
      subject: `✅ Access Approved: ${resource?.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#F5F0E8;padding:40px;border-radius:16px;border:1px solid rgba(200,149,92,0.2);">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:48px;">✅</div>
            <h1 style="font-weight:300;margin:16px 0 4px;">Access Approved!</h1>
            <p style="color:#8A8478;margin:0;">Your download is ready</p>
          </div>
          <div style="background:rgba(200,149,92,0.08);border:1px solid rgba(200,149,92,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#8A8478;margin:0 0 4px;font-size:12px;">RESOURCE</p>
            <p style="color:#F5F0E8;font-size:18px;margin:0;font-weight:500;">${resource?.title}</p>
            <p style="color:#8A8478;font-size:13px;margin:4px 0 0;">${resource?.file_type?.toUpperCase()}</p>
          </div>
          <p style="color:#8A8478;">
            Hi <strong style="color:#F5F0E8;">${accessRequest.requester_name}</strong>,
            click the button below to download your file.
            This link expires in <strong style="color:#C8955C;">72 hours</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#C8955C,#B07840);color:white;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:500;">
              ⬇ Download Now
            </a>
          </div>
          <p style="color:#8A8478;font-size:12px;word-break:break-all;">
            Or copy: <a href="${downloadUrl}" style="color:#C8955C;">${downloadUrl}</a>
          </p>
          <p style="color:#8A8478;font-size:12px;">Expires: ${new Date(expiresAt).toLocaleString()}</p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Approval email failed:', emailErr)
    return NextResponse.json({ error: 'Approved but email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Approved and email sent', download_url: downloadUrl })
}
