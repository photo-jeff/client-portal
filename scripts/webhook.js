// ============================================================
// VSCO → Zoho Webhook Listener
// Jeff Oliver Photography
//
// Receives booking notifications from VSCO (via Quick Response
// email → Zapier or direct), parses and cleans the contact
// data, then creates/updates the customer in Zoho Books.
//
// Runs as a separate process alongside the MCP server.
// Exposed to the internet via Cloudflare Tunnel.
//
// START:   node /Users/jeff/mcp-workspace/webhook.js
// PORT:    3456 (configurable via WEBHOOK_PORT env var)
//
// ZOHO AUTH: Generate an API key in Zoho Books:
//   Settings → Developer Space → Self Client → Generate Token
//   Set as env var ZOHO_API_KEY or add to .env file
// ============================================================

import http from 'http';
import { URL } from 'url';
import { readFileSync, writeFileSync, existsSync, watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir      = dirname(__filename);

// ─── PRE-WED PROXY CONFIG ─────────────────────────────────────────────────────
const VSCO_API_KEY_PW  = process.env.VSCO_API_KEY || '5a2ef52b-5a26-d3da-defa-dee9ce12-95e2da252851';
const VSCO_API_PW      = 'https://workspace.vsco.co/api/v2';
const VSCO_WS_PW       = 'https://workspace.vsco.co/webservice';
const COOKIES_FILE_PW  = join(__dir, 'vsco-prewed', 'cookies.json');
const CACHE_FILE_PW    = join(__dir, 'vsco-prewed', 'job-cache.json');
const MCP_CACHE_FILE_PW = join(__dir, 'vsco-cache.json');
const CACHE_TTL_MS_PW  = 24 * 60 * 60 * 1000;

// ULID → numeric field ID (from webservice payload inspection)
const FIELD_NUMERIC_IDS_PW = {
  '01dy25qdz8pf7gsxrp69yxqa07': '529653',  // Wedding Venue
  '01efyfhwc0rchp1fkdh8af4cfg': '603180',  // Engagement Session
  '01dy5kp0pg6f44va4wpp4dv90r': '530586',  // Collection
};
const ENGAGEMENT_ULID_PW    = '01efyfhwc0rchp1fkdh8af4cfg';
const ELIGIBLE_COLS_PW      = ['Album Collection', 'Album + Frame Collection'];

let pwCache = { jobs: [], loadedAt: 0 };

// ------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------
const PORT               = process.env.WEBHOOK_PORT       || 3456;
const ZOHO_ORG           = '20063085751';
const ZOHO_BASE          = 'https://www.zohoapis.eu/books/v3';
const ZOHO_AUTH_BASE     = 'https://accounts.zoho.eu/oauth/v2';
const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID      || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET  || '';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN  || '';
const WEBHOOK_SECRET     = process.env.WEBHOOK_SECRET      || '';
const PORTAL_SECRET      = process.env.PORTAL_WEBHOOK_SECRET || '';
const PORTAL_BASE        = 'https://portal.jeffoliverphotography.com';
const SUPABASE_URL       = 'https://yuclctdwlhffqetdkdkw.supabase.co';
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// In-memory access token cache
let cachedAccessToken = '';
let tokenExpiresAt    = 0;

// ─── PRE-WED FUNCTIONS ────────────────────────────────────────────────────────

function pwLoadCookies() {
  try { return JSON.parse(readFileSync(COOKIES_FILE_PW, 'utf8')).cookies || ''; }
  catch (e) { console.error('cookies.json missing:', e.message); return ''; }
}

async function pwAPI(path) {
  const res  = await fetch(`${VSCO_API_PW}${path}`, {
    headers: { 'X-API-KEY': VSCO_API_KEY_PW, 'Accept': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return JSON.parse(text);
}

async function pwDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pwAPIRetry(path, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res  = await fetch(`${VSCO_API_PW}${path}`, {
        headers: { 'X-API-KEY': VSCO_API_KEY_PW, 'Accept': 'application/json' },
      });
      if (res.status === 429) {
        console.log(`  Rate limited on ${path} — waiting 5s...`);
        await pwDelay(5000);
        continue;
      }
      const text = await res.text();
      if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
      return JSON.parse(text);
    } catch (e) {
      if (i === retries - 1) throw e;
      await pwDelay(2000);
    }
  }
}

async function pwBuildCache() {
  console.log('Building Pre-Wed cache from MCP job cache...');
  const today   = new Date().toISOString().split('T')[0];
  const cookies = pwLoadCookies();

  // Read from the MCP server's existing cache
  let allJobs = [];
  try {
    const raw  = readFileSync(MCP_CACHE_FILE_PW, 'utf8');
    const data = JSON.parse(raw);
    allJobs    = data.jobs || [];
    console.log(`Read ${allJobs.length} jobs from MCP cache`);
  } catch (e) {
    console.error('Failed to read MCP cache:', e.message);
    return [];
  }

  // Filter to eligible jobs
  const eligible = allJobs.filter(j => {
    if (j.stage !== 'booked' || j.jobTypeName !== 'Wedding Photography') return false;
    if ((j.eventDate || '') <= today) return false;
    const col = (j.customFields || []).find(f => f.fieldId === '01dy5kp0pg6f44va4wpp4dv90r')?.value || '';
    if (!ELIGIBLE_COLS_PW.includes(col)) return false;
    const href = j.links?.self?.managerHref || '';
    const numId = href.split('/').pop();
    if (!numId || !/^\d+$/.test(numId)) return false;
    return true;
  });
  console.log(`Found ${eligible.length} eligible future weddings — fetching contacts & field IDs...`);

  const jobs = [];
  for (const job of eligible) {
    const managerHref  = job.links?.self?.managerHref || '';
    const numericJobId = managerHref.split('/').pop();
    const colField     = (job.customFields || []).find(f => f.fieldId === '01dy5kp0pg6f44va4wpp4dv90r');
    const engField     = (job.customFields || []).find(f => f.fieldId === ENGAGEMENT_ULID_PW);

    const fieldInst = (job.customFields || [])
      .filter(f => FIELD_NUMERIC_IDS_PW[f.fieldId])
      .map(f => ({
        numericFieldId:    FIELD_NUMERIC_IDS_PW[f.fieldId],
        numericInstanceId: null,
        currentValue:      f.value,
      }));

    // 1. Fetch contact emails
    const emails = [], firstNames = [];
    try {
      const jc = await pwAPIRetry(`/job-contact?jobId=${job.id}`);
      for (const item of (jc?.items || [])) {
        const cHref = item.links?.contactId?.href || '';
        const cId   = cHref.split('/').pop();
        if (!cId) continue;
        try {
          const c = await pwAPIRetry(`/address-book/${cId}`);
          if (c?.email)     emails.push(c.email.toLowerCase());
          if (c?.firstName) firstNames.push(c.firstName.toLowerCase());
        } catch { /* skip */ }
        await pwDelay(500);
      }
    } catch { /* skip */ }

    // 2. Fetch numeric instance IDs from manager page
    try {
      const pageRes = await fetch(`https://workspace.vsco.co/jobs/view/${numericJobId}`, {
        headers: { 'Cookie': cookies, 'Accept': 'text/html' },
      });
      const html = await pageRes.text();
      const ids  = [...new Set([...html.matchAll(/CustomFieldValue\.(\d+)/g)].map(m => m[1]))];
      fieldInst.forEach((inst, i) => { inst.numericInstanceId = ids[i] || null; });
    } catch (e) {
      console.error(`  Could not fetch instance IDs for ${job.name}: ${e.message}`);
    }

    jobs.push({
      id: job.id, numericJobId, name: job.name || '',
      eventDate: job.eventDate, collection: colField?.value || '',
      engStatus: engField?.value || 'Not Yet Booked',
      fieldInstances: fieldInst, emails, firstNames,
    });

    const hasIds = fieldInst.every(f => f.numericInstanceId);
    console.log(`  ${job.name} (${job.eventDate}) — ${emails.join(', ') || 'NO EMAIL'} — IDs: ${hasIds ? '✅' : '⚠️ missing'}`);
    await pwDelay(500);
  }

  pwCache = { jobs, loadedAt: Date.now() };
  try {
    writeFileSync(CACHE_FILE_PW, JSON.stringify({ ...pwCache, loadedAt: new Date().toISOString() }, null, 2));
  } catch { /* ignore */ }
  console.log(`Pre-Wed cache: ${jobs.length} jobs cached`);
  return jobs;
}

async function pwEnsureCache() {
  if (Date.now() - pwCache.loadedAt > CACHE_TTL_MS_PW || !pwCache.jobs.length) await pwBuildCache();
}

async function pwFetchNumericInstanceIds(numericJobId) {
  const cookies = pwLoadCookies();
  const res     = await fetch(`https://workspace.vsco.co/jobs/view/${numericJobId}`, {
    headers: { 'Cookie': cookies, 'Accept': 'text/html' },
  });
  const html    = await res.text();
  return [...new Set([...html.matchAll(/CustomFieldValue\.(\d+)/g)].map(m => m[1]))];
}

async function pwFindJob(email, name) {
  await pwEnsureCache();
  if (email) {
    const m = pwCache.jobs.find(j => j.emails.includes(email));
    if (m) { console.log(`Email match: ${email} → "${m.name}"`); return m; }
    console.log(`No email match for ${email}`);
  }
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0].toLowerCase(), last = parts[parts.length - 1].toLowerCase();
    const hits  = pwCache.jobs.filter(j => { const jn = j.name.toLowerCase(); return jn.includes(first) && jn.includes(last); });
    if (hits.length === 1) { console.log(`Name match: "${name}" → "${hits[0].name}"`); return hits[0]; }
    if (hits.length > 1)   { console.error(`Ambiguous name match for "${name}"`); return null; }
  }
  console.log(`No match: email="${email}" name="${name}"`);
  return null;
}

