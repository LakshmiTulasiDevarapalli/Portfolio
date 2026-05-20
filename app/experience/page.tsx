'use client'
import { Award, BookOpen, Mic, GraduationCap, BadgeCheck, Star } from 'lucide-react'

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
  'Invited Speaker, LifeSpan Annual Conference & Expo (Ocean City, MD), 2023',
  'Advisory Board Participant, Institute of Post-Acute Care (InsPAC)',
  'Invited Judge, University of Maryland School of Nursing (UMSON) — Spring 2026 Poster Day',
  'Honorary Clinical Instructor & Preceptor, Walden University (September 2023)',
  'Advisory Board Member, Clearpol Inc. — healthcare AI compliance platform (August 2023)',
  'Subject Matter Expert & Advisor, Compli Health (compli.health)',
  'Subject Matter Expert & Advisor, Aidar Health — MouthLab RPM platform',
  'Subject Matter Expert & Advisor, Predictiv Care (Mountain View, CA)',
]

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C' }}>
        <Icon size={16} />
      </div>
      <h2 className="text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>{title}</h2>
    </div>
  )
}

export default function ExperiencePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-16 animate-fade-up">
        <span className="text-xs uppercase tracking-[0.25em] mb-3 block" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>
          Professional Background
        </span>
        <h1 className="text-4xl md:text-6xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>
          Experience &amp; Skills
        </h1>
      </div>

      {/* ── Row 1: Skills (full width) ── */}
      <section className="mb-12 animate-fade-up">
        <SectionHeader icon={BookOpen} title="Core Competencies & Skills" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SKILLS.map((group) => (
            <div key={group.category} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>{group.category}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#C8955C' }} />
                    <span className="text-xs leading-relaxed" style={{ color: '#C8BFB5' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Row 2: Awards + Speaking ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Awards */}
        <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={Award} title="Awards & Recognition" />
          <div className="space-y-4">
            {AWARDS.map((award, i) => (
              <div key={i} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-base font-medium" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8' }}>{award.name}</p>
                  <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded" style={{ background: 'rgba(200,149,92,0.12)', color: '#C8955C', fontFamily: 'DM Mono, monospace' }}>{award.year}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#C8955C' }}>{award.issuer}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8478', lineHeight: 1.75 }}>{award.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Speaking & Advisory */}
        <section className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <SectionHeader icon={Mic} title="Speaking & Advisory" />
          <div className="glass rounded-2xl p-5 h-fit" style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
            <div className="space-y-3">
              {SPEAKING.map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'rgba(200,190,170,0.07)' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}>
                    <Star size={10} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8A8478' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Row 3: Education + Certifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Education */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <SectionHeader icon={GraduationCap} title="Education" />
          <div className="space-y-3">
            {EDUCATION.map((edu, i) => (
              <div key={i} className="glass rounded-2xl p-5 flex items-start gap-4" style={{ border: '1px solid rgba(200,190,170,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,149,92,0.1)', color: '#C8955C' }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{edu.degree}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#C8955C' }}>{edu.institution}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A8478', fontFamily: 'DM Mono, monospace' }}>{edu.year}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <SectionHeader icon={BadgeCheck} title="Licenses & Certifications" />
          <div className="grid grid-cols-1 gap-3">
            {CERTIFICATIONS.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(200,149,92,0.06)', border: '1px solid rgba(200,149,92,0.15)' }}>
                <BadgeCheck size={16} style={{ color: '#C8955C', flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{cert.name}</p>
                  {cert.issuer && <p className="text-xs mt-0.5" style={{ color: '#8A8478' }}>{cert.issuer}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}