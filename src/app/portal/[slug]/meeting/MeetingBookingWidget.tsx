'use client'
import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
  calendlyUrl: string
  partnerName: string
  clientEmail: string | null
  slug: string
  label: string    // 'Final Details Meeting' | 'Phone Call'
}

export function MeetingBookingWidget({ calendlyUrl, partnerName, clientEmail, slug, label }: Props) {
  const [booked, setBooked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const embedUrl = `${calendlyUrl}?hide_gdpr_banner=1&background_color=faf9f7&text_color=1a1a1a&primary_color=1a1a1a`

  function initWidget() {
    if (!containerRef.current || !window.Calendly) return
    window.Calendly.initInlineWidget({
      url: embedUrl,
      parentElement: containerRef.current,
      prefill: {
        name:  partnerName || undefined,
        email: clientEmail || undefined,
      },
    })
  }

  useEffect(() => {
    if (window.Calendly) initWidget()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.event === 'calendly.event_scheduled') {
        setBooked(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (booked) {
    return (
      <div className="bg-white border border-[#e0ddd8] rounded-2xl p-10 text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-[#535353]" />
        <h2 className="font-serif text-2xl">You&apos;re booked in</h2>
        <p className="text-sm text-[#919295] font-light">
          We&apos;ll be in touch with a confirmation. Looking forward to chatting soon.
        </p>
        <div className="flex justify-center pt-2">
          <Link href={`/portal/${slug}`}>
            <Button variant="outline" size="sm">Back to portal</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={initWidget}
      />
      <div className="bg-[#faf9f7] border border-[#e0ddd8] rounded-2xl overflow-hidden">
        <p className="text-xs tracking-[0.1em] uppercase text-[#919295] px-6 pt-5 pb-0">{label}</p>
        <div ref={containerRef} style={{ minWidth: 320, height: 700 }} />
      </div>
    </>
  )
}
