@AGENTS.md

# Jeff Oliver Photography — Client Portal

Wedding client portal at `https://portal.jeffoliverphotography.com`. ~50 clients/year. Built in Next.js 16 + Supabase + Vercel.

**Always `git pull` before starting work. The remote (GitHub) is canonical — web Claude Code sessions push PRs that get merged there.**

---

## What this is

A branded portal replacing VSCO's questionnaire. Clients access via a secret slug URL (no login). Jeff manages clients via `/admin` (password-protected, his email only).

**Features:** dashboard checklist · wedding details · venue info · conversational questionnaire (writes back to VSCO) · AI shot list wizard · invoices (Zoho) · important info · FAQ

---

## How clients get created

**Automatically:** VSCO booking email → Cloudflare → Mac webhook (`/Users/jeff/mcp-workspace/webhook.js`) → `POST /api/webhooks/vsco-job` → Supabase client record. Groom name, wedding date, venue, package are often null on creation (not in the email — need VSCO API fetch to enrich).

**Manually:** Jeff uses `/admin` → New Client form.

---

## Questionnaire → VSCO write-back

`/api/portal/questionnaire-chat` — Claude Opus 4.7, dynamic system prompt built from client record. When complete, Claude emits `QUESTIONNAIRE_COMPLETE:` + JSON. The wizard saves to Supabase, emails Jeff, then calls `submitVscoQuestionnaire()` in `src/lib/vsco-questionnaire.ts` which GETs the VSCO form page for the CSRF token and POSTs ~30 fields mapped to VSCO's `QF6135xxx` field IDs.

Requires `vsco_questionnaire_url` column on `clients` (applied in Supabase, not in `supabase-schema.sql`).

---

## Known issues

1. **`vsco_job_id` stored as numeric** — `webhook.js:624` sends `payload.jobId` (numeric) instead of `vscoUlid`. Fix: `vsco_job_id: vscoUlid || payload.jobId`
2. **Package/collection always null** — Cloudflare email only has 6 fields; need VSCO API fetch post-lookup to enrich
3. **Chat wizards: messages start with assistant role** — hidden opening user message is filtered from API payload. Fix: keep hidden messages in API call, hidden flag is UI-only
4. **`/api/portal/chat/route.ts` model** — still `claude-3-haiku-20240307` (deprecated). Use `claude-3-5-sonnet-20241022`
5. **`supabase-schema.sql` out of sync** — missing: `insert_client` RPC, `shot_list_text` + `vsco_questionnaire_url` + `reception_venue` columns on `clients`

---

## Key env vars

Local: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Vercel adds: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `VSCO_WEBHOOK_SECRET`, `PORTAL_WEBHOOK_SECRET`, `MAC_WEBHOOK_URL`, `ZOHO_*`

---

## Mac infrastructure

The webhook listener and Cloudflare worker live on Jeff's Mac Studio. Before touching `webhook.js` or the Cloudflare worker, load the systems-reference skill: it has file paths, API keys locations, launchd daemon names, and known API limitations. `scripts/webhook.js` in this repo is the versioned copy — edit here, then deploy to Mac.
