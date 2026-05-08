import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'

export default function PreviewImportantInfo() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/preview" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Important Information</h1>
        <Divider />
      </div>

      <div className="space-y-10">

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Before Your Wedding</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            During the week before your wedding we'll give you a call to go through final timings and make sure everything is confirmed — any last-minute changes, the day's run of events, and any questions you have.
          </p>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8 space-y-5">
          <h2 className="font-serif text-2xl">Bridal Preparations</h2>
          <div>
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#888] mb-2">When we arrive</h3>
            <p className="text-sm text-[#888] leading-relaxed">
              We arrive two hours before you leave for the ceremony. The first hour is for detail shots — your dress, shoes, rings, jewellery, and perfume — alongside natural getting-ready moments. We need you in your dress one hour before you leave, which gives us time for your bridal portraits and photos with your bridesmaids.
            </p>
            <div className="mt-4 bg-[#faf9f7] border border-[#e0ddd8] p-5 space-y-2">
              <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-3">Your personalised timings</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-widest">We arrive</p>
                  <p className="font-serif text-lg">11:00am</p>
                </div>
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-widest">Dress on by</p>
                  <p className="font-serif text-lg">12:00pm</p>
                </div>
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-widest">Leaving for ceremony</p>
                  <p className="font-serif text-lg">1:00pm</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#f0ede8] pt-5">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#888] mb-3">A few things that make a big difference</h3>
            <ul className="space-y-2 text-sm text-[#888]">
              {[
                'Keep the getting-ready room as tidy as possible and clear a little space for photos — natural light from a window is ideal.',
                "Please don't put on any jewellery or perfume until we arrive, so we can photograph everything fresh.",
                'Gather all your detail items together in one place: shoes, jewellery, garter, perfume, invitations.',
                'Avoid tight-fitting clothing beforehand — especially important if your dress is backless.',
                'If you have concerns about tattoos or blemishes, let us know in advance.',
                'Professional hair and makeup is strongly recommended — it photographs beautifully and keeps the morning running to time.',
              ].map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#ccc] flex-shrink-0 mt-0.5">—</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Groom Preparations</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Groom coverage is focused on the moments just before the ceremony — tie or cravat being adjusted, buttonholes, cufflinks. If you're both getting ready at the same location we can give the groom more time, so let us know in your questionnaire.
          </p>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Group Photos</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            We recommend no more than 15 group combinations — each takes around 3 minutes, so 15 shots is roughly 45 minutes. More than that starts to eat into your drinks reception time with guests.
          </p>
          <p className="text-sm text-[#888] mt-3 leading-relaxed">
            Use the <Link href="/preview/shot-list" className="underline hover:text-[#1a1a1a]">Shot List</Link> section of your portal to build your list. Please aim to have it done <strong>2–3 weeks before your wedding</strong>.
          </p>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">On the Day</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Please arrange a hot meal for us with your venue or caterer. It's a long day and we want to be at our best for your evening coverage.
          </p>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Your Photos</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Your full gallery is typically ready within <strong>8 weeks</strong> of your wedding day. We'll share some early preview shots on Instagram and Facebook before then.
          </p>
          <p className="text-sm text-[#888] mt-3 leading-relaxed">
            If your package includes an Album or Frame Collection, you'll receive an invitation to a <strong>Champagne Screening</strong> to view and select your favourites before anything goes to print.
          </p>
        </section>

        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-2xl mb-4">Documents for Your Venue</h2>
          <p className="text-sm text-[#888] mb-6 leading-relaxed">
            Some venues ask for our insurance details in advance. You're welcome to download and forward these directly.
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
                className="flex items-center justify-between py-3 px-4 border border-[#e0ddd8] hover:border-[#1a1a1a] transition-colors group"
              >
                <span className="text-sm text-[#1a1a1a]">{doc.label}</span>
                <Download size={14} className="text-[#bbb] group-hover:text-[#1a1a1a] transition-colors" />
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
