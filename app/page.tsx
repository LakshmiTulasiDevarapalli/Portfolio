import Link from 'next/link'
import { ArrowRight, BookOpen, Briefcase, Mail, Lock } from 'lucide-react'

export default function HomePage() {
  const cards = [
    {
      icon: BookOpen,
      title: 'Resources',
      description: 'Curated documents, guides, and tools. Request access to download.',
      href: '/resources',
      delay: '0.1s',
    },
    {
      icon: Briefcase,
      title: 'Experience',
      description: 'Professional journey, skills, and notable projects.',
      href: '/experience',
      delay: '0.2s',
    },
    {
      icon: Mail,
      title: 'Contact',
      description: 'Get in touch for collaborations, opportunities, or conversations.',
      href: '/contact',
      delay: '0.3s',
    },
    {
      icon: Lock,
      title: 'Admin',
      description: 'Manage resources, review access requests, and upload new files.',
      href: '/admin',
      delay: '0.4s',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,149,92,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(200,190,170,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,190,170,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 mb-8 animate-fade-up"
          style={{ animationDelay: '0s' }}
        >
          <span className="w-8 h-px" style={{ background: '#C8955C' }} />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}
          >
            Professional Portfolio
          </span>
          <span className="w-8 h-px" style={{ background: '#C8955C' }} />
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-light leading-none mb-6 animate-fade-up"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: '#F5F0E8',
            animationDelay: '0.1s',
          }}
        >
          Knowledge
          <br />
          <em style={{ color: '#C8955C' }}>crafted</em> &amp; shared
        </h1>

        <p
          className="text-base md:text-lg max-w-xl mx-auto mb-16 animate-fade-up"
          style={{ color: '#8A8478', animationDelay: '0.2s', lineHeight: 1.8 }}
        >
          A curated space of professional resources, insights, and experience.
          Browse freely — request access to download protected materials.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {cards.map(({ icon: Icon, title, description, href, delay }) => (
            <Link
              key={href}
              href={href}
              className="group glass rounded-2xl p-6 transition-all duration-300 hover:border-amber-600/30 animate-fade-up"
              style={{ animationDelay: delay }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C' }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-lg font-medium"
                      style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
                    >
                      {title}
                    </h3>
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: '#C8955C' }}
                    />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8A8478' }}>
                    {description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
