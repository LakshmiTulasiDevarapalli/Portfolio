'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid credentials')
      // Store session token in sessionStorage
      sessionStorage.setItem('admin_token', data.token)
      toast.success('Welcome back!')
      router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(200,149,92,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(200,149,92,0.12)', border: '1px solid rgba(200,149,92,0.2)' }}
          >
            <Lock size={28} style={{ color: '#C8955C' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1
            className="text-3xl font-light mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
          >
            Admin Access
          </h1>
          <p className="text-sm" style={{ color: '#8A8478' }}>
            Enter your credentials to manage resources
          </p>
        </div>

        <div
          className="glass rounded-2xl p-8"
          style={{ border: '1px solid rgba(200,149,92,0.15)' }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                Email Address
              </label>
              <input
                className="input"
                type="email"
                placeholder="admin@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                Password
              </label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#8A8478' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full justify-center py-3 rounded-lg font-medium text-sm transition-all duration-200"
              style={{
                background: loading ? 'rgba(200,149,92,0.5)' : '#C8955C',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8A8478' }}>
          Credentials are set via environment variables
        </p>
      </div>
    </div>
  )
}