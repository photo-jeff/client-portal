import Link from 'next/link'
import { Phone, CalendarCheck } from 'lucide-react'

interface Props {
  type: 'final_meeting' | 'phone_call'
  slug: string
}

const CONFIG = {
  final_meeting: {
    icon: CalendarCheck,
    label: 'Final Details Meeting',
    heading: 'Book your final details meeting',
    body: "As your wedding day gets closer, we'd love to have a final catch-up to go over everything — timings, shot list, any last-minute details.",
    cta: 'Book your meeting →',
  },
  phone_call: {
    icon: Phone,
    label: 'Phone Call',
    heading: 'Book a phone call',
    body: "Got questions as the big day approaches? Book a quick call and we can go over anything you'd like to discuss.",
    cta: 'Book a call →',
  },
}

export function MeetingCard({ type, slug }: Props) {
  const { icon: Icon, label, heading, body, cta } = CONFIG[type]

  return (
    <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <Icon size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
        <div className="flex-1">
          <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">{label}</p>
          <p className="font-serif text-xl mb-2">{heading}</p>
          <p className="text-sm text-[#b5b8ba] mb-5 font-light">{body}</p>
          <Link
            href={`/portal/${slug}/meeting`}
            className="inline-block text-xs tracking-[0.1em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#535353] transition-colors"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
