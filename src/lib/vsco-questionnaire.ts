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

// Location fields — address text goes in _Name, geo sub-fields left empty
const ADDRESS_FIELDS: Record<string, string> = {
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

export async function submitVscoQuestionnaire(
  vscoUrl: string,
  data: Record<string, string>
): Promise<void> {
  // GET the form page to extract CSRF token and hidden system fields
  const getRes = await fetch(vscoUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  if (!getRes.ok) throw new Error(`VSCO form GET failed with status ${getRes.status}`)
  const html = await getRes.text()

  // Forward cookies from GET into POST (VSCO may tie CSRF token to a session cookie)
  const setCookie = getRes.headers.get('set-cookie')
  const cookieHeader = setCookie
    ? setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ')
    : ''

  // CSRF input has extra attributes between name= and value=, so match the whole tag first
  const csrfTag = html.match(/<input[^>]+name="csrf"[^>]*>/)
  const csrf = csrfTag?.[0].match(/value="([^"]+)"/)?.[1]
  if (!csrf) throw new Error('Could not find CSRF token in VSCO form')

  // FormState and FormBetas are single-quoted in the HTML
  const formState = html.match(/name="FormState"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'
  const formBetas = html.match(/name="FormBetas"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'

  const params = new URLSearchParams()

  // Address compound fields — name only, no geo data
  for (const [ourField, vscoId] of Object.entries(ADDRESS_FIELDS)) {
    const text = data[ourField] ?? ''
    params.append(`${vscoId}_ContactID`, '')
    params.append(`${vscoId}_PlaceID`, '')
    params.append(`${vscoId}_Lat`, '')
    params.append(`${vscoId}_Long`, '')
    params.append(`${vscoId}_TimezoneID`, '')
    params.append(`${vscoId}_EditableMode`, '')
    params.append(`${vscoId}_Name`, text)
    params.append(`${vscoId}_Street`, '')
    params.append(`${vscoId}_Village`, '')
    params.append(`${vscoId}_City`, '')
    params.append(`${vscoId}_State`, '')
    params.append(`${vscoId}_Postal`, '')
    params.append(`${vscoId}_Country`, '')
  }

  // First look dropdown
  params.append('QF6135324', mapFirstLook(data.first_look))

  // Plain text fields
  for (const [ourField, vscoId] of Object.entries(TEXT_FIELDS)) {
    params.append(vscoId, data[ourField] ?? '')
  }

  // Hot meal checkbox (only sent when yes)
  if (data.hot_meal_arranged === 'yes') {
    params.append('QF7828059[]', 'Yes')
  }

  // System fields from the form HTML
  params.append('csrf', csrf)
  params.append('FormAction', 'Continue')
  params.append('FormState', formState)
  params.append('FormBetas', formBetas)
  params.append('Continue', 'Continue')

  const postRes = await fetch(vscoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': new URL(vscoUrl).origin,
      'Referer': vscoUrl,
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    },
    body: params.toString(),
    redirect: 'follow',
  })

  if (!postRes.ok) {
    throw new Error(`VSCO form POST failed with status ${postRes.status}`)
  }
  console.log(`[VSCO questionnaire] Submitted successfully — final URL: ${postRes.url}`)
}
