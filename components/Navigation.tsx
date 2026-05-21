'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/resources', label: 'Resources' },
  { href: '/experience', label: 'Experience' },
  { href: '/contact', label: 'Contact' },
]

const adminLink = { href: '/admin', label: 'Admin' }

function getAdminCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith('admin_session='))
}

export default function Navigation() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Check admin cookie on mount and whenever pathname changes
  // (pathname change catches the moment after login redirect)
  useEffect(() => {
    setIsAdmin(getAdminCookie())
  }, [pathname])

  const navLinks = isAdmin ? [...publicLinks, adminLink] : publicLinks

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(200,190,170,0.08)' : 'none',
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #C8955C, #B07840)',
              fontFamily: 'Cormorant Garamond, serif',
              color: 'white',
            }}
          >
            P
          </div>
          <span
            className="text-lg font-light tracking-wide"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
          >
            Portfolio
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg"
                  style={{
                    color: isActive ? '#C8955C' : '#8A8478',
                    background: isActive ? 'rgba(200,149,92,0.08)' : 'transparent',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#C8955C' }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: '#F5F0E8' }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-1"
          style={{ background: 'rgba(10,10,15,0.97)' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm"
              style={{
                color: pathname === link.href ? '#C8955C' : '#8A8478',
                background: pathname === link.href ? 'rgba(200,149,92,0.08)' : 'transparent',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}