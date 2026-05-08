import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import nodemailer from 'nodemailer'

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
  const { resource_id, name, email, location, reason } = await req.json()

  if (!resource_id || !name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch the resource (no file_data needed here)
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('id, title, file_type')
    .eq('id', resource_id)
    .eq('is_active', true)
    .single()

  if (resourceError || !resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  // Check for duplicate pending/approved request
  const { data: existing } = await supabase
    .from('access_requests')
    .select('id, status')
    .eq('resource_id', resource_id)
    .eq('requester_email', email)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    if (existing.status === 'approved') {
      return NextResponse.json(
        { error: 'You already have approved access. Check your email for the download link.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'You already have a pending request for this resource.' },
      { status: 409 }
    )
  }

  // Create access request
  const { data: request, error: insertError } = await supabase
    .from('access_requests')
    .insert({
      resource_id,
      requester_name:     name,
      requester_email:    email,
      requester_location: location || '',
      requester_reason:   reason || '',
      status:             'pending',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }

  // Send email alert to owner
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from:    `"Portfolio" <${process.env.SMTP_USER}>`,
      to:      ownerEmail,
      subject: `📥 New Download Request: ${resource.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#F5F0E8;padding:40px;border-radius:16px;border:1px solid rgba(200,149,92,0.2);">
          <h2 style="color:#C8955C;font-weight:300;margin-bottom:24px;">New Access Request</h2>
          <div style="background:rgba(200,149,92,0.08);border:1px solid rgba(200,149,92,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="color:#8A8478;margin:0 0 4px;font-size:12px;">RESOURCE</p>
            <p style="color:#F5F0E8;font-size:18px;margin:0;">${resource.title}</p>
            <p style="color:#8A8478;font-size:13px;margin:4px 0 0;">${resource.file_type.toUpperCase()}</p>
          </div>
          <p style="color:#8A8478;margin:4px 0;"><strong style="color:#F5F0E8;">Name:</strong> ${name}</p>
          <p style="color:#8A8478;margin:4px 0;"><strong style="color:#F5F0E8;">Email:</strong> ${email}</p>
          ${location ? `<p style="color:#8A8478;margin:4px 0;"><strong style="color:#F5F0E8;">Location:</strong> ${location}</p>` : ''}
          ${reason ? `<p style="color:#8A8478;margin:12px 0 0;"><strong style="color:#F5F0E8;">Reason:</strong> <em>"${reason}"</em></p>` : ''}
          <div style="text-align:center;margin-top:32px;">
            <a href="${appUrl}/admin/dashboard" style="background:linear-gradient(135deg,#C8955C,#B07840);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:500;">
              Review in Dashboard →
            </a>
          </div>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Alert email failed:', emailErr)
    // Don't fail — request is saved, email is optional
  }

  return NextResponse.json({ message: 'Request submitted successfully', request_id: request.id })
}