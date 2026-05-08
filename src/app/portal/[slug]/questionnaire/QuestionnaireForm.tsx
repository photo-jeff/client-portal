'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { calculatePhotographerTimings, formatDisplayTime } from '@/lib/time-utils'
import { CheckCircle } from 'lucide-react'

interface Props {
  clientId: string
  slug: string
  partner1: string
  partner2: string
  initialData: Record<string, unknown> | null
  isCompleted: boolean
}

const STEPS = ['Wedding Day Timeline', 'The Details', 'Vendor Information']

export function QuestionnaireForm({ clientId, slug, partner1, partner2, initialData, isCompleted }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(isCompleted)
  const [data, setData] = useState<Record<string, string | boolean>>({
    bride_prep_address: '',
    groom_prep_address: '',
    first_look: 'no',
    ceremony_location: '',
    departure_time: '',
    ceremony_time: '',
    reception_location: '',
    wedding_breakfast_time: '',
    hot_meal_arranged: 'yes',
    speeches_timing: 'after',
    emergency_contact: '',
    names_for_slideshow: `${partner1} & ${partner2}`,
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
    catering: '',
    transport: '',
    dj_band: '',
    photo_booth: '',
    jeweller: '',
    additional_vendors: '',
    ...(initialData as Record<string, string | boolean> ?? {}),
  })

  const timings = data.departure_time
    ? calculatePhotographerTimings(data.departure_time as string)
    : null

  function update(key: string, value: string | boolean) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function saveDraft() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('questionnaire_responses').upsert({
      client_id: clientId,
      data,
      completed_at: null,
    }, { onConflict: 'client_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSubmit() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('questionnaire_responses').upsert({
      client_id: clientId,
      data,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-10 text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-[#1a1a1a]" />
        <h2 className="font-serif text-2xl">Thank you!</h2>
        <p className="text-sm text-[#888]">Your questionnaire has been submitted. We'll be in touch closer to your wedding day.</p>
        <Button variant="outline" onClick={() => setSubmitted(false)} size="sm">Edit responses</Button>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 py-3 text-xs tracking-[0.08em] uppercase border-b-2 transition-colors ${
              i === step ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-[#e0ddd8] text-[#bbb] hover:text-[#888]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e0ddd8] p-8 space-y-6">
        {step === 0 && (
          <>
            <Input label="Where is the bride getting ready?" value={data.bride_prep_address as string} onChange={e => update('bride_prep_address', e.target.value)} placeholder="Full address" />
            <Input label="Where is the groom getting ready?" value={data.groom_prep_address as string} onChange={e => update('groom_prep_address', e.target.value)} placeholder="Full address" />

            <div className="space-y-2">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Will you see each other before the ceremony?</label>
              <div className="flex gap-4">
                {[{ value: 'no', label: 'No — wait until the ceremony' }, { value: 'yes', label: 'Yes — first look' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="first_look" value={opt.value} checked={data.first_look === opt.value} onChange={() => update('first_look', opt.value)} className="accent-[#1a1a1a]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Input label="Ceremony location" value={data.ceremony_location as string} onChange={e => update('ceremony_location', e.target.value)} placeholder="Full address" />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Ceremony start time" type="time" value={data.ceremony_time as string} onChange={e => update('ceremony_time', e.target.value)} />
              <Input
                label="Time leaving for ceremony"
                type="time"
                value={data.departure_time as string}
                onChange={e => update('departure_time', e.target.value)}
                hint="Leave blank if ceremony is at your venue"
              />
            </div>

            {timings && (
              <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 space-y-2">
                <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-3">Your personalised timings</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#aaa] uppercase tracking-widest">We arrive</p>
                    <p className="font-serif text-lg">{formatDisplayTime(timings.photographerArrival)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#aaa] uppercase tracking-widest">Bride in dress by</p>
                    <p className="font-serif text-lg">{formatDisplayTime(timings.brideReadyBy)}</p>
                  </div>
                </div>
              </div>
            )}

            <Input label="Reception location" value={data.reception_location as string} onChange={e => update('reception_location', e.target.value)} placeholder="Full address (if different from ceremony)" />
            <Input label="Wedding breakfast start time" type="time" value={data.wedding_breakfast_time as string} onChange={e => update('wedding_breakfast_time', e.target.value)} />

            <div className="space-y-2">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Hot meal arranged with venue for us?</label>
              <div className="flex gap-4">
                {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="hot_meal" value={opt.value} checked={data.hot_meal_arranged === opt.value} onChange={() => update('hot_meal_arranged', opt.value)} className="accent-[#1a1a1a]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">When are your speeches?</label>
              <div className="flex gap-4">
                {[{ value: 'before', label: 'Before the meal' }, { value: 'during', label: 'During' }, { value: 'after', label: 'After the meal' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="speeches" value={opt.value} checked={data.speeches_timing === opt.value} onChange={() => update('speeches_timing', opt.value)} className="accent-[#1a1a1a]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Input label="Emergency contact on the day" value={data.emergency_contact as string} onChange={e => update('emergency_contact', e.target.value)} placeholder="Name and phone number" />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="Names for your slideshow" value={data.names_for_slideshow as string} onChange={e => update('names_for_slideshow', e.target.value)} hint="e.g. Jake & Paige or Nicholas & Susan" />
            <Input label="Who is walking you down the aisle?" value={data.aisle_escort as string} onChange={e => update('aisle_escort', e.target.value)} />
            <Input label="First dance song" value={data.first_dance_song as string} onChange={e => update('first_dance_song', e.target.value)} placeholder="Artist — Song title" />
            <Input label="Do you have a choreographed first dance?" value={data.choreographed_dance as string} onChange={e => update('choreographed_dance', e.target.value)} placeholder="Yes / No" />
            <Textarea label="Anything unique in your ceremony or reception?" value={data.unique_elements as string} onChange={e => update('unique_elements', e.target.value)} placeholder="Unusual traditions, special moments, surprise elements…" />
            <Input label="Honeymoon plans" value={data.honeymoon_plans as string} onChange={e => update('honeymoon_plans', e.target.value)} placeholder="When and where?" />
            <Input label="Your social media handles" value={data.social_media as string} onChange={e => update('social_media', e.target.value)} placeholder="@yourinsta" />
            <Input label="Wedding hashtag" value={data.hashtag as string} onChange={e => update('hashtag', e.target.value)} placeholder="#YourHashtag" />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-[#888]">Please include name and social media handle where applicable so we can tag them.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Venue contact" value={data.venue_contact as string} onChange={e => update('venue_contact', e.target.value)} />
              <Input label="Wedding planner" value={data.wedding_planner as string} onChange={e => update('wedding_planner', e.target.value)} />
              <Input label="Wedding dress" value={data.wedding_dress as string} onChange={e => update('wedding_dress', e.target.value)} placeholder="Designer & shop" />
              <Input label="Groom's suit" value={data.groom_suit as string} onChange={e => update('groom_suit', e.target.value)} />
              <Input label="Make-up artist(s)" value={data.makeup_artist as string} onChange={e => update('makeup_artist', e.target.value)} />
              <Input label="Hair stylist" value={data.hair_stylist as string} onChange={e => update('hair_stylist', e.target.value)} />
              <Input label="Florist" value={data.florist as string} onChange={e => update('florist', e.target.value)} />
              <Input label="Venue styling" value={data.venue_styling as string} onChange={e => update('venue_styling', e.target.value)} />
              <Input label="Cake" value={data.cake as string} onChange={e => update('cake', e.target.value)} />
              <Input label="Videographer" value={data.videographer as string} onChange={e => update('videographer', e.target.value)} />
              <Input label="Stationery" value={data.stationery as string} onChange={e => update('stationery', e.target.value)} />
              <Input label="Catering" value={data.catering as string} onChange={e => update('catering', e.target.value)} />
              <Input label="Cars / Transport" value={data.transport as string} onChange={e => update('transport', e.target.value)} />
              <Input label="DJ or band" value={data.dj_band as string} onChange={e => update('dj_band', e.target.value)} />
              <Input label="Photo booth" value={data.photo_booth as string} onChange={e => update('photo_booth', e.target.value)} />
              <Input label="Jeweller" value={data.jeweller as string} onChange={e => update('jeweller', e.target.value)} />
            </div>
            <Textarea label="Any additional vendors?" value={data.additional_vendors as string} onChange={e => update('additional_vendors', e.target.value)} placeholder="Name and social handle" />
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>Previous</Button>
          )}
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save draft'}
          </Button>
        </div>
        {step < STEPS.length - 1 ? (
          <Button variant="filled" size="sm" onClick={() => setStep(s => s + 1)}>Next</Button>
        ) : (
          <Button variant="filled" size="sm" onClick={handleSubmit} disabled={saving}>Submit questionnaire</Button>
        )}
      </div>
    </div>
  )
}
