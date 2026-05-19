import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to: 'evettequadros@gmail.com',
      replyTo: email,
      subject: subject ? `Contact Form: ${subject}` : `New message from ${name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0E0E16; color: #F5F0E8; padding: 40px; border-radius: 12px;">
          <h2 style="color: #C8955C; font-weight: 300; margin-bottom: 24px; border-bottom: 1px solid rgba(200,149,92,0.2); padding-bottom: 16px;">
            New Contact Form Message
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #8A8478; font-size: 12px; width: 80px;">NAME</td>
              <td style="padding: 10px 0; color: #F5F0E8;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #8A8478; font-size: 12px;">EMAIL</td>
              <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #C8955C;">${email}</a></td>
            </tr>
            ${subject ? `
            <tr>
              <td style="padding: 10px 0; color: #8A8478; font-size: 12px;">SUBJECT</td>
              <td style="padding: 10px 0; color: #F5F0E8;">${subject}</td>
            </tr>` : ''}
          </table>

          <div style="margin-top: 24px; padding: 20px; background: rgba(200,149,92,0.06); border: 1px solid rgba(200,149,92,0.15); border-radius: 8px;">
            <p style="color: #8A8478; font-size: 12px; margin: 0 0 8px;">MESSAGE</p>
            <p style="color: #C8BFB5; line-height: 1.8; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="margin-top: 24px; color: #8A8478; font-size: 12px;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'Email sent successfully' })
  } catch (err: any) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}