async function pwProcessBooking(email, name, shootDate, newStatus) {
  const job = await pwFindJob(email, name);
  if (!job) return { matched: false, reason: 'No matching booked wedding found' };

  if (job.fieldInstances.some(f => !f.numericInstanceId)) {
    console.log(`⚠️  ${job.name} missing instance IDs — fetching from manager page...`);
    try {
      const cookies = pwLoadCookies();
      const pageRes = await fetch(`https://workspace.vsco.co/jobs/view/${job.numericJobId}`, {
        headers: { 'Cookie': cookies, 'Accept': 'text/html' },
      });
      const html = await pageRes.text();
      const ids  = [...new Set([...html.matchAll(/CustomFieldValue\.(\d+)/g)].map(m => m[1]))];
      job.fieldInstances.forEach((inst, i) => { inst.numericInstanceId = ids[i] || null; });
      try { writeFileSync(CACHE_FILE_PW, JSON.stringify({ ...pwCache, loadedAt: new Date().toISOString() }, null, 2)); } catch { /* ignore */ }
    } catch (e) {
      throw new Error(`Could not resolve instance IDs for ${job.name}: ${e.message}`);
    }
  }

  if (job.fieldInstances.some(f => !f.numericInstanceId))
    throw new Error(`Instance IDs still missing for job ${job.numericJobId} — check cookies`);

  const cookies = pwLoadCookies();
  const values  = job.fieldInstances.map(inst => ({
    id:    `CustomFieldValue.${inst.numericInstanceId}`,
    field: `CustomField.${inst.numericFieldId}`,
    value: inst.numericFieldId === '603180' ? newStatus : inst.currentValue,
  }));
  const payload = { context: `Job.${job.numericJobId}`, values };
  const body    = `ActionID=JSON=${encodeURIComponent(JSON.stringify(payload))}`;

  const wsRes = await fetch(`${VSCO_WS_PW}?Action=Settings/CustomField/SaveValues&ajax=1`, {
    method: 'POST',
    headers: {
      'Cookie': cookies, 'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `https://workspace.vsco.co/jobs/view/${job.numericJobId}`,
      'Origin': 'https://workspace.vsco.co',
    },
    body,
  });
  const wsText = await wsRes.text();
  if (!wsRes.ok) throw new Error(`Webservice ${wsRes.status}: ${wsText}`);
  let wsResult; try { wsResult = JSON.parse(wsText); } catch { wsResult = wsText; }
  if (wsResult?.status === 'error') throw new Error(`Webservice error: ${JSON.stringify(wsResult)}`);

  job.engStatus = newStatus;
  job.fieldInstances.forEach(f => { if (f.numericFieldId === '603180') f.currentValue = newStatus; });
  console.log(`✅ ${job.name} (Job.${job.numericJobId}) → "${newStatus}"`);
  return { matched: true, jobName: job.name, numericJobId: job.numericJobId, newStatus, shootDate };
}

