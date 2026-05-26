'use client'
import { Award, BookOpen, Mic, GraduationCap, BadgeCheck, Star, Trophy, ExternalLink } from 'lucide-react'

const SKILLS = [
  { category: 'Executive Competencies', items: ['Enterprise Clinical Operations', 'Multi-Facility Governance', 'Regulatory Compliance (CMS/Multi-State)', 'QAPI & Risk Reduction', 'Operational Transformation'] },
  { category: 'Clinical Expertise', items: ['Survey Readiness', 'Infection Prevention', 'Patient Safety', 'Wound & Ostomy Care', 'Ventilator/Trach Units'] },
  { category: 'Technology & Innovation', items: ['EHR Optimization', 'AI-Enabled Workflows', 'Remote Patient Monitoring', 'Chronic Care Management', 'Healthcare IT'] },
  { category: 'Leadership', items: ['Clinical Workforce Development', 'Policy & Protocol Writing', 'Stakeholder Communications', 'Executive Presentations', 'Advisory Board Participation'] },
]

const EDUCATION = [
  { institution: 'Maharashtra University of Health Science, India', degree: 'MS Nursing', year: '2013' },
  { institution: 'Sikkim Manipal University, India', degree: 'MBA, Health Care Services', year: '2012' },
  { institution: 'SNDT University, India', degree: 'BSN Nursing', year: '2009' },
]

const CERTIFICATIONS = [
  { name: 'Licensed Nursing Home Administrator (LNHA)', issuer: 'District of Columbia' },
  { name: 'Registered Nurse (Compact License)', issuer: 'Maryland, DC' },
  { name: 'Director of Nursing Services Certified (DNS-CT)', issuer: '' },
  { name: 'Quality Assurance Process Improvement Certified (QCP)', issuer: '' },
  { name: 'Infection Control Preventionist Certified (ICP)', issuer: '' },
  { name: 'Skin Wound Ostomy Certified (SWOC)', issuer: '' },
]

const AWARDS = [
  {
    name: "President's Award",
    issuer: 'Institute of Post-Acute Care (InsPAC)',
    year: 'May 2024',
    detail: "National recognition for exceptional leadership, innovation, and contributions to post-acute and long-term care. Recognized by the Office of the Governor, Commonwealth of Virginia, in a personal letter signed by Governor Glenn Youngkin.",
  },
  {
    name: 'Outstanding Healthcare Professionals Award',
    issuer: 'Continuum Healthcare Network',
    year: 'COVID-19 Era',
    detail: 'Awarded for exceptional infection control leadership; protocols developed resulted in zero infection control citations during multiple CMS surveys throughout the pandemic period.',
  },
]

const SPEAKING = [
  { text: 'Invited Speaker, LifeSpan Annual Conference & Expo', meta: 'Ocean City, MD · 2023' },
  { text: 'Advisory Board Participant', meta: 'Institute of Post-Acute Care (InsPAC)' },
  { text: 'Invited Judge, University of Maryland School of Nursing (UMSON)', meta: 'Spring 2026 Poster Day' },
  { text: 'Honorary Clinical Instructor & Preceptor, Walden University', meta: 'September 2023' },
  { text: 'Advisory Board Member, Clearpol Inc.', meta: 'Healthcare AI compliance platform · August 2023' },
  { text: 'Subject Matter Expert & Advisor, Compli Health', meta: 'compli.health' },
  { text: 'Subject Matter Expert & Advisor, Aidar Health', meta: 'MouthLab RPM platform' },
  { text: 'Subject Matter Expert & Advisor, Predictiv Care', meta: 'Mountain View, CA' },
]

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C' }}>
        <Icon size={15} />
      </div>
      <h2 className="text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>{title}</h2>
      <div className="flex-1 h-px ml-2" style={{ background: 'rgba(200,190,170,0.08)' }} />
    </div>
  )
}

export default function ExperiencePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">

      {/* ── Page Header ── */}
      <div className="mb-14 animate-fade-up">
        <span className="text-xs uppercase tracking-[0.25em] mb-3 block"
          style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
          Professional Background
        </span>
        <h1 className="text-4xl md:text-6xl font-light mb-4"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
          Experience &amp; Skills
        </h1>
        <p className="text-sm max-w-xl" style={{ color: '#8A8478', lineHeight: 1.8 }}>
          Two decades of clinical and operational leadership across post-acute care — from bedside practice to enterprise governance.
        </p>
      </div>

      {/* ── Skills ── */}
      <section className="mb-14 animate-fade-up">
        <SectionHeader icon={BookOpen} title="Core Competencies & Skills" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SKILLS.map((group) => (
            <div key={group.category} className="glass rounded-2xl p-5"
              style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
              <p className="text-xs uppercase tracking-widest mb-4"
                style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
                {group.category}
              </p>
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'rgba(200,149,92,0.6)' }} />
                    <span className="text-xs leading-relaxed" style={{ color: '#C8BFB5' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Awards ── */}
      <section className="mb-14 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <SectionHeader icon={Award} title="Awards & Recognition" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {AWARDS.map((award, i) => (
            <div key={i} className="glass rounded-2xl p-6 flex flex-col gap-4"
              style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
              {/* Top row */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C' }}>
                  <Trophy size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-medium leading-snug"
                      style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
                      {award.name}
                    </p>
                    <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded whitespace-nowrap"
                      style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
                      {award.year}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#C8955C' }}>{award.issuer}</p>
                </div>
              </div>
              {/* Divider */}
              <div className="h-px" style={{ background: 'rgba(200,190,170,0.07)' }} />
              {/* Detail */}
              <p className="text-sm leading-relaxed" style={{ color: '#8A8478', lineHeight: 1.8 }}>
                {award.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Speaking & Advisory ── */}
      <section className="mb-14 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <SectionHeader icon={Mic} title="Speaking & Advisory" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPEAKING.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}>
                <Star size={10} />
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-snug" style={{ color: '#C8BFB5' }}>{item.text}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{item.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Education + Certifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-up" style={{ animationDelay: '0.15s' }}>

        {/* Education */}
        <section>
          <SectionHeader icon={GraduationCap} title="Education" />
          <div className="space-y-3">
            {EDUCATION.map((edu, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}>
                  <GraduationCap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm" style={{ color: '#C8BFB5' }}>{edu.degree}</p>
                    <span className="text-xs flex-shrink-0"
                      style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{edu.year}</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8A8478' }}>{edu.institution}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section>
          <SectionHeader icon={BadgeCheck} title="Licenses & Certifications" />
          <div className="space-y-2.5">
            {CERTIFICATIONS.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,190,170,0.08)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}>
                  <BadgeCheck size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug" style={{ color: '#C8BFB5' }}>{cert.name}</p>
                  {cert.issuer && (
                    <p className="text-xs mt-0.5" style={{ color: '#8A8478' }}>{cert.issuer}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}