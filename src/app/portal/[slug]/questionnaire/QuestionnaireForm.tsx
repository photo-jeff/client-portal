'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { calculatePhotographerTimings, formatDisplayTime } from '@/lib/time-utils'
import { CheckCircle, Clock } from 'lucide-react'
import {
  type CoupleType,
  asksHairAndMakeup,
  asksSurname,
  hasSeparateGarmentFields,
} from '@/lib/couple-type'

interface Props {
  clientId: string
  slug: string
  partner1: string
  partner2: string
  coupleType: CoupleType
  ceremonyVenue: string | null
  ceremonyTime: string | null
  receptionVenue: string | null
  daysUntil: number | null
  initialData: Record<string, unknown> | null
  isCompleted: boolean
}

const STEPS = ['Your Day', 'The Fun Stuff', 'Your Suppliers']

// VSCO's questionnaire text inputs cap at 255 characters. Mirror that limit on
// every free-text field here so the portal answers can never exceed what VSCO
// stores — keeping the two in sync and avoiding the "form validation failed"
// error VSCO throws when a submitted value is over-length (see vsco-questionnaire.ts).
const VSCO_TEXT_MAX = 255

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}

// ── iOS-style drum scroll column ────────────────────────────────────────────

const ITEM_H = 44

function Drum({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // With center alignment, scrollTop = idx * ITEM_H
  useEffect(() => {
    const idx = items.indexOf(value)
    if (listRef.current && idx >= 0) {
      listRef.current.scrollTop = idx * ITEM_H
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleScroll() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!listRef.current) return
      const idx = Math.round(listRef.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      onChange(items[clamped])
    }, 120)
  }

  return (
    <div className="relative" style={{ width: 72, height: ITEM_H * 5 }}>
      {/* Selection indicator — border lines only, no fill, so digits show through */}
      <div
        className="absolute inset-x-2 pointer-events-none"
        style={{
          top: ITEM_H * 2,
          height: ITEM_H,
          borderTop: '1px solid #c8c4be',
          borderBottom: '1px solid #c8c4be',
        }}
      />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: 'y mandatory' as const,
          paddingTop: ITEM_H * 2,
          paddingBottom: ITEM_H * 2,
          scrollbarWidth: 'none' as const,
        }}
      >
        {items.map(item => (
          <div
            key={item}
            style={{ scrollSnapAlign: 'center' as const, height: ITEM_H }}
            className={`flex items-center justify-center text-base select-none transition-colors ${
              item === value ? 'font-semibold text-[#1a1a1a]' : 'text-[#c2c5c8]'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Time picker field ────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function nearestQuarter(m: number) {
  return String(Math.round(m / 15) * 15 % 60).padStart(2, '0')
}

function TimeSelect({
  label, value, onChange, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  const [open, setOpen] = useState(false)
  const [localHour, setLocalHour] = useState(() => value ? value.split(':')[0] : '12')
  const [localMin, setLocalMin] = useState(() => value ? nearestQuarter(parseInt(value.split(':')[1])) : '00')

  // Keep local state in sync if value is updated externally (e.g. pre-fill on load)
  useEffect(() => {
    if (value) {
      setLocalHour(value.split(':')[0])
      setLocalMin(nearestQuarter(parseInt(value.split(':')[1])))
    } else {
      setLocalHour('12')
      setLocalMin('00')
    }
  }, [value])

  function handleDone() {
    onChange(`${localHour}:${localMin}`)
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setOpen(false)
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs tracking-[0.1em] uppercase text-[#919295] font-medium">{label}</label>
      {hint && <p className="text-xs text-[#b5b8ba]">{hint}</p>}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left border border-[#e0ddd8] bg-white px-4 py-3 text-sm rounded-lg transition-colors hover:border-[#919295]"
        >
          {value
            ? <span className="text-[#535353]">{value}</span>
            : <span className="text-[#c2c5c8]">—</span>
          }
        </button>
      ) : (
        <div className="border border-[#535353] rounded-xl overflow-hidden">
          <div className="flex items-center justify-center gap-1 py-2 bg-white">
            <Drum items={HOURS} value={localHour} onChange={setLocalHour} />
            <span className="text-xl font-light text-[#535353] pb-0.5">:</span>
            <Drum items={MINUTES} value={localMin} onChange={setLocalMin} />
          </div>
          <div className="flex border-t border-[#e0ddd8]">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-3 text-xs text-[#919295] hover:text-[#535353] transition-colors border-r border-[#e0ddd8]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 py-3 text-xs font-medium text-[#535353] hover:bg-[#faf9f7] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────

export function QuestionnaireForm({
  clientId, slug, partner1, partner2, coupleType,
  ceremonyVenue, ceremonyTime, receptionVenue,
  daysUntil, initialData, isCompleted,
}: Props) {
  // These track the three VSCO templates exactly — see docs/vsco-field-maps.md.
  // Asking something the couple's own form has no field for just loses the answer.
  const showHairMakeup = asksHairAndMakeup(coupleType)
  const showSurname    = asksSurname(coupleType)
  const separateOutfits = hasSeparateGarmentFields(coupleType)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(isCompleted)
  const [mealError, setMealError] = useState<string | null>(null)
  const [showMealWarning, setShowMealWarning] = useState(false)

  const [data, setData] = useState<Record<string, string | boolean>>({
    bride_prep_address: '',
    groom_prep_address: '',
    first_look: 'no',
    ceremony_location: ceremonyVenue ?? '',
    departure_time: '',
    departure_time_2: '',
    surname_change: '',
    ceremony_time: ceremonyTime ?? '',
    reception_location: receptionVenue ?? ceremonyVenue ?? '',
    wedding_breakfast_time: '',
    hot_meal_arranged: '',
    speeches_timing: 'after',
    emergency_contact: '',
    names_for_slideshow: `${firstName(partner1)} & ${firstName(partner2)}`,
    aisle_escort: '',
    first_dance_song: '',
    choreographed_dance: '',
    unique_elements: '',
    honeymoon_plans: '',
    social_media: '',
    hashtag: '',
    venue_contact: '',
    wedding_planner: '',
    wedding_dress: '',
    groom_suit: '',
    makeup_artist: '',
    hair_stylist: '',
    florist: '',
    venue_styling: '',
    cake: '',
    videographer: '',
    stationery: '',
    transport: '',
    dj_band: '',
    photo_booth: '',
    jeweller: '',
    additional_vendors: '',
    ...(initialData as Record<string, string | boolean> ?? {}),
  })

  // Use departure time if set, otherwise fall back to ceremony time
  const timingsBasis = (data.departure_time as string) || (data.ceremony_time as string) || ''
  const timings = timingsBasis ? calculatePhotographerTimings(timingsBasis) : null

  function update(key: string, value: string | boolean) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function saveDraft(currentData = data) {
    setSaving(true)
    try {
      await fetch('/api/portal/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data: currentData, completed_at: null }),
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    if (step === 0 && !data.hot_meal_arranged) {
      setMealError('Please let us know whether a meal has been arranged')
      return
    }
    setMealError(null)
    await saveDraft()
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSaving(true)
    await fetch('/api/portal/questionnaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, data, completed_at: new Date().toISOString() }),
    })
    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-10 rounded-2xl text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-[#535353]" />
        <h2 className="font-serif text-2xl">Thank you!</h2>
        <p className="text-sm text-[#919295]">
          Your questionnaire is in — we&apos;ll be in touch in the week before your wedding to go through final details.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)} size="sm">Edit responses</Button>
      </div>
    )
  }

  return (
    <div>
      {/* Meal warning modal */}
      {showMealWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-xl mb-3">Just a quick note</h3>
            <p className="text-sm text-[#555] leading-relaxed mb-6">
              Providing a hot meal for your photographer is something we include in our contract — it&apos;s a long day and we want to be at our very best for your evening coverage. Most venues are more than happy to accommodate this, so it&apos;s well worth dropping them a quick message if you haven&apos;t already. Thank you so much!
            </p>
            <Button variant="filled" size="sm" onClick={() => setShowMealWarning(false)}>
              Got it, thanks
            </Button>
          </div>
        </div>
      )}

      {/* Step tabs */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 py-3 text-xs tracking-[0.08em] uppercase border-b-2 transition-colors ${
              i === step ? 'border-[#535353] text-[#535353]' : 'border-[#e0ddd8] text-[#c2c5c8] hover:text-[#919295]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e0ddd8] p-8 rounded-2xl space-y-8">

        {/* ── STEP 1: YOUR DAY ── */}
        {step === 0 && (
          <>
            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-1">Morning preparations</p>
              <p className="text-sm text-[#b5b8ba] mb-5">We&apos;ll be with you from the start — help us know where to go.</p>
              <div className="space-y-5">
                <Input
                  label={`Where is ${firstName(partner1)} getting ready?`}
                  value={data.bride_prep_address as string}
                  onChange={e => update('bride_prep_address', e.target.value)}
                  placeholder="Full address including postcode"
                />
                <Input
                  label={`What about ${firstName(partner2)}?`}
                  value={data.groom_prep_address as string}
                  onChange={e => update('groom_prep_address', e.target.value)}
                  placeholder="Full address (or 'Same venue' if together)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#919295] font-medium">
                Are you having a first look before the ceremony?
              </label>
              <p className="text-xs text-[#b5b8ba]">A first look is a private moment together before you walk down the aisle — it means we can get all your couple portraits done before the ceremony.</p>
              <div className="flex gap-6 mt-3">
                {[
                  { value: 'no', label: 'No — keeping it traditional' },
                  { value: 'yes', label: 'Yes — we love that idea' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="first_look" value={opt.value} checked={data.first_look === opt.value} onChange={() => update('first_look', opt.value)} className="accent-[#535353]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-1">Ceremony</p>
              <div className="space-y-5 mt-4">
                <Input
                  label="Ceremony location"
                  value={data.ceremony_location as string}
                  onChange={e => update('ceremony_location', e.target.value)}
                  placeholder="Full address including postcode"
                  hint={ceremonyVenue ? 'Pre-filled from your booking — update if needed' : undefined}
                />
                <div className="grid grid-cols-2 gap-4 items-end">
                  <TimeSelect
                    label="Ceremony start time"
                    value={data.ceremony_time as string}
                    onChange={v => update('ceremony_time', v)}
                    hint={ceremonyTime ? 'Pre-filled from your booking' : undefined}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 items-start">
                  <TimeSelect
                    label={`What time is ${firstName(partner1)} leaving for the ceremony?`}
                    value={data.departure_time as string}
                    onChange={v => update('departure_time', v)}
                    hint="Leave blank if getting ready at the ceremony venue"
                  />
                  <TimeSelect
                    label={`What time is ${firstName(partner2)} leaving?`}
                    value={data.departure_time_2 as string}
                    onChange={v => update('departure_time_2', v)}
                    hint="Leave blank if getting ready at the ceremony venue"
                  />
                </div>
              </div>
            </div>

            {timings && (
              <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 rounded-xl space-y-3">
                <p className="text-xs tracking-[0.1em] uppercase text-[#919295] flex items-center gap-2">
                  <Clock size={12} /> Your personalised timings
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#b5b8ba] uppercase tracking-widest">We arrive</p>
                    <p className="font-serif text-lg">{formatDisplayTime(timings.photographerArrival)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#b5b8ba] uppercase tracking-widest">
                      {coupleType === 'bg' ? `${firstName(partner1)} in dress by` : `${firstName(partner1)} ready by`}
                    </p>
                    <p className="font-serif text-lg">{formatDisplayTime(timings.brideReadyBy)}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-1">Reception</p>
              <div className="space-y-5 mt-4">
                <Input
                  label="Reception location"
                  value={data.reception_location as string}
                  onChange={e => update('reception_location', e.target.value)}
                  placeholder="Full address (or 'Same as ceremony')"
                  hint={receptionVenue || ceremonyVenue ? 'Pre-filled from your booking — update if needed' : undefined}
                />
                <TimeSelect
                  label="What time does the wedding breakfast start?"
                  value={data.wedding_breakfast_time as string}
                  onChange={v => update('wedding_breakfast_time', v)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#919295] font-medium">
                Have you arranged a meal for us with the venue?
              </label>
              <p className="text-xs text-[#b5b8ba]">It&apos;s a long day and we want to be at our best for your evening coverage — most venues are happy to accommodate us.</p>
              <div className="flex gap-6 mt-2">
                {[{ value: 'yes', label: 'Yes — all sorted' }, { value: 'no', label: 'Not yet' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="hot_meal"
                      value={opt.value}
                      checked={data.hot_meal_arranged === opt.value}
                      onChange={() => {
                        update('hot_meal_arranged', opt.value)
                        setMealError(null)
                        if (opt.value === 'no') setShowMealWarning(true)
                      }}
                      className="accent-[#535353]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {mealError && <p className="text-xs text-red-500">{mealError}</p>}
            </div>

            <div className="space-y-3">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#919295] font-medium">When are your speeches?</label>
              <div className="flex gap-6">
                {[
                  { value: 'before', label: 'Before the meal' },
                  { value: 'during', label: 'During' },
                  { value: 'after', label: 'After the meal' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="speeches" value={opt.value} checked={data.speeches_timing === opt.value} onChange={() => update('speeches_timing', opt.value)} className="accent-[#535353]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Who's your emergency contact on the day?"
              value={data.emergency_contact as string}
              onChange={e => update('emergency_contact', e.target.value)}
              placeholder="Name and mobile number"
              maxLength={VSCO_TEXT_MAX}
            />
          </>
        )}

        {/* ── STEP 2: THE FUN STUFF ── */}
        {step === 1 && (
          <>
            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-1">The personal touches</p>
              <p className="text-sm text-[#b5b8ba] mb-6">The little details that make your day yours.</p>

              <div className="space-y-6">
                <Input
                  label="What names would you like on your slideshow?"
                  value={data.names_for_slideshow as string}
                  onChange={e => update('names_for_slideshow', e.target.value)}
                  hint="e.g. Emma & James, or Ems & J"
                  maxLength={VSCO_TEXT_MAX}
                />
                <Input
                  label={
                    coupleType === 'bg'
                      ? `Who is walking ${firstName(partner1)} down the aisle?`
                      : 'What are your plans for walking down the aisle?'
                  }
                  value={data.aisle_escort as string}
                  onChange={e => update('aisle_escort', e.target.value)}
                  placeholder="Name (or 'Walking alone / together')"
                  maxLength={VSCO_TEXT_MAX}
                />
                {showSurname && (
                  <Input
                    label="Will you be changing your surname? If yes, what will it be?"
                    value={data.surname_change as string}
                    onChange={e => update('surname_change', e.target.value)}
                    placeholder="No change / new surname"
                    maxLength={VSCO_TEXT_MAX}
                  />
                )}
                <Input
                  label="What's your first dance song?"
                  value={data.first_dance_song as string}
                  onChange={e => update('first_dance_song', e.target.value)}
                  placeholder="Artist — Song title"
                  maxLength={VSCO_TEXT_MAX}
                />
                <Input
                  label="Will it be choreographed or keeping it natural?"
                  value={data.choreographed_dance as string}
                  onChange={e => update('choreographed_dance', e.target.value)}
                  placeholder="Natural / Choreographed routine"
                  maxLength={VSCO_TEXT_MAX}
                />
                <Textarea
                  label="Any special moments or surprises we should know about?"
                  value={data.unique_elements as string}
                  onChange={e => update('unique_elements', e.target.value)}
                  placeholder="Unusual traditions, special elements in the ceremony, anything that'll make us go 'oh wow'…"
                  maxLength={VSCO_TEXT_MAX}
                />
                <Input
                  label="Honeymoon plans? (Purely curiosity — no obligation!)"
                  value={data.honeymoon_plans as string}
                  onChange={e => update('honeymoon_plans', e.target.value)}
                  placeholder="Where and when?"
                  maxLength={VSCO_TEXT_MAX}
                />
              </div>
            </div>

            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mb-1">Sharing your day</p>
              <p className="text-sm text-[#b5b8ba] mb-6">Just so we can loop you in when we share your photos online.</p>
              <div className="space-y-5">
                <Input
                  label="Where can we find you online?"
                  value={data.social_media as string}
                  onChange={e => update('social_media', e.target.value)}
                  placeholder="@yourinsta or just tell us the platform you use"
                  maxLength={VSCO_TEXT_MAX}
                />
                <Input
                  label="Got a wedding hashtag?"
                  value={data.hashtag as string}
                  onChange={e => update('hashtag', e.target.value)}
                  placeholder="#YourWeddingHashtag"
                  hint="No pressure if you haven't decided yet"
                  maxLength={VSCO_TEXT_MAX}
                />
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: YOUR SUPPLIERS ── */}
        {step === 2 && (
          <>
            {daysUntil !== null && daysUntil > 60 ? (
              <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 rounded-xl text-center space-y-2">
                <p className="text-sm text-[#919295]">
                  Nothing to worry about yet — supplier details can be filled in closer to the day.
                </p>
                <p className="text-xs text-[#b5b8ba]">We&apos;ll remind you to come back about 8 weeks before your wedding.</p>
              </div>
            ) : (
              <p className="text-xs text-[#b5b8ba]">
                Name and social handle where you can — we love to tag and shout out everyone who helped make your day.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <Input label="Venue coordinator" value={data.venue_contact as string} onChange={e => update('venue_contact', e.target.value)} placeholder="Name + email or phone" maxLength={VSCO_TEXT_MAX} />
              <Input label="Wedding planner" value={data.wedding_planner as string} onChange={e => update('wedding_planner', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              {separateOutfits ? (
                <>
                  <Input label={`${firstName(partner1)}'s dress`} value={data.wedding_dress as string} onChange={e => update('wedding_dress', e.target.value)} placeholder="Designer & boutique" maxLength={VSCO_TEXT_MAX} />
                  <Input label={`${firstName(partner2)}'s suit`} value={data.groom_suit as string} onChange={e => update('groom_suit', e.target.value)} placeholder="Designer & shop" maxLength={VSCO_TEXT_MAX} />
                </>
              ) : (
                // BB and GG have a single combined outfit field on their VSCO form.
                // Two brides could be in dresses, suits or one of each, so keep it
                // open; two grooms are near enough always suits — which is also how
                // their own VSCO form labels it.
                <Input
                  label={coupleType === 'gg' ? 'Suits' : 'Dresses / suits'}
                  value={data.wedding_dress as string}
                  onChange={e => update('wedding_dress', e.target.value)}
                  placeholder="Designer & shop for both of you"
                  maxLength={VSCO_TEXT_MAX}
                />
              )}
              {showHairMakeup && (
                <>
                  <Input label="Make-up artist(s)" value={data.makeup_artist as string} onChange={e => update('makeup_artist', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
                  <Input label="Hair stylist" value={data.hair_stylist as string} onChange={e => update('hair_stylist', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
                </>
              )}
              <Input label="Florist" value={data.florist as string} onChange={e => update('florist', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Venue styling" value={data.venue_styling as string} onChange={e => update('venue_styling', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Cake" value={data.cake as string} onChange={e => update('cake', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Videographer" value={data.videographer as string} onChange={e => update('videographer', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Stationery" value={data.stationery as string} onChange={e => update('stationery', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Cars / transport" value={data.transport as string} onChange={e => update('transport', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="DJ or band" value={data.dj_band as string} onChange={e => update('dj_band', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Photo booth" value={data.photo_booth as string} onChange={e => update('photo_booth', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
              <Input label="Jeweller" value={data.jeweller as string} onChange={e => update('jeweller', e.target.value)} placeholder="Name + @instagram" maxLength={VSCO_TEXT_MAX} />
            </div>
            <Textarea
              label="Anyone else we should know about?"
              value={data.additional_vendors as string}
              onChange={e => update('additional_vendors', e.target.value)}
              placeholder="Any other vendors, services, or people who made the day happen"
              maxLength={VSCO_TEXT_MAX}
            />
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>Previous</Button>
          )}
          {savedAt && (
            <span className="text-xs text-[#919295]">
              Saved {new Date(savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ✓
            </span>
          )}
        </div>
        {step < STEPS.length - 1 ? (
          <Button variant="filled" size="sm" onClick={handleNext} disabled={saving}>
            {saving ? 'Saving…' : 'Next'}
          </Button>
        ) : (
          <Button variant="filled" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Submit questionnaire'}
          </Button>
        )}
      </div>
    </div>
  )
}
