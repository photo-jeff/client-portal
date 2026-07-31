import type { CoupleType } from './couple-type'

// Jeff runs three separate VSCO questionnaire templates — VSCO can't branch a
// single form on couple type. Each template has its own field IDs, and they
// differ in substance, not just numbering: BB/GG collapse the two garment
// fields into one, GG has no make-up/hair fields, and only BB/GG ask about
// surname changes. Full comparison lives in docs/vsco-field-maps.md.
//
// IDs are NOT guessable from the form they belong to — VSCO allocates them
// globally, so fields added in July 2026 sit in the QF10023xxx range on all
// three templates. Partner order also doesn't follow ID order. Always trust
// this map over any apparent pattern.

interface FormSpec {
  /** Location fields — only the _Name sub-field is overridden (see buildParams). */
  address: Record<string, string>
  /** Time fields — VSCO expects 12-hour format e.g. "2:00pm". */
  time: Record<string, string>
  /** Plain text fields. */
  text: Record<string, string>
  firstLook: string
  speeches: string
  /** Checkbox array field, given without the trailing "[]". */
  hotMeal: string
  ceremonyAddress: string
  receptionAddress: string
  /**
   * BB and GG have a single combined garment field ("Dresses/Suits" and
   * "Suits"). When set, wedding_dress and groom_suit are merged into it and
   * neither is sent separately.
   */
  combinedGarments?: string
}

const BG: FormSpec = {
  address: {
    bride_prep_address: 'QF6135318',
    groom_prep_address: 'QF6135321',
    ceremony_location:  'QF6135327',
    reception_location: 'QF6135333',
  },
  time: {
    // QF6135522 (the old single departure field) was retired when Jeff split it
    // per partner in July 2026. It survives only in the form's internal state
    // blob, so anything written to it is silently discarded.
    departure_time:         'QF10023144',
    departure_time_2:       'QF10023142',
    ceremony_time:          'QF6135330',
    wedding_breakfast_time: 'QF6135336',
  },
  text: {
    emergency_contact:   'QF7826772',
    names_for_slideshow: 'QF6135369',
    aisle_escort:        'QF7776981',
    first_dance_song:    'QF6135372',
    choreographed_dance: 'QF6135528',
    unique_elements:     'QF6135378',
    honeymoon_plans:     'QF6135390',
    social_media:        'QF8902296',
    hashtag:             'QF6135375',
    venue_contact:       'QF6135396',
    wedding_planner:     'QF6135399',
    wedding_dress:       'QF6135444',
    groom_suit:          'QF6135519',
    makeup_artist:       'QF6135405',
    hair_stylist:        'QF6135438',
    florist:             'QF6135408',
    venue_styling:       'QF6135447',
    cake:                'QF6135420',
    videographer:        'QF6135411',
    stationery:          'QF6135432',
    transport:           'QF6135414',
    dj_band:             'QF6135423',
    photo_booth:         'QF6135426',
    jeweller:            'QF6135429',
    additional_vendors:  'QF6135435',
    // QF6135417 = Catering Company — not collected, left as pre-filled
  },
  firstLook:       'QF6135324',
  speeches:        'QF6135525',
  hotMeal:         'QF7828059',
  ceremonyAddress: 'QF6135327',
  receptionAddress:'QF6135333',
}

const BB: FormSpec = {
  address: {
    bride_prep_address: 'QF10022138',
    groom_prep_address: 'QF10022140',
    ceremony_location:  'QF10022144',
    reception_location: 'QF10022152',
  },
  time: {
    departure_time:         'QF10022146',
    departure_time_2:       'QF10022148',
    ceremony_time:          'QF10022150',
    wedding_breakfast_time: 'QF10022156',
    // QF10022154 = Wedding Breakfast Call In Time — not collected by the portal
  },
  text: {
    emergency_contact:   'QF10022162',
    surname_change:      'QF10022166',
    names_for_slideshow: 'QF10022168',
    aisle_escort:        'QF10023108',
    first_dance_song:    'QF10022172',
    choreographed_dance: 'QF10022174',
    unique_elements:     'QF10022176',
    honeymoon_plans:     'QF10022178',
    social_media:        'QF10023130',
    hashtag:             'QF10022180',
    venue_contact:       'QF10022184',
    wedding_planner:     'QF10022186',
    makeup_artist:       'QF10023126',
    hair_stylist:        'QF10023128',
    florist:             'QF10022190',
    venue_styling:       'QF10022192',
    cake:                'QF10022194',
    videographer:        'QF10022196',
    stationery:          'QF10022198',
    transport:           'QF10022202',
    dj_band:             'QF10022204',
    photo_booth:         'QF10022206',
    jeweller:            'QF10022208',
    additional_vendors:  'QF10022210',
  },
  combinedGarments:'QF10022188',
  firstLook:       'QF10022142',
  speeches:        'QF10022160',
  hotMeal:         'QF10022158',
  ceremonyAddress: 'QF10022144',
  receptionAddress:'QF10022152',
}

