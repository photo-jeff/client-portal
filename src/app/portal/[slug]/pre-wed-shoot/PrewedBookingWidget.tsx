'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CALENDLY_URL = 'https://calendly.com/jeffoliverphoto/pre-wed-shoot'

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

// Calendly widget type
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string
        parentElement: HTMLElement
        prefill?: { name?: string; email?: string }
      }) => void
    }
  }
}

interface Props {
  shootAt: string | null
  rescheduleUrl: string | null
  partnerName: string
  clientEmail: string | null
}

export function PrewedBookingWidget({ shootAt, rescheduleUrl, partnerName, clientEmail }: Props) {
  const [showFaq, setShowFaq] = useState(false)
  const [optimisticBooked, setOptimisticBooked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const embedUrl = `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=faf9f7&text_color=1a1a1a&primary_color=1a1a1a`

  // Initialise the Calendly inline widget.
  // Called both from onLoad (first visit) and from useEffect (script already cached).
  function initWidget() {
    if (!containerRef.current || !window.Calendly) return
    window.Calendly.initInlineWidget({
      url: embedUrl,
      parentElement: containerRef.current,
      prefill: {
        name: partnerName || undefined,
        email: clientEmail || undefined,
      },
    })
  }

  useEffect(() => {
    // Script may already be cached from a previous visit — init immediately
    if (window.Calendly) initWidget()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for the booking-complete postMessage from the widget
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.event === 'calendly.event_scheduled') {
        setOptimisticBooked(true)
        // Webhook writes to Supabase ~1–2s after booking; refresh after 5s
        setTimeout(() => router.refresh(), 5000)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  const isBooked = !!shootAt || optimisticBooked

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
      {/* Calendly widget JS — loads once, enables postMessage */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={initWidget}
      />

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

      {isBooked ? (
        /* Confirmed state */
        <div className="bg-white border border-[#e0ddd8] rounded-2xl p-10 text-center space-y-4">
          <CheckCircle size={32} className="mx-auto text-[#535353]" />
          <h2 className="font-serif text-2xl">
            {shootAt ? 'Your shoot is confirmed' : 'Booking confirmed!'}
          </h2>
          {shootAt ? (
            <p className="text-[#535353] font-light text-lg">
              {formattedDate} at {formattedTime}
            </p>
          ) : (
            <p className="text-sm text-[#919295]">
              Refresh this page in a moment and your date will appear here.
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowFaq(true)}>FAQ</Button>
            {rescheduleUrl && (
              <a href={rescheduleUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Reschedule</Button>
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Booking widget */
        <div className="bg-[#faf9f7] border border-[#e0ddd8] rounded-2xl overflow-hidden">
          <div ref={containerRef} style={{ minWidth: 320, height: 700 }} />
        </div>
      )}
    </>
  )
}
