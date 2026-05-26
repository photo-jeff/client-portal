function decodeHtmlEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function extractCsrf(html: string): string | null {
  const csrfTag = html.match(/<input[^>]+name="csrf"[^>]*>/)
  return csrfTag?.[0].match(/value="([^"]+)"/)?.[1] ?? null
}

/**
 * Builds the POST params for the shot list form.
 * Carries through all pre-filled input/select values (just like the questionnaire),
 * then finds the first textarea (the shot list content field) and fills it.
 */
function buildParams(html: string, shotListText: string): URLSearchParams {
  const params = new URLSearchParams()
  const SYSTEM_FIELDS = new Set(['csrf', 'FormState', 'FormBetas', 'FormAction', 'Continue', 'Save', 'Delete', 'Cancel'])

  // Carry through all pre-filled <input> values
  const inputRegex = /<input([^>]*)>/g
  let m
  while ((m = inputRegex.exec(html)) !== null) {
    const attrs = m[1]
    const nameMatch = attrs.match(/name="([^"]+)"/)
    if (!nameMatch) continue
    const name = nameMatch[1]
    if (SYSTEM_FIELDS.has(name)) continue
    if (name.endsWith('[]')) continue
    const valueMatch = attrs.match(/value="([^"]*)"/)
    const value = valueMatch ? decodeHtmlEntities(valueMatch[1]) : ''
    params.append(name, value)
  }

  // Carry through selected <select> values
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

  // Find the first textarea and fill it with the shot list text.
  // VSCO shot list forms typically have a single large textarea for the content.
  const textareaRegex = /<textarea[^>]+name="([^"]+)"[^>]*>/g
  let textareaFilled = false
  while ((m = textareaRegex.exec(html)) !== null) {
    const name = m[1]
    if (SYSTEM_FIELDS.has(name)) continue
    params.set(name, shotListText)
    textareaFilled = true
    break  // only fill the first content textarea
  }

  // Fallback: if no textarea found, look for a QF* text input that looks like
  // a notes/text field (no sub-field suffix like _Name, _City, etc.)
  if (!textareaFilled) {
    const qfInputRegex = /<input[^>]+name="(QF\d+)"[^>]*type="(?:text|hidden)"[^>]*>/g
    while ((m = qfInputRegex.exec(html)) !== null) {
      const name = m[1]
      params.set(name, shotListText)
      console.log(`[VSCO shot list] No textarea found — filled input field: ${name}`)
      break
    }
  }

  return params
}

export async function submitVscoShotList(vscoUrl: string, shotListText: string): Promise<void> {
  const origin = new URL(vscoUrl).origin
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

  const getRes = await fetch(vscoUrl, { headers: { 'User-Agent': userAgent } })
  if (!getRes.ok) throw new Error(`VSCO form GET failed with status ${getRes.status}`)
  let html = await getRes.text()
  let currentUrl = vscoUrl

  // VSCO forms may be multi-page — loop until no CSRF token (final confirmation page)
  for (let page = 1; page <= 10; page++) {
    const csrf = extractCsrf(html)
    if (!csrf) {
      console.log(`[VSCO shot list] All pages submitted — completed after page ${page - 1}`)
      return
    }

    const formState = html.match(/name="FormState"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'
    const formBetas = html.match(/name="FormBetas"\s+value='([^']*)'/)?.[1]?.replace(/&quot;/g, '"') ?? '{}'

    const params = buildParams(html, shotListText)
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

    console.log(`[VSCO shot list] Page ${page} submitted — URL: ${currentUrl}`)
  }

  throw new Error('VSCO form exceeded maximum page limit — may be stuck in a loop')
}