const GG: FormSpec = {
  address: {
    // Partner 1 is the HIGHER id here — do not infer order from the numbering.
    bride_prep_address: 'QF8401363',
    groom_prep_address: 'QF8401361',
    ceremony_location:  'QF8401367',
    reception_location: 'QF8401373',
  },
  time: {
    departure_time:         'QF8401561',
    departure_time_2:       'QF8401437',
    ceremony_time:          'QF8401371',
    wedding_breakfast_time: 'QF8401375',
    // QF8401439 = Wedding Breakfast Call In Time — not collected by the portal
  },
  text: {
    emergency_contact:   'QF8401381',
    surname_change:      'QF8401435',
    names_for_slideshow: 'QF8401385',
    aisle_escort:        'QF8401387',
    first_dance_song:    'QF8401389',
    choreographed_dance: 'QF8401391',
    unique_elements:     'QF8401393',
    honeymoon_plans:     'QF8401395',
    social_media:        'QF10023132',
    hashtag:             'QF8401397',
    venue_contact:       'QF8401401',
    wedding_planner:     'QF8401403',
    florist:             'QF8401413',
    venue_styling:       'QF8401415',
    cake:                'QF8401417',
    videographer:        'QF8401419',
    stationery:          'QF8401421',
    transport:           'QF8401425',
    dj_band:             'QF8401427',
    photo_booth:         'QF8401429',
    jeweller:            'QF8401431',
    additional_vendors:  'QF8401433',
    // No make-up or hair fields on this form — the portal doesn't ask for them.
  },
  combinedGarments:'QF8401407',
  firstLook:       'QF8401365',
  speeches:        'QF8401379',
  hotMeal:         'QF8401377',
  ceremonyAddress: 'QF8401367',
  receptionAddress:'QF8401373',
}

const FORMS: Record<CoupleType, FormSpec> = { bg: BG, bb: BB, gg: GG }

function mapFirstLook(val: string | undefined): string {
  if (!val) return ''
  return val.toLowerCase() === 'yes'
    ? "Yes, we want to capture a first look"
    : "No, we'd like to wait until the ceremony"
}

function mapSpeeches(val: string | undefined): string {
  if (!val) return ''
  const lower = val.toLowerCase()
  if (lower.includes('after')) return 'After the meal'
  if (lower.includes('before')) return 'Before the meal'
  // VSCO's required dropdown only offers Before / After / Other — the portal
  // also lets couples pick "during", which has no VSCO equivalent. Anything
  // that isn't before/after maps to "Other" so the form passes validation
  // (sending an off-list value fails the whole page silently).
  return 'Other'
}

function toVscoTime(val: string | undefined): string {
  if (!val) return ''
  if (/[ap]m$/i.test(val)) return val
  const match = val.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return val
  let hour = parseInt(match[1])
  const min = match[2]
  const suffix = hour >= 12 ? 'pm' : 'am'
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12
  return `${hour}:${min}${suffix}`
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function extractCsrf(html: string): string | null {
  const csrfTag = html.match(/<input[^>]+name="csrf"[^>]*>/)
  return csrfTag?.[0].match(/value="([^"]+)"/)?.[1] ?? null
}

// VSCO text inputs enforce a maxlength (usually 255). Submitting a longer value
// fails server-side validation for the WHOLE page with the generic "Please
// complete all required fields" message — so one over-long answer (e.g. a
// detailed "unique elements" note) silently breaks the entire sync. Clamp each
// value to the field's own maxlength so the form always validates.
function getMaxLength(html: string, fieldId: string): number | null {
  const tag = html.match(new RegExp(`<input[^>]*name="${fieldId}"[^>]*>`))
  const ml = tag?.[0].match(/maxlength="(\d+)"/)
  return ml ? parseInt(ml[1], 10) : null
}