// ── Supabase: write pre-wedding shoot date to client portal ──────────────────
// slug (from utm_content) is preferred over email for matching — more reliable.
async function writePrewedToSupabase(email, shootAt, rescheduleUrl, slug) {
  if (!email && !slug) return;
  try {
    const body = shootAt
      ? { prewedding_shoot_at: shootAt, prewedding_reschedule_url: rescheduleUrl }
      : { prewedding_shoot_at: null,    prewedding_reschedule_url: null };
    const filter = slug
      ? `portal_slug=eq.${encodeURIComponent(slug)}`
      : `email=eq.${encodeURIComponent(email)}`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?${filter}`,
      {
        method:  'PATCH',
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) {
      const matchedBy = slug ? `slug=${slug}` : `email=${email}`;
      console.log(`Supabase pre-wed updated for ${matchedBy}: ${shootAt ?? 'cleared'}`);
    } else {
      const text = await res.text();
      console.error(`Supabase pre-wed error ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error(`Supabase pre-wed write failed: ${err.message}`);
  }
}

// Load Pre-Wed cache from disk on startup
if (existsSync(CACHE_FILE_PW)) {
  try {
    const saved = JSON.parse(readFileSync(CACHE_FILE_PW, 'utf8'));
    pwCache.jobs     = saved.jobs || [];
    pwCache.loadedAt = new Date(saved.loadedAt).getTime() || 0;
    console.log(`Pre-Wed: ${pwCache.jobs.length} jobs loaded from cache`);
  } catch { /* fresh build on first request */ }
}

