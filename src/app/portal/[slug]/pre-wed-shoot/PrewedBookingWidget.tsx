'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CALENDLY_URL = 'https://calendly.com/jeffoliverphoto/pre-wed-shoot'
const POLL_INTERVAL = 3000   // check every 3s
const POLL_MAX      = 20     // stop after 60s (20 × 3s)

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
  slug: string
}

export function PrewedBookingWidget({ shootAt, rescheduleUrl, partnerName, clientEmail, slug }: Props) {
  const storageKey = `prewed-booked-${slug}`

  // Initialise from sessionStorage so the confirmed state survives a
  // router.refresh() (which can unmount/remount the client component).
  const [optimisticBooked, setOptimisticBooked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pollCountRef = useRef(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router       = useRouter()

  // On mount, restore any previously-set optimistic state
  useEffect(() => {
    if (sessionStorage.getItem(storageKey) === 'true') {
      setOptimisticBooked(true)
    }
  }, [storageKey])

  // Once the server has real data, clear the optimistic flag
  useEffect(() => {
    if (shootAt) {
      sessionStorage.removeItem(storageKey)
      stopPolling()
    }
  }, [shootAt, storageKey])

  function stopPolling() {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  // Poll the lightweight API until Supabase has the shoot date,
  // then do a single router.refresh() to show the real date.
  function startPolling() {
    pollCountRef.current = 0
    stopPolling()

    async function poll() {
      try {
        const res  = await fetch(`/api/portal/prewedding-check/${slug}`)
        const { shootAt: liveShootAt } = await res.json()
        if (liveShootAt) {
          router.refresh()
          return
        }
      } catch { /* ignore network errors */ }

      pollCountRef.current++
      if (pollCountRef.current < POLL_MAX) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL)
      }
    }

    // First check after 4s (give the webhook a head-start)
    pollTimerRef.current = setTimeout(poll, 4000)
  }

  const embedUrl = `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=faf9f7&text_color=1a1a1a&primary_color=1a1a1a`

  function initWidget() {
    if (!containerRef.current || !window.Calendly) return
    window.Calendly.initInlineWidget({
      url: embedUrl,
      parentElement: containerRef.current,
      prefill: {
        name:  partnerName  || undefined,
        email: clientEmail || undefined,
      },
    })
  }

  useEffect(() => {
    if (window.Calendly) initWidget()
    return () => stopPolling()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for booking-complete postMessage from the Calendly widget
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.event === 'calendly.event_scheduled') {
        sessionStorage.setItem(storageKey, 'true')
        setOptimisticBooked(true)
        startPolling()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router, slug, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
              Just a moment — confirming your date…
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Link href={`/portal/${slug}/pre-wed-shoot/faq`}>
              <Button variant="outline" size="sm">FAQ</Button>
            </Link>
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
