import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'

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

export default async function VenueInfoPage({
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

  // Arrival = ceremony time minus 2.5 hours (150 minutes)
  const arrivalTime = client.ceremony_time
    ? formatTime(addMinutes(client.ceremony_time, -150))
    : null

  const dressBy = client.ceremony_time
    ? formatTime(addMinutes(client.ceremony_time, -90))
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">For Your Venue</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">
          Everything your venue coordinator needs to know about us — feel free to forward this or copy the details.
        </p>
      </div>

      <div className="space-y-8">

        {/* Photographer details */}
        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-6">Photographer Details</h2>
          <dl className="divide-y divide-[#f0ede8] text-sm">
            <div className="py-3 flex gap-8">
              <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Studio</dt>
              <dd>Jeff Oliver Photography</dd>
            </div>
            <div className="py-3 flex gap-8">
              <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Lead photographer</dt>
              <dd>Jeff Oliver</dd>
            </div>
            <div className="py-3 flex gap-8">
              <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] w-40 shrink-0 pt-0.5">Co-photographer</dt>
              <dd>Sarah</dd>
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

        {/* Bridal prep notes */}
        <section className="bg-white border border-[#e0ddd8] p-8 space-y-5">
          <h2 className="font-serif text-2xl">Bridal Preparations</h2>
          <p className="text-sm text-[#919295] leading-relaxed">
            We arrive two hours before {client.partner1_name} leaves for the ceremony. The first hour is for detail shots — the dress, shoes, rings, jewellery — alongside natural getting-ready moments. We need {client.partner1_name} in her dress one hour before leaving, which gives us time for bridal portraits and photos with the bridesmaids.
          </p>
          {arrivalTime && dressBy && (
            <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-1">We arrive</p>
                <p className="font-serif text-2xl">{arrivalTime}</p>
              </div>
              <div>
                <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-1">{client.partner1_name} in dress by</p>
                <p className="font-serif text-2xl">{dressBy}</p>
              </div>
            </div>
          )}
          <div className="border-t border-[#f0ede8] pt-5">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-3">A few things that help on the morning</h3>
            <ul className="space-y-2 text-sm text-[#919295]">
              {[
                'A tidy room and natural light from a window makes a big difference — please clear a little space if you can.',
                "Please ask the bride not to put on any jewellery or perfume until we arrive — we love photographing that fresh first moment.",
                'Gather all the detail items in one place: shoes, rings, garter, perfume, invitations.',
                'Avoid tight-fitting clothes on the morning — especially important if the dress is backless.',
                'Professional hair and makeup photographs beautifully and keeps the morning running to time.',
              ].map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#ccc] shrink-0 mt-0.5">—</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Insurance documents */}
        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Insurance Documents</h2>
          <p className="text-sm text-[#919295] mb-6 leading-relaxed">
            Some venues ask for our insurance certificates in advance. Download and forward these directly to your coordinator.
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
                className="flex items-center justify-between py-3 px-4 border border-[#e0ddd8] hover:border-[#535353] transition-colors group"
              >
                <span className="text-sm">{doc.label}</span>
                <Download size={14} className="text-[#c2c5c8] group-hover:text-[#535353] transition-colors" />
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
