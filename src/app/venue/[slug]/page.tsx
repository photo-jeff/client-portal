import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Download } from 'lucide-react'

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function PublicVenuePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('ceremony_time, ceremony_venue, partner1_name, partner2_name')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const arrivalTime = client.ceremony_time
    ? formatTime(addMinutes(client.ceremony_time, -150))
    : null

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/JOP Logo.svg" alt="Jeff Oliver Photography" className="h-8 w-auto mx-auto mb-8" />
          <p className="font-display text-[0.6rem] tracking-[0.2em] uppercase text-[#919295] mb-3">
            Photographer Information
          </p>
          <h1 className="font-serif text-3xl mb-2">
            {client.partner1_name} &amp; {client.partner2_name}
          </h1>
          {client.ceremony_venue && (
            <p className="text-sm text-[#919295] mt-2">{client.ceremony_venue}</p>
          )}
          <div className="w-16 h-px bg-[#C9A96E] mx-auto mt-6" />
        </div>

        <div className="space-y-8">

          {/* Photographer details */}
          <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
            <h2 className="font-serif text-2xl mb-6">Photographer Details</h2>
            <dl className="divide-y divide-[#f0ede8] text-sm">
              <div className="py-3 flex gap-8">
                <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Studio</dt>
                <dd>Jeff Oliver Photography</dd>
              </div>
              <div className="py-3 flex gap-8">
                <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Photographers</dt>
                <dd>Jeff &amp; Sarah Oliver</dd>
              </div>
              <div className="py-3 flex gap-8">
                <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Vehicle registration</dt>
                <dd className="font-mono tracking-wider">LV73WJO</dd>
              </div>
              <div className="py-3 flex gap-8">
                <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Arrival on site</dt>
                <dd>
                  {arrivalTime
                    ? <>{arrivalTime} <span className="text-[#b5b8ba]">(2½ hours before ceremony)</span></>
                    : <span className="text-[#b5b8ba]">2½ hours before ceremony start</span>}
                </dd>
              </div>
              <div className="py-3 flex gap-8">
                <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Dietary requirements</dt>
                <dd>None</dd>
              </div>
            </dl>
          </section>

          {/* Insurance documents */}
          <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
            <h2 className="font-serif text-2xl mb-4">Insurance Documents</h2>
            <p className="text-sm text-[#919295] mb-6 leading-relaxed">
              Download and forward these directly to your coordinator if required.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Professional Indemnity Certificate', file: 'DC501 - PI certificate.pdf' },
                { label: 'Public Liability Certificate', file: 'DC502 - PL certificate.pdf' },
                { label: 'Employers Liability Certificate', file: 'DC503 - EL certificate.pdf' },
                { label: 'Drone Certificate', file: 'Drone Certificate.pdf' },
                { label: 'Drone Schedule', file: 'Drone Schedule.pdf' },
              ].map(doc => (
                <a
                  key={doc.file}
                  href={`/insurance/${doc.file}`}
                  download
                  className="flex items-center justify-between py-3 px-4 border border-[#e0ddd8] hover:border-[#535353] transition-colors group rounded-lg"
                >
                  <span className="text-sm">{doc.label}</span>
                  <Download size={14} className="text-[#c2c5c8] group-hover:text-[#535353] transition-colors" />
                </a>
              ))}
            </div>
          </section>

        </div>

        <p className="text-center text-xs text-[#b5b8ba] mt-10">
          Questions?{' '}
          <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#535353]">
            hello@jeffoliverphotography.com
          </a>
        </p>

      </div>
    </div>
  )
}
