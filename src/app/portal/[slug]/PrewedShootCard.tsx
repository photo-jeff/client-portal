'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CalendarHeart, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const FAQ = [
  {
    q: 'Where does the shoot take place?',
    a: "Entirely up to you — a favourite spot, a park, somewhere that means something to you, or even at home. We'll chat beforehand to find somewhere that feels right.",
  },
  {
    q: 'How long does it last?',
    a: "Usually about an hour to an hour and a half — enough time to get relaxed and natural without it feeling like an endurance test.",
  },
  {
    q: 'What should we wear?',
    a: "Something you feel confident and comfortable in. It doesn't need to be formal. Avoid very busy patterns; complementary tones look lovely together.",
  },
  {
    q: 'When will we receive the photos?',
    a: "Usually within 2–3 weeks. We'll send you a private online gallery you can download from directly.",
  },
  {
    q: 'What if we need to reschedule?',
    a: "No problem — use the Reschedule button to pick a new time. Just try to give a few days' notice where you can.",
  },
]

interface Props {
  shootAt: string | null
  rescheduleUrl: string | null
  slug: string
}

export function PrewedShootCard({ shootAt, rescheduleUrl, slug }: Props) {
  const [showFaq, setShowFaq] = useState(false)

  // Format booked date/time in UK timezone
  let formattedDate = ''
  let formattedTime = ''
  if (shootAt) {
    const d = new Date(shootAt)
    formattedDate = d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/London',
    })
    formattedTime = d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/London',
    })
  }

  return (
    <>
      {/* FAQ modal */}
      {showFaq && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-12 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl">Pre-Wedding Shoot</h3>
              <button onClick={() => setShowFaq(false)} className="text-[#919295] hover:text-[#535353] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-sm font-medium text-[#1a1a1a] mb-1">{q}</p>
                  <p className="text-sm text-[#555] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button variant="outline" size="sm" onClick={() => setShowFaq(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
          <div className="flex-1">
            <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">Pre-Wedding Shoot</p>

            {shootAt ? (
              /* Booked */
              <>
                <p className="font-serif text-xl mb-1">Your shoot is confirmed</p>
                <p className="text-sm text-[#e8e4df] mb-5 font-light">
                  {formattedDate} at {formattedTime}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowFaq(true)}
                    className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                  >
                    FAQ
                  </button>
                  {rescheduleUrl && (
                    <a
                      href={rescheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                    >
                      Reschedule
                    </a>
                  )}
                </div>
              </>
            ) : (
              /* Not booked */
              <>
                <p className="font-serif text-xl mb-2">Book your pre-wedding shoot</p>
                <p className="text-sm text-[#b5b8ba] mb-5">
                  A relaxed shoot a few months before the big day — a great chance to get comfortable in front of the camera.
                </p>
                <Link
                  href={`/portal/${slug}/pre-wed-shoot`}
                  className="inline-block text-xs tracking-[0.1em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#535353] transition-colors"
                >
                  Book your shoot →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
