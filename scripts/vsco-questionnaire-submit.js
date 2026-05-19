/**
 * VSCO questionnaire form submission handler.
 *
 * Add this to your Mac webhook.js as a route:
 *
 *   const { submitVscoQuestionnaire } = require('./vsco-questionnaire-submit')
 *   app.post('/vsco-questionnaire', express.json(), async (req, res) => {
 *     res.json({ ok: true })  // respond immediately
 *     submitVscoQuestionnaire(req.body).catch(console.error)
 *   })
 *
 * Payload: { vsco_questionnaire_url: string, data: { ...questionnaireFields } }
 */

// Maps our questionnaire field names to VSCO field IDs
const TEXT_FIELDS = {
  ceremony_time:        'QF6135522',
  departure_time:       'QF6135330',
  wedding_breakfast_time: 'QF6135336',
  speeches_timing:      'QF6135525',
  emergency_contact:    'QF7826772',
  names_for_slideshow:  'QF6135369',
  aisle_escort:         'QF7776981',
  first_dance_song:     'QF6135372',
  choreographed_dance:  'QF6135528',
  unique_elements:      'QF6135378',
  honeymoon_plans:      'QF6135390',
  social_media:         'QF8902296',
  hashtag:              'QF6135375',
  venue_contact:        'QF6135396',
  wedding_planner:      'QF6135399',
  wedding_dress:        'QF6135444',
  groom_suit:           'QF6135519',
  makeup_artist:        'QF6135405',
  hair_stylist:         'QF6135438',
  florist:              'QF6135408',
  venue_styling:        'QF6135447',
  cake:                 'QF6135420',
  videographer:         'QF6135411',
  stationery:           'QF6135432',
  transport:            'QF6135417',
  dj_band:              'QF6135414',
  photo_booth:          'QF6135423',
  jeweller:             'QF6135426',
  additional_vendors:   'QF6135429',
}

// Address compound fields — we put the full address text in _Name, leave geo empty
const ADDRESS_FIELDS = {
  bride_prep_address:  'QF6135318',
  groom_prep_address:  'QF6135321',
  ceremony_location:   'QF6135327',
  reception_location:  'QF6135333',
}

// first_look maps our "yes"/"no" to VSCO's dropdown text
function mapFirstLook(val) {
  if (!val) return ''
  return val.toLowerCase() === 'yes'
    ? "Yes, we'd like a private first look"
    : "No, we'd like to wait until the ceremony"
}

async function submitVscoQuestionnaire({ vsco_questionnaire_url, data }) {
  // 1. GET the form to extract CSRF token and hidden fields
  const getRes = await fetch(vsco_questionnaire_url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  const html = await getRes.text()

  const csrf = (html.match(/name="csrf"\s+value="([^"]+)"/) || [])[1]
  if (!csrf) throw new Error('Could not find CSRF token in VSCO form')

  const formStateMatch = html.match(/name="FormState"\s+value="([^"]*)"/)
  const formState = formStateMatch ? formStateMatch[1].replace(/&quot;/g, '"') : '{}'

  const formBetasMatch = html.match(/name="FormBetas"\s+value="([^"]*)"/)
  const formBetas = formBetasMatch ? formBetasMatch[1].replace(/&quot;/g, '"') : '{}'

  // 2. Build the form body
  const params = new URLSearchParams()

  // Address fields: put address text in _Name, leave geo fields empty
  for (const [ourField, vscoId] of Object.entries(ADDRESS_FIELDS)) {
    const addressText = data[ourField] || ''
    params.append(`${vscoId}_ContactID`, '')
    params.append(`${vscoId}_PlaceID`, '')
    params.append(`${vscoId}_Lat`, '')
    params.append(`${vscoId}_Long`, '')
    params.append(`${vscoId}_TimezoneID`, '')
    params.append(`${vscoId}_EditableMode`, '')
    params.append(`${vscoId}_Name`, addressText)
    params.append(`${vscoId}_Street`, '')
    params.append(`${vscoId}_Village`, '')
    params.append(`${vscoId}_City`, '')
    params.append(`${vscoId}_State`, '')
    params.append(`${vscoId}_Postal`, '')
    params.append(`${vscoId}_Country`, '')
  }

  // First look (dropdown)
  params.append('QF6135324', mapFirstLook(data.first_look))

  // Text fields
  for (const [ourField, vscoId] of Object.entries(TEXT_FIELDS)) {
    params.append(vscoId, data[ourField] || '')
  }

  // Hot meal arranged (checkbox — only include if yes)
  if (data.hot_meal_arranged === 'yes') {
    params.append('QF7828059[]', 'Yes')
  }

  // System fields
  params.append('csrf', csrf)
  params.append('FormAction', 'Continue')
  params.append('FormState', formState)
  params.append('FormBetas', formBetas)
  params.append('Continue', 'Continue')

  // 3. POST the form
  const postRes = await fetch(vsco_questionnaire_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': new URL(vsco_questionnaire_url).origin,
      'Referer': vsco_questionnaire_url,
    },
    body: params.toString(),
    redirect: 'follow',
  })

  if (!postRes.ok && postRes.status !== 302) {
    throw new Error(`VSCO form POST failed: ${postRes.status}`)
  }

  console.log(`[VSCO] Questionnaire submitted successfully for ${vsco_questionnaire_url}`)
}

module.exports = { submitVscoQuestionnaire }
