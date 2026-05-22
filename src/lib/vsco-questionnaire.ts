// Maps our questionnaire field names to VSCO form field IDs
const TEXT_FIELDS: Record<string, string> = {
  ceremony_time:           'QF6135522',
  departure_time:          'QF6135330',
  wedding_breakfast_time:  'QF6135336',
  speeches_timing:         'QF6135525',
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
  transport:               'QF6135417',
  dj_band:                 'QF6135414',
  photo_booth:             'QF6135423',
  jeweller:                'QF6135426',
  additional_vendors:      'QF6135429',
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
    ? "Yes, we'd like a private first look"
    : "No, we'd like to wait until the ceremony"
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

export async function submitVscoQuestionnaire(
  vscoUrl: string,
  data: Record<string, string>
): Promise<void> {
  const getRes = await fetch(vscoUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  if (!getRes.ok) throw new Error(`VSCO form GET failed with status ${getRes.status}`)
  const html = await getRes.text()

  // CSRF — has extra attributes between name= and value=, so match the whole tag
  const csrfTag = html.match(/<input[^>]+name="csrf"[^>]*>/)
  const csrf = csrfTag?.[0].match(/value="([^"]+)"/)?.[1]
  if (!csrf) throw new Error('Could not find CSRF token in VSCO form')

  // FormState and FormBetas — single-quoted in the HTML
  const formState = html.match(/name="FormState"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'
  const formBetas = html.match(/name="FormBetas"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'

  // Start with ALL pre-filled input values from the form.
  // This carries through venue ContactIDs, PlaceIDs, lat/long, address components
  // etc. that VSCO pre-populates from its own database — without these the
  // required address field validation fails.
  const params = new URLSearchParams()
  const inputRegex = /<input([^>]*)>/g
  let m
  const SYSTEM_FIELDS = new Set(['csrf', 'FormState', 'FormBetas', 'FormAction', 'Continue', 'Save', 'Delete', 'Cancel'])
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

  // Plain text fields
  for (const [ourField, vscoId] of Object.entries(TEXT_FIELDS)) {
    params.set(vscoId, data[ourField] ?? '')
  }

  // Hot meal checkbox (only sent when yes)
  params.delete('QF7828059[]')
  if (data.hot_meal_arranged === 'yes') {
    params.append('QF7828059[]', 'Yes')
  }

  // System fields
  params.set('csrf', csrf)
  params.set('FormAction', 'Continue')
  params.set('FormState', formState)
  params.set('FormBetas', formBetas)
  params.set('Continue', 'Continue')

  const postRes = await fetch(vscoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': new URL(vscoUrl).origin,
      'Referer': vscoUrl,
    },
    body: params.toString(),
    redirect: 'follow',
  })

  if (!postRes.ok) {
    throw new Error(`VSCO form POST failed with status ${postRes.status}`)
  }

  const responseText = await postRes.text()
  if (responseText.includes('formErrorMessage') || responseText.includes('Please complete all required fields')) {
    throw new Error('VSCO form validation failed — required fields not satisfied')
  }

  console.log(`[VSCO questionnaire] Submitted successfully — final URL: ${postRes.url}`)
}
