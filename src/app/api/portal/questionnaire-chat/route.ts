import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { type CoupleType, getCoupleType, asksHairAndMakeup, asksSurname, hasSeparateGarmentFields } from '@/lib/couple-type'

function buildSystemPrompt(params: {
  partner1: string
  partner2: string
  coupleType: CoupleType
  weddingDate: string | null
  ceremonyVenue: string | null
  ceremonyTime: string | null
  receptionVenue: string | null
  existingData: Record<string, unknown> | null
}): string {
  const { partner1, partner2, coupleType, weddingDate, ceremonyVenue, ceremonyTime, receptionVenue, existingData } = params

  const sameVenue = !receptionVenue || receptionVenue === ceremonyVenue

  const dateStr = weddingDate
    ? new Date(weddingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const hasExisting = existingData && Object.keys(existingData).length > 0

  const opening1 = sameVenue && ceremonyVenue
    ? `Open with: "Are you getting ready at ${ceremonyVenue}?" — if yes, ${partner1}'s prep address = ceremony venue; if no, ask for the full address including postcode.`
    : `Open with: "Where will ${partner1} be getting ready? (full address including postcode)"`

  const opening2 = sameVenue
    ? `Then: "Will ${partner2} be getting ready there as well?" — if no, ask for ${partner2}'s address and what time they'll be arriving.`
    : `Then: ask what time ${partner2} will be arriving at the venue. If ${partner2} is getting ready elsewhere, get the address.`

  const existingNote = hasExisting
    ? `\nPREVIOUSLY SAVED ANSWERS — reference these, don't re-ask unless they want to update:\n${JSON.stringify(existingData, null, 2)}\n`
    : ''

  const modeNote = hasExisting
    ? `The couple has already answered most questions. Start by acknowledging this warmly and asking if there's something specific to update, or if they'd like to go through everything.`
    : `Fresh questionnaire — start directly with ${partner1}'s getting-ready question.`

  // The three VSCO templates differ in which questions exist at all, so the
  // supplier list and extra questions have to track the couple's own form.
  // See docs/vsco-field-maps.md.
  const outfitAsk = hasSeparateGarmentFields(coupleType)
    ? `${partner1}'s dress (designer & boutique), ${partner2}'s suit`
    : coupleType === 'gg'
      // Two grooms are near enough always in suits, but don't rule out anything
      // else if they say otherwise — just don't lead with it.
      ? `both your suits, designer & shop (ONE question covering both of them, not one each)`
      : `what you're both wearing — dresses, suits or one of each, designer & shop (ONE question covering both of them, not one each)`
  const hairMakeupAsk = asksHairAndMakeup(coupleType) ? ', makeup artist, hair stylist' : ''
  const surnameAsk = asksSurname(coupleType)
    ? `\n- Are either of you changing your surname? If so, what to?`
    : ''

  // Only emit keys this couple's VSCO form actually has a field for.
  const jsonKeys = [
    'bride_prep_address', 'groom_prep_address', 'first_look', 'ceremony_location',
    'ceremony_time', 'departure_time', 'departure_time_2', 'reception_location',
    'wedding_breakfast_time', 'hot_meal_arranged', 'speeches_timing', 'emergency_contact',
    'names_for_slideshow', 'aisle_escort',
    ...(asksSurname(coupleType) ? ['surname_change'] : []),
    'first_dance_song', 'choreographed_dance', 'unique_elements', 'honeymoon_plans',
    'social_media', 'hashtag', 'venue_contact', 'wedding_planner',
    'wedding_dress', ...(hasSeparateGarmentFields(coupleType) ? ['groom_suit'] : []),
    ...(asksHairAndMakeup(coupleType) ? ['makeup_artist', 'hair_stylist'] : []),
    'florist', 'venue_styling', 'cake', 'videographer', 'stationery', 'transport',
    'dj_band', 'photo_booth', 'jeweller', 'additional_vendors',
  ]

  return `You are helping ${partner1} and ${partner2} complete their wedding photography questionnaire for Jeff Oliver Photography.${dateStr ? ` Their wedding is on ${dateStr}.` : ''}

CONTEXT:
- Ceremony venue: ${ceremonyVenue || 'not yet confirmed'}
- Ceremony time: ${ceremonyTime || 'not yet confirmed'}
- Reception venue: ${sameVenue ? `same as ceremony${ceremonyVenue ? ` (${ceremonyVenue})` : ''}` : (receptionVenue || 'not yet confirmed')}
${existingNote}
STYLE:
- Warm, conversational — never form-like
- One question at a time
- Use their names naturally
- Don't re-ask what's already in context
- Light and reassuring — couples often find this daunting
${modeNote}

TOPICS (work through naturally, don't list or number them):

1. ${partner1.split(/\s+/)[0].toUpperCase()} GETTING READY
${opening1}

2. ${partner2.split(/\s+/)[0].toUpperCase()} GETTING READY
${opening2}

3. FIRST LOOK
Ask if they're planning a private first look before the ceremony.

4. DEPARTURE TIMES
Ask each partner separately what time they're leaving for the ceremony — these are
two different answers and both matter. Skip whichever partner is already getting
ready at the ceremony venue.

5. CEREMONY & RECEPTION
- Confirm ceremony location${ceremonyVenue ? ` (pre-filled as ${ceremonyVenue} — just confirm or correct)` : ' (ask)'}
- Confirm ceremony time${ceremonyTime ? ` (pre-filled as ${ceremonyTime} — just confirm or correct)` : ' (ask)'}
- ${sameVenue ? 'Reception is same venue — skip unless they raise it.' : `Confirm reception at ${receptionVenue}`}

6. TIMINGS
- Wedding breakfast start time
- Have they arranged a meal for the photographers with the venue? (yes/no, almost always yes)
- Speeches — before, during, or after the meal?

7. EMERGENCY CONTACT
Name and mobile number for their main on-the-day contact.

8. THE FUN STUFF
- Names for their slideshow
- What are their plans for walking down the aisle?${surnameAsk}
- First dance song
- Choreographed or keeping it natural?
- Any surprises or special moments we should know about?
- Honeymoon plans?
- Social media handles / wedding hashtag?

9. SUPPLIERS
Work through these naturally: venue coordinator contact details, wedding planner (if any), ${outfitAsk}${hairMakeupAsk}, florist, venue styling/decoration, cake, videographer (if any), stationery, transport, DJ or band, photo booth (if any), jeweller, anything else.

FINISHING UP:
When you have everything, close warmly (e.g. "Perfect — I think we've got everything we need. Your questionnaire is all saved.") and on a new line output:

QUESTIONNAIRE_COMPLETE:
{${jsonKeys.map(k => `"${k}":""`).join(',')}}

Rules for the JSON:
- Fill every field from the conversation; use "" for anything not mentioned
- Times in HH:MM 24-hour format
- first_look and hot_meal_arranged: "yes" or "no"
- speeches_timing: "before", "during", or "after"
- KEY NAMING IS HISTORIC, NOT GENDERED. "bride_prep_address" always means
  ${partner1}'s address and "groom_prep_address" always means ${partner2}'s,
  whatever their genders. Same for departure_time (${partner1}) and
  departure_time_2 (${partner2}).${hasSeparateGarmentFields(coupleType)
    ? ''
    : `\n- Put the single combined outfit answer in "wedding_dress" and leave "groom_suit" as "".`}
- Emit this block exactly once, at the very end of your final message`
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const { messages, slug } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, partner1_name, partner2_name, partner1_role, partner2_role, wedding_date, ceremony_venue, ceremony_time, reception_venue')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: existing } = await admin
    .from('questionnaire_responses')
    .select('data')
    .eq('client_id', client.id)
    .single()

  // Strip internal keys (like _chat_history) before passing to Claude
  const existingData = existing?.data
    ? Object.fromEntries(Object.entries(existing.data as Record<string, unknown>).filter(([k]) => !k.startsWith('_')))
    : null

  const systemPrompt = buildSystemPrompt({
    partner1: client.partner1_name,
    partner2: client.partner2_name,
    coupleType: getCoupleType(client),
    weddingDate: client.wedding_date ?? null,
    ceremonyVenue: client.ceremony_venue ?? null,
    ceremonyTime: client.ceremony_time ?? null,
    receptionVenue: client.reception_venue ?? null,
    existingData: existingData && Object.keys(existingData).length > 0 ? existingData : null,
  })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