function buildParams(html: string, data: Record<string, string>, form: FormSpec): URLSearchParams {
  const params = new URLSearchParams()
  const SYSTEM_FIELDS = new Set(['csrf', 'FormState', 'FormBetas', 'FormAction', 'Continue', 'Save', 'Delete', 'Cancel'])
  const inputRegex = /<input([^>]*)>/g
  let m

  // Start with ALL pre-filled input values from the form.
  // This carries through venue ContactIDs, PlaceIDs, lat/long, address components
  // etc. that VSCO pre-populates from its own database — without these the
  // required address field validation fails.
  while ((m = inputRegex.exec(html)) !== null) {
    const attrs = m[1]
    const nameMatch = attrs.match(/name="([^"]+)"/)
    if (!nameMatch) continue
    const name = nameMatch[1]
    if (SYSTEM_FIELDS.has(name)) continue
    // Skip checkbox arrays — the hot meal field is handled explicitly below
    if (name.endsWith('[]')) continue
    const valueMatch = attrs.match(/value="([^"]*)"/)
    const value = valueMatch ? decodeHtmlEntities(valueMatch[1]) : ''
    params.append(name, value)
  }

  // Also extract currently-selected values from <select> elements (e.g. Country dropdowns).
  // These are not <input> tags so the loop above misses them.
  const selectRegex = /<select[^>]+name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g
  while ((m = selectRegex.exec(html)) !== null) {
    const name = m[1]
    if (SYSTEM_FIELDS.has(name)) continue
    const optContent = m[2]
    const selOptMatch = optContent.match(/<option([^>]*selected[^>]*)>/)
    if (selOptMatch) {
      const valMatch = selOptMatch[1].match(/value="([^"]*)"/)
      if (valMatch) params.append(name, decodeHtmlEntities(valMatch[1]))
    }
  }

  // Override address _Name fields with our questionnaire answers
  for (const [ourField, vscoId] of Object.entries(form.address)) {
    const text = data[ourField]
    if (text) params.set(`${vscoId}_Name`, text)
  }

  // VSCO only pre-fills venue sub-fields (City, Postal, PlaceID etc.) for the ceremony
  // location from its own database. The reception location often has the same venue
  // but VSCO leaves its sub-fields blank. Copy ceremony sub-fields to reception when
  // the reception ones are missing — required City/Postal otherwise fail validation.
  const venueSubs = ['_City', '_Postal', '_Lat', '_Long', '_PlaceID', '_State', '_Village', '_ContactID', '_TimezoneID', '_Country']
  for (const sub of venueSubs) {
    const ceremony = params.get(`${form.ceremonyAddress}${sub}`) ?? ''
    if (ceremony && !params.get(`${form.receptionAddress}${sub}`)) {
      params.set(`${form.receptionAddress}${sub}`, ceremony)
    }
  }

  // First look dropdown
  params.set(form.firstLook, mapFirstLook(data.first_look))

  // Speeches timing dropdown
  params.set(form.speeches, mapSpeeches(data.speeches_timing))

  // Time fields (12-hour format)
  for (const [ourField, vscoId] of Object.entries(form.time)) {
    params.set(vscoId, toVscoTime(data[ourField]))
  }

  const setText = (vscoId: string, raw: string) => {
    let value = raw ?? ''
    const max = getMaxLength(html, vscoId)
    if (max && value.length > max) value = value.slice(0, max)
    params.set(vscoId, value)
  }

  // Plain text fields — clamped to VSCO's per-field maxlength (see getMaxLength)
  for (const [ourField, vscoId] of Object.entries(form.text)) {
    setText(vscoId, data[ourField] ?? '')
  }

  // BB/GG: one field covers both partners' outfits. The portal asks a single
  // question for these couples, but join defensively in case a record carries
  // both keys (e.g. a couple type changed after the questionnaire was started).
  if (form.combinedGarments) {
    const combined = [data.wedding_dress, data.groom_suit]
      .map(v => (v ?? '').trim())
      .filter(Boolean)
      .join(' · ')
    setText(form.combinedGarments, combined)
  }

  // Hot meal checkbox (only sent when yes)
  params.delete(`${form.hotMeal}[]`)
  if (data.hot_meal_arranged === 'yes') {
    params.append(`${form.hotMeal}[]`, 'Yes')
  }

  return params
}

export async function submitVscoQuestionnaire(
  vscoUrl: string,
  data: Record<string, string>,
  coupleType: CoupleType = 'bg'
): Promise<void> {
  const form = FORMS[coupleType] ?? BG
  const origin = new URL(vscoUrl).origin
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

  const getRes = await fetch(vscoUrl, { headers: { 'User-Agent': userAgent } })
  if (!getRes.ok) throw new Error(`VSCO form GET failed with status ${getRes.status}`)
  let html = await getRes.text()
  let currentUrl = vscoUrl

  // VSCO questionnaires are multi-page. Loop until no more CSRF token (final confirmation page).
  for (let page = 1; page <= 10; page++) {
    const csrf = extractCsrf(html)
    if (!csrf) {
      console.log(`[VSCO questionnaire] All pages submitted — completed after page ${page - 1}`)
      return
    }

    const formState = html.match(/name="FormState"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'
    const formBetas = html.match(/name="FormBetas"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'

    const params = buildParams(html, data, form)
    params.set('csrf', csrf)
    params.set('FormAction', 'Continue')
    params.set('FormState', formState)
    params.set('FormBetas', formBetas)
    params.set('Continue', 'Continue')

    const postRes = await fetch(currentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
        'Origin': origin,
        'Referer': currentUrl,
      },
      body: params.toString(),
      redirect: 'follow',
    })

    if (!postRes.ok) {
      throw new Error(`VSCO form POST failed on page ${page} with status ${postRes.status}`)
    }

    html = await postRes.text()
    currentUrl = postRes.url

    if (html.includes('Please complete all required fields')) {
      throw new Error(`VSCO form validation failed on page ${page}`)
    }

    console.log(`[VSCO questionnaire] Page ${page} submitted — URL: ${currentUrl}`)
  }

  throw new Error('VSCO form exceeded maximum page limit — may be stuck in a loop')
}
