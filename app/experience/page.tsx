'use client'
import { useState } from 'react'
import { Briefcase, Code2, Award, ExternalLink, ChevronDown } from 'lucide-react'

// ── EDIT THESE TO MATCH YOUR REAL EXPERIENCE ──────────────────
const EXPERIENCE = [
  {
    company: 'Tech Innovations Inc.',
    role: 'Senior Software Engineer',
    period: '2022 — Present',
    location: 'San Francisco, CA (Remote)',
    description:
      'Leading frontend architecture for a SaaS platform serving 200K+ users. Championed migration from legacy CRA to Next.js, cutting load times by 60%.',
    highlights: ['Next.js', 'TypeScript', 'Team Lead', 'System Design'],
  },
  {
    company: 'DataFlow Systems',
    role: 'Full Stack Developer',
    period: '2020 — 2022',
    location: 'New York, NY',
    description:
      'Built end-to-end data pipelines and interactive dashboards for enterprise clients in fintech. Managed cross-functional teams and stakeholder communications.',
    highlights: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
  },
  {
    company: 'Creative Studio Co.',
    role: 'Frontend Developer',
    period: '2018 — 2020',
    location: 'Austin, TX',
    description:
      'Developed high-performance marketing websites and interactive experiences for global brands including consumer goods and entertainment.',
    highlights: ['Vue.js', 'GSAP', 'WebGL', 'Figma'],
  },
]

const SKILLS = [
  { category: 'Frontend', items: ['React / Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'WebGL / Three.js'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'GraphQL', 'REST APIs', 'Supabase / PostgreSQL'] },
  { category: 'DevOps & Cloud', items: ['AWS', 'Docker', 'CI/CD', 'Vercel', 'Terraform'] },
  { category: 'Design & Tools', items: ['Figma', 'Adobe XD', 'Git', 'Jira', 'Linear'] },
]

const EDUCATION = [
  {
    institution: 'University of California, Berkeley',
    degree: 'B.S. Computer Science',
    year: '2018',
  },
]

const CERTIFICATIONS = [
  { name: 'AWS Solutions Architect – Associate', issuer: 'Amazon Web Services', year: '2023' },
  { name: 'Google Cloud Professional Developer', issuer: 'Google', year: '2022' },
]
// ──────────────────────────────────────────────────────────────

function SkillBar({ label, level }: { label: string; level: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 flex-shrink-0" style={{ color: '#F5F0E8' }}>
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(200,190,170,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${level}%`,
            background: 'linear-gradient(90deg, #C8955C, #E8B98A)',
          }}
        />
      </div>
      <span
        className="text-xs w-8 text-right"
        style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}
      >
        {level}%
      </span>
    </div>
  )
}

export default function ExperiencePage() {
  const [openJob, setOpenJob] = useState<number | null>(0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-16 animate-fade-up">
        <span
          className="text-xs uppercase tracking-[0.25em] mb-3 block"
          style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}
        >
          Professional Background
        </span>
        <h1
          className="text-4xl md:text-6xl font-light"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
        >
          Experience &amp; Skills
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left — Experience timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase size={18} style={{ color: '#C8955C' }} />
            <h2
              className="text-xl font-light"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
            >
              Work History
            </h2>
          </div>

          {EXPERIENCE.map((job, i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden animate-fade-up cursor-pointer"
              style={{ animationDelay: `${0.1 * i}s` }}
              onClick={() => setOpenJob(openJob === i ? null : i)}
            >
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="text-lg font-medium"
                      style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
                    >
                      {job.role}
                    </h3>
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#C8955C' }}>
                    {job.company}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}
                  >
                    {job.period} · {job.location}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className="transition-transform flex-shrink-0 mt-1"
                  style={{
                    color: '#8A8478',
                    transform: openJob === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </div>

              {openJob === i && (
                <div
                  className="px-6 pb-6 border-t"
                  style={{ borderColor: 'rgba(200,190,170,0.08)' }}
                >
                  <p className="text-sm leading-relaxed mt-4 mb-4" style={{ color: '#8A8478' }}>
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.highlights.map((h) => (
                      <span key={h} className="tag">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right sidebar — Skills, Education, Certs */}
        <div className="space-y-8">
          {/* Skills */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Code2 size={18} style={{ color: '#C8955C' }} />
              <h2
                className="text-xl font-light"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
              >
                Skills
              </h2>
            </div>
            <div className="space-y-6">
              {SKILLS.map((group) => (
                <div key={group.category}>
                  <p
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}
                  >
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="text-xs px-3 py-1 rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(200,190,170,0.1)',
                          color: '#F5F0E8',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Award size={18} style={{ color: '#C8955C' }} />
              <h2
                className="text-xl font-light"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}
              >
                Education
              </h2>
            </div>
            {EDUCATION.map((edu, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>
                  {edu.degree}
                </p>
                <p className="text-xs mt-1" style={{ color: '#C8955C' }}>
                  {edu.institution}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}
                >
                  {edu.year}
                </p>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <h3
              className="text-sm uppercase tracking-widest mb-4"
              style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}
            >
              Certifications
            </h3>
            <div className="space-y-3">
              {CERTIFICATIONS.map((cert, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(200,149,92,0.06)', border: '1px solid rgba(200,149,92,0.15)' }}
                >
                  <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>
                    {cert.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#8A8478' }}>
                    {cert.issuer} · {cert.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
