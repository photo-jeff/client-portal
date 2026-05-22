// Maps our questionnaire field names to VSCO form field IDs
const TEXT_FIELDS: Record<string, string> = {
  // speeches_timing and time fields handled separately (need value mapping / format conversion)
  emergency_contact:       'QF7826772',
  names_for_slideshow:     'QF6135369',
  aisle_escort:            'QF7776981',
  first_dance_song:        'QF6135372',
  choreographed_dance:     'QF6135528',
  unique_elements:         'QF6135378',
  honeymoon_plans:         'QF6135390',
  social_media:            'QF8902296',
  hashtag:                 'QF6135375',
  venue_contact:           'QF6135396',
  wedding_planner:         'QF6135399',
  wedding_dress:           'QF6135444',
  groom_suit:              'QF6135519',
  makeup_artist:           'QF6135405',
  hair_stylist:            'QF6135438',
  florist:                 'QF6135408',
  venue_styling:           'QF6135447',
  cake:                    'QF6135420',
  videographer:            'QF6135411',
  stationery:              'QF6135432',
  // QF6135417 = Catering Company (not in our questionnaire, left as pre-filled)
  transport:               'QF6135414',  // Cars/Transportation
  dj_band:                 'QF6135423',  // DJ or Band
  photo_booth:             'QF6135426',  // Photo Booth
  jeweller:                'QF6135429',  // Jeweller
  additional_vendors:      'QF6135435',  // Are there any additional vendors to include?
}

// Time fields — VSCO expects 12-hour format e.g. "2:00pm"
// QF6135330 = Ceremony Start Time (REQUIRED)
// QF6135522 = Departure time (time leaving getting-ready location)
// QF6135336 = Wedding Breakfast Start Time (REQUIRED)
const TIME_FIELDS: Record<string, string> = {
  ceremony_time:          'QF6135330',
  departure_time:         'QF6135522',
  wedding_breakfast_time: 'QF6135336',
}

// Location fields — only the _Name sub-field is overridden; all other sub-fields
// (ContactID, PlaceID, Lat/Long, postal address components) are carried through
// from VSCO's pre-filled form values so required validation passes.
const ADDRESS_NAME_FIELDS: Record<string, string> = {
  bride_prep_address:  'QF6135318',
  groom_prep_address:  'QF6135321',
  ceremony_location:   'QF6135327',
  reception_location:  'QF6135333',
}

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
  return val
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

function buildParams(html: string, data: Record<string, string>): URLSearchParams {
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
    // Skip checkbox arrays — we handle QF7828059[] explicitly
    if (name.endsWith('[]')) continue
    const valueMatch = attrs.match(/value="([^"]*)"/)
    const value = valueMatch ? decodeHtmlEntities(valueMatch[1]) : ''
    params.append(name, value)
  }

  // Override address _Name fields with our questionnaire answers
  for (const [ourField, vscoId] of Object.entries(ADDRESS_NAME_FIELDS)) {
    const text = data[ourField]
    if (text) params.set(`${vscoId}_Name`, text)
  }

  // First look dropdown
  params.set('QF6135324', mapFirstLook(data.first_look))

  // Speeches timing dropdown
  params.set('QF6135525', mapSpeeches(data.speeches_timing))

  // Time fields (12-hour format)
  for (const [ourField, vscoId] of Object.entries(TIME_FIELDS)) {
    params.set(vscoId, toVscoTime(data[ourField]))
  }

  // Plain text fields
  for (const [ourField, vscoId] of Object.entries(TEXT_FIELDS)) {
    params.set(vscoId, data[ourField] ?? '')
  }

  // Hot meal checkbox (only sent when yes)
  params.delete('QF7828059[]')
  if (data.hot_meal_arranged === 'yes') {
    params.append('QF7828059[]', 'Yes')
  }

  return params
}

export async function submitVscoQuestionnaire(
  vscoUrl: string,
  data: Record<string, string>
): Promise<void> {
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

    const params = buildParams(html, data)
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

    if (html.includes('formErrorMessage') || html.includes('Please complete all required fields')) {
      throw new Error(`VSCO form validation failed on page ${page}`)
    }

    console.log(`[VSCO questionnaire] Page ${page} submitted — URL: ${currentUrl}`)
  }

  throw new Error('VSCO form exceeded maximum page limit — may be stuck in a loop')
}
