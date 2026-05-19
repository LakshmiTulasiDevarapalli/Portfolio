'use client'
import { useState } from 'react'
import { Mail, Phone, Send, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CONTACT_INFO = {
  email: 'evettequadros@gmail.com',
  phone: '518-421-2324',
  availability: 'Open to opportunities',
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      return toast.error('Please fill all required fields')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSubmitted(true)
      toast.success('Message sent successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-16 animate-fade-up">
        <span
          className="text-xs uppercase tracking-[0.25em] mb-3 block"
          style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}
        >
          Get In Touch
        </span>
        <h1
          className="text-4xl md:text-6xl font-light"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
        >
          Let's Talk
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left — Info */}
        <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-base leading-relaxed" style={{ color: '#8A8478' }}>
            Whether you're interested in collaborating, have a project in mind, or simply want
            to connect — I'd love to hear from you. I typically respond within 24 hours.
          </p>

          {/* Availability badge */}
          <div
            className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(92,200,123,0.08)', border: '1px solid rgba(92,200,123,0.2)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5CC87B' }} />
            <span className="text-sm" style={{ color: '#5CC87B' }}>
              {CONTACT_INFO.availability}
            </span>
          </div>

          {/* Contact details */}
          <div className="space-y-4">
            <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-4 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}
              >
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#8A8478' }}>Email</p>
                <p className="text-sm group-hover:text-amber-400 transition-colors" style={{ color: '#F5F0E8' }}>
                  {CONTACT_INFO.email}
                </p>
              </div>
            </a>

            <a href={`tel:${CONTACT_INFO.phone}`} className="flex items-center gap-4 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}
              >
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#8A8478' }}>Phone</p>
                <p className="text-sm group-hover:text-amber-400 transition-colors" style={{ color: '#F5F0E8' }}>
                  {CONTACT_INFO.phone}
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Right — Form */}
        <div className="glass rounded-2xl p-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <CheckCircle size={48} className="mb-4" style={{ color: '#5CC87B' }} />
              <h3 className="text-2xl font-light mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
                Message received!
              </h3>
              <p className="text-sm" style={{ color: '#8A8478' }}>I'll get back to you shortly.</p>
              <button
                className="btn-ghost mt-6"
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
                Send a Message
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                    Name <span style={{ color: '#C8955C' }}>*</span>
                  </label>
                  <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                    Email <span style={{ color: '#C8955C' }}>*</span>
                  </label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Subject</label>
                <input className="input" placeholder="What's this about?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                  Message <span style={{ color: '#C8955C' }}>*</span>
                </label>
                <textarea className="input resize-none" rows={5} placeholder="Tell me more..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>

              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}