// Watch MCP cache file — auto-rebuild Pre-Wed cache when MCP refreshes
let pwRebuildTimer = null;
if (existsSync(MCP_CACHE_FILE_PW)) {
  watch(MCP_CACHE_FILE_PW, () => {
    clearTimeout(pwRebuildTimer);
    pwRebuildTimer = setTimeout(() => {
      console.log('MCP cache updated — auto-rebuilding Pre-Wed cache...');
      pwBuildCache().catch(e => console.error('Auto Pre-Wed rebuild error:', e.message));
    }, 3000);
  });
  console.log('Watching MCP cache for changes → Pre-Wed cache will auto-rebuild');
}

// ------------------------------------------------------------
// ADDRESS PARSER
// ------------------------------------------------------------
function parseAddress(raw) {
  if (!raw || raw.trim() === '') {
    return { address: '', city: '', zip: '', country: 'United Kingdom' };
  }

  const str = raw.trim();
  const postcodeRe = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/gi;
  const postcodes  = [...str.matchAll(postcodeRe)].map(m => m[1].trim().toUpperCase());
  const postcode   = postcodes[0] || '';
  let cleaned = str.replace(postcodeRe, '').replace(/^[\s,]+|[\s,]+$/g, '');
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);

  let address = '', city = '';
  if (parts.length === 0) {
    address = str;
  } else if (parts.length === 1) {
    address = parts[0];
  } else {
    city    = parts[parts.length - 1];
    address = parts.slice(0, parts.length - 1).join(', ');
  }

  return { address: address.trim(), city: city.trim(), zip: postcode, country: 'United Kingdom' };
}

// ------------------------------------------------------------
// PHONE CLEANER
// ------------------------------------------------------------
function cleanPhone(raw) {
  if (!raw) return '';
  return raw.replace(/\s*\[tel:[^\]]+\]/g, '').trim();
}

// ------------------------------------------------------------
// PORTAL HELPER — date and time normalisation
// ------------------------------------------------------------
function normaliseDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  const [d, m, y] = raw.split('/');
  if (!y) return null;
  return `${y}-${(m || '').padStart(2, '0')}-${(d || '').padStart(2, '0')}`;
}

function normaliseTime(raw) {
  if (!raw) return null;
  const mt = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!mt) return null;
  let h = parseInt(mt[1]);
  const ampm = (mt[3] || '').toLowerCase();
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mt[2]}`;
}

// ------------------------------------------------------------
// VSCO ID LOOKUP
// Tries the MCP cache first (fast). If the job isn't there —
// e.g. a brand-new booking — falls back to the live VSCO API
// using the correct paginated endpoint (/job?limit=100&page=N).
// Returns both ULID and numeric ID.
// ------------------------------------------------------------
async function lookupVscoIds(jobId) {
  if (!jobId) return { ulid: null, numericId: null };

  const isUlid = /^01[0-9a-z]{24}$/.test(String(jobId).toLowerCase());

  function findInList(jobs) {
    if (isUlid) return jobs.find(j => j.id === jobId);
    return jobs.find(j => {
      const href = j.links?.self?.managerHref || '';
      return href.split('/').pop() === String(jobId);
    });
  }

  function extractIds(match) {
    const href      = match.links?.self?.managerHref || '';
    const numericId = href.split('/').pop();
    console.log(`VSCO lookup: ULID=${match.id}, numeric=${numericId}`);
    return { ulid: match.id, numericId };
  }

  // 1. Try cache first
  try {
    const raw  = readFileSync(MCP_CACHE_FILE_PW, 'utf8');
    const jobs = JSON.parse(raw).jobs || [];
    const match = findInList(jobs);
    if (match) return extractIds(match);
    console.log(`VSCO lookup: ${jobId} not in cache — trying live API`);
  } catch (e) {
    console.log(`VSCO lookup: cache read failed (${e.message}) — trying live API`);
  }

  // 2. Fall back to live API (paginated)
  try {
    let page = 1;
    while (true) {
      const res = await fetch(`${VSCO_API_PW}/job?limit=100&page=${page}`, {
        headers: { 'X-API-KEY': VSCO_API_KEY_PW, 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`VSCO API ${res.status}`);
      const data = await res.json();
      const jobs = data.items || [];
      if (jobs.length === 0) break;
      const match = findInList(jobs);
      if (match) return extractIds(match);
      if (page >= (data.meta?.totalPages || 1)) break;
      page++;
    }
    console.log(`VSCO lookup: ${jobId} not found in live API`);
  } catch (e) {
    console.error(`VSCO lookup live API failed: ${e.message}`);
  }

  return { ulid: isUlid ? jobId : null, numericId: isUlid ? null : String(jobId) };
}

// ------------------------------------------------------------
// ZOHO TOKEN MANAGER
// ------------------------------------------------------------
async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`${ZOHO_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  cachedAccessToken = data.access_token;
  tokenExpiresAt    = Date.now() + (data.expires_in * 1000);
  console.log('Zoho access token refreshed');
  return cachedAccessToken;
}

// ------------------------------------------------------------
// ZOHO API HELPER
// ------------------------------------------------------------
async function zohoRequest(path, method = 'GET', body = null) {
  const { default: fetch } = await import('node-fetch');
  const token = await getAccessToken();
  const url   = `${ZOHO_BASE}${path}`;
  const opts  = {
    method,
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type':  'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Zoho error ${data.code}: ${data.message}`);
  return data;
}

// ------------------------------------------------------------
// FIND EXISTING ZOHO CONTACT BY EMAIL
// ------------------------------------------------------------
async function findZohoContact(email) {
  const { default: fetch } = await import('node-fetch');
  const token = await getAccessToken();
  const url   = `${ZOHO_BASE}/contacts?organization_id=${ZOHO_ORG}&search_text=${encodeURIComponent(email)}`;
  const res   = await fetch(url, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
  });
  const data     = await res.json();
  const contacts = data.contacts || [];
  return contacts.find(c => c.email === email) || null;
}

// ------------------------------------------------------------
// CREATE OR UPDATE ZOHO CONTACT
// ------------------------------------------------------------
async function syncZohoContact(payload) {
  const { firstName, lastName, email, phone, address: rawAddress, numericJobId, vscoUlid } = payload;

  const contactName  = `${firstName} ${lastName}`.trim();
  const addr         = parseAddress(rawAddress);
  const cleanedPhone = cleanPhone(phone);

  const customFields = [];
  if (numericJobId) customFields.push({ label: 'VSCO Job ID', value: String(numericJobId) });
  if (vscoUlid)     customFields.push({ label: 'VSCO ULID',   value: vscoUlid });

  const contactBody = {
    contact_name:      contactName,
    contact_type:      'customer',
    customer_sub_type: 'individual',
    first_name:        firstName,
    last_name:         lastName,
    billing_address: {
      address: addr.address,
      city:    addr.city,
      zip:     addr.zip,
      country: addr.country,
    },
    custom_fields: customFields,
    contact_persons: [{
      first_name:         firstName,
      last_name:          lastName,
      email:              email,
      phone:              cleanedPhone,
      is_primary_contact: true,
    }],
  };

  const existing = email ? await findZohoContact(email) : null;

  if (existing) {
    console.log(`Updating existing Zoho contact: ${contactName} (${existing.contact_id})`);
    await zohoRequest(
      `/contacts/${existing.contact_id}?organization_id=${ZOHO_ORG}`,
      'PUT',
      contactBody
    );
    return { action: 'updated', contact_id: existing.contact_id, name: contactName };
  } else {
    console.log(`Creating new Zoho contact: ${contactName}`);
    const result = await zohoRequest(
      `/contacts?organization_id=${ZOHO_ORG}`,
      'POST',
      contactBody
    );
    const newId = result.contact?.contact_id;
    return { action: 'created', contact_id: newId, name: contactName };
  }
}

// ------------------------------------------------------------
// PARSE INCOMING REQUEST BODY
// ------------------------------------------------------------
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end',  () => {
      try {
        if (req.headers['content-type']?.includes('application/json')) {
          resolve(JSON.parse(data));
        } else {
          const params = new URLSearchParams(data);
          const obj = {};
          for (const [k, v] of params) obj[k] = v;
          resolve(obj);
        }
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// ------------------------------------------------------------
// HTTP SERVER
// ------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'vsco-webhook-listener' }));
    return;
  }

  // ─── VSCO BOOKING → ZOHO + PORTAL ────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/webhook/vsco-booking') {
    try {
      const body = await readBody(req);

      console.log('Received webhook payload:', JSON.stringify(body, null, 2));

      if (WEBHOOK_SECRET && body.secret !== WEBHOOK_SECRET) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const payload = {
        firstName: body.first_name  || body.firstName  || '',
        lastName:  body.last_name   || body.lastName   || '',
        email:     body.email       || '',
        phone:     body.mobile      || body.phone      || body.cell_phone || '',
        address:   body.address     || '',
        jobId:     body.job_id      || body.jobId      || '',
      };

      if (!payload.email && !payload.firstName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No contact data in payload' }));
        return;
      }

      // Resolve both VSCO IDs (ULID + numeric) from whichever form the email sent
      let vscoUlid = null, numericJobId = null;
      if (payload.jobId) {
        ({ ulid: vscoUlid, numericId: numericJobId } = await lookupVscoIds(payload.jobId));
      }

      // Sync to Zoho
      const result = await syncZohoContact({ ...payload, vscoUlid, numericJobId });
      console.log('Zoho sync result:', result);

      // Create client portal (fire-and-forget — doesn't block response)
      if (PORTAL_SECRET) {
        const groomFirst  = body.groom_first_name || body['groom.first_name'] || '';
        const groomLast   = body.groom_last_name  || body['groom.last_name']  || '';
        const rawDate     = body.wedding_date     || body['wedding_day.start_date'] || '';
        const rawTime     = body.ceremony_time    || body['ceremony.start_time']    || '';
        const venue       = body.wedding_venue    || body['job.custom.wedding_venue'] || '';
        const packageName = body.package_name     || body.collection || '';

        fetch(`${PORTAL_BASE}/api/webhooks/vsco-job?secret=${PORTAL_SECRET}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner1_name:   `${payload.firstName} ${payload.lastName}`.trim(),
            partner2_name:   `${groomFirst} ${groomLast}`.trim() || null,
            email:           payload.email,
            wedding_date:    normaliseDate(rawDate),
            ceremony_venue:  venue || null,
            ceremony_time:   normaliseTime(rawTime),
            package_name:    packageName || null,
            vsco_job_id:     vscoUlid || payload.jobId,
            zoho_contact_id: result.contact_id || null,
          }),
        }).then(r => r.json()).then(d => console.log('Portal result:', JSON.stringify(d)))
          .catch(e => console.error('Portal creation failed:', e.message));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));

    } catch (err) {
      console.error('Webhook error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ─── PRE-WED SHOOT HANDLER ────────────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/webhook/calendly-prewed') {
    try {
      const body      = await readBody(req);
      const eventType = body.event;
      const data      = body.payload;
      const eventName = data?.event_type?.name || '';

      if (!eventName.includes('Pre-Wed')) {
        res.writeHead(200); res.end('OK - not Pre-Wed'); return;
      }

      const invitee   = data.invitee || data;
      const email     = (invitee.email || '').toLowerCase().trim();
      const name      = invitee.name || '';
      const shootDate = data.event?.start_time || data.start_time || '';

      let newStatus;
      if (eventType === 'invitee.created')       newStatus = 'Is Booked';
      else if (eventType === 'invitee.canceled') newStatus = 'Not Yet Booked';
      else { res.writeHead(200); res.end('OK'); return; }

      console.log(`Pre-Wed ${eventType}: ${name} (${email})`);

      // Write shoot date + reschedule URL to Supabase (powers the client portal)
      const shootAt       = eventType === 'invitee.created' ? (data?.scheduled_event?.start_time ?? null) : null;
      const rescheduleUrl = eventType === 'invitee.created' ? (data?.reschedule_url ?? null)              : null;
      const slug          = (data?.tracking?.utm_content || '').trim() || null;
      await writePrewedToSupabase(email, shootAt, rescheduleUrl, slug);

      const result = await pwProcessBooking(email, name, shootDate, newStatus);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('Pre-Wed error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/webhook/calendly-prewed/refresh') {
    try {
      await pwBuildCache();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, cached: pwCache.jobs.length }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health/prewed') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', service: 'vsco-prewed-proxy',
      cached: pwCache.jobs.length,
      cacheAge: Math.round((Date.now() - pwCache.loadedAt) / 60000) + 'm',
    }));
    return;
  }

  // ─── PAYMENT SYNC ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/sync-payments') {
    const t0 = Date.now();
    (async () => {
      try {
        const NON_JOP  = new Set(['01dys6x70rk9b9v3jew7b49qk5','01e1f718r8p6d8nzasdn1zy4ar']);

        // Build dual lookup: both ULID and numeric job ID → job
        const cacheRaw = readFileSync('/Users/jeff/mcp-workspace/vsco-cache.json', 'utf8');
        const { jobs: allJobs } = JSON.parse(cacheRaw);
        const byUlid    = new Map();
        const byNumeric = new Map();
        for (const j of allJobs) {
          if (j.stage !== 'booked' || NON_JOP.has(j.brandId) || (j.accountBalance || 0) <= 0) continue;
          const job = { id: j.id, displayName: j.name || j.title, outstanding: j.accountBalance / 100 };
          byUlid.set(j.id, job);
          // Extract numeric ID from managerHref e.g. https://workspace.vsco.co/jobs/view/10591092
          const numericMatch = j.links?.self?.managerHref?.match(/\/jobs\/view\/(\d+)/);
          if (numericMatch) byNumeric.set(numericMatch[1], job);
        }

        const since = new Date(); since.setDate(since.getDate() - 120);
        const sinceStr = since.toISOString().split('T')[0];
        const { default: fetch } = await import('node-fetch');
        let zohoInvoices = []; let page = 1;
        while (true) {
          const token = await getAccessToken();
          const r = await fetch(`${ZOHO_BASE}/invoices?organization_id=${ZOHO_ORG}&status=paid&per_page=200&page=${page}`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
          const d = await r.json(); const invoices = d.invoices || [];
          if (!invoices.length) break;
          for (const inv of invoices) {
            if ((inv.total||0) <= 600) continue;
            const payDate = inv.last_payment_date || inv.date || '';
            if (payDate && payDate < sinceStr) continue;
            // Pull VSCO Job ID from invoice custom field (may be ULID or numeric)
            // Falls back to contact-level lookup later if not set on the invoice
            const vscoJobId = (inv.custom_fields || []).find(f => f.label === 'VSCO Job ID')?.value || '';
            zohoInvoices.push({ customer_name: inv.customer_name, amount: inv.total, date: payDate, invoice_number: inv.invoice_number, vscoJobId, customer_id: inv.customer_id });
          }
          const oldest = invoices[invoices.length-1]; const od = oldest?.last_payment_date||oldest?.date||'';
          if (od && od < sinceStr) break; if (!d.page_context?.has_more_page) break; page++;
        }

        // Build a contact-level VSCO Job ID cache for invoices that lack it
        const contactJobIdCache = new Map(); // customer_id → vscoJobId

        const matches = [];
        for (const inv of zohoInvoices) {
          let vscoJobId = inv.vscoJobId;

          // If not on the invoice, try the contact record
          if (!vscoJobId && inv.customer_id) {
            if (!contactJobIdCache.has(inv.customer_id)) {
              try {
                const token = await getAccessToken();
                const cr = await fetch(`${ZOHO_BASE}/contacts/${inv.customer_id}?organization_id=${ZOHO_ORG}`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
                const cd = await cr.json();
                const contactField = (cd.contact?.custom_fields || []).find(f => f.label === 'VSCO Job ID');
                contactJobIdCache.set(inv.customer_id, contactField?.value || '');
              } catch(e) {
                contactJobIdCache.set(inv.customer_id, '');
              }
            }
            vscoJobId = contactJobIdCache.get(inv.customer_id) || '';
          }

          if (!vscoJobId) continue;
          const job = byUlid.get(vscoJobId) || byNumeric.get(vscoJobId);
          if (job) matches.push({ inv: { ...inv, vscoJobId }, job });
        }

        if (!matches.length) { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({synced:0,failed:0,message:'Already in sync',ms:Date.now()-t0})); return; }

        const VSCO_KEY = process.env.VSCO_API_KEY||'5a2ef52b-5a26-d3da-defa-dee9ce12-95e2da252851';
        const vscoHdr  = {'X-API-KEY':VSCO_KEY,'Content-Type':'application/json'};
        const results  = [];
        for (const { inv, job } of matches) {
          try {
            const amtPence = Math.round(inv.amount*100);
            const ordRes   = await fetch(`https://tave.io/v2/job/${job.id}/order`,{headers:vscoHdr});
            const ordData  = await ordRes.json(); if (!(ordData.items||[]).length) throw new Error('No order');
            const orderId  = ordData.items[0].id;
            const pmtRes   = await fetch('https://workspace.vsco.co/api/v2/payment',{method:'POST',headers:vscoHdr,body:JSON.stringify({jobId:job.id,amount:amtPence,status:'posted',paymentMethodId:'014gkqrfa0z0v4e1hym1nhgwsy',received:inv.date,memo:`Zoho INV-${inv.invoice_number} (auto-sync)`})});
            const pmtData  = await pmtRes.json();
            await fetch(`https://tave.io/v2/payment/${pmtData.id}/apply`,{method:'POST',headers:vscoHdr,body:JSON.stringify({orderId,amount:amtPence})});
            results.push({job:job.displayName,amount:inv.amount,status:'synced'});
            console.log('sync-payments synced: '+job.displayName);
          } catch(err) { results.push({job:job.displayName,amount:inv.amount,status:'failed',error:err.message}); }
        }
        const synced=results.filter(r=>r.status==='synced').length, failed=results.filter(r=>r.status==='failed').length;
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({synced,failed,results,ms:Date.now()-t0}));
      } catch(err) { console.error('sync-payments error:',err.message); res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:err.message})); }
    })(); return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, async () => {
  console.log(`VSCO webhook listener running on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/webhook/vsco-booking`);
  console.log(`Pre-Wed:  POST http://localhost:${PORT}/webhook/calendly-prewed`);
  console.log(`Health:   GET  http://localhost:${PORT}/health`);
  if (!ZOHO_CLIENT_ID || !ZOHO_REFRESH_TOKEN) {
    console.warn('⚠️  Zoho credentials not set — check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN');
  } else {
    console.log('✅ Zoho credentials loaded');
  }
  if (PORTAL_SECRET) {
    console.log('✅ Portal webhook secret loaded');
  } else {
    console.warn('⚠️  PORTAL_WEBHOOK_SECRET not set — portal auto-creation disabled');
  }

  // Startup drain — process any bookings queued while Mac was offline
  const WORKER_BASE  = 'https://webhook.jeffoliverphotography.co.uk';
  const DRAIN_SECRET = 'jop-drain-2026';

  try {
    const { default: fetch } = await import('node-fetch');
    console.log('Checking for queued bookings...');
    const res  = await fetch(`${WORKER_BASE}/drain?secret=${DRAIN_SECRET}`);
    const data = await res.json();

    if (data.count === 0) {
      console.log('No queued bookings.');
    } else {
      console.log(`Found ${data.count} queued booking(s) — processing...`);
      for (const item of data.items) {
        try {
          const result = await syncZohoContact(item.payload);
          console.log(`✅ Drained: ${result.name} (${result.action})`);
          await fetch(`${WORKER_BASE}/ack/${item.key}`, {
            method:  'DELETE',
            headers: { 'x-drain-secret': DRAIN_SECRET },
          });
        } catch (e) {
          console.error(`❌ Failed to drain ${item.key}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.warn(`Startup drain skipped: ${e.message}`);
  }
});
