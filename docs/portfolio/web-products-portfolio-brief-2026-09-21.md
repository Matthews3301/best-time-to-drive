# Web products portfolio brief

**Owner:** M Sal  
**Prepared:** 21 Sep 2026 (Europe/London, BST)  
**Purpose:** Decision input for keep / grow / monetise / mothball / sunset across three live web products.  
**Mandate (standing):** Analyse performance, housekeeping, fix bugs, grow audiences and monetise where possible; shutting a product down is acceptable if data supports it. Be ambitious.

This document is read-only evidence. Recommendations belong in a separate analysis.

---

## Portfolio at a glance (21 Sep 2026)

| Product | URL | Audience (best current) | Known monthly burn | Known revenue | Ops health | Lean (pre-decision) |
|---|---|---|---|---|---|---|
| **Rush Hour Planner** | https://rushhourplanner.com/ | ~4.7k visitors / 30d (PostHog) | ~£150 Maps+TomTom (OpenAI parking unknown) | Amazon + BMC on-site; **$0 new** clicks/payments recently | Live, shipping weekly; TomTom prepaid runway ~3–4 days | Keep-but-cap **or** pause APIs until monetisation moves |
| **Heystacks** (ex-Tabltree) | https://heystacks.com/ | ~11.1k active users / 28d (GA4) | ~**£50** hosting (user-stated) | **None** | Apex OK; **www Cloudflare 526** (origin SSL) | Keep / maintain; fix SSL; then monetise experiment |
| **Benefits Advisor** | https://benefitsadvisor.uk/ | **8** visitors / ~7d; **25** / ~30d (Vercel) | Vercel hobby + possible LLM (unknown £) | Free; none | Prod deploy **~11 months** old; repo 404 from tooling | Strong sunset / mothball candidate unless revive plan |

---

## 1. Rush Hour Planner

### Background
- **What it is:** Web app that finds better / optimal drive times (UK-oriented road routing and related helpers). Live product with ongoing feature shipping (recent commits include llms, tolls, parking-429 hardening).
- **Stack / hosting:** Vercel project `best-time-to-drive` (`prj_O1Nl9VZhbkiFfeAPRZDzhxNyrjFV`), Hobby team. Repo: `https://github.com/Matthews3301/best-time-to-drive`.
- **Analytics:** PostHog project **201614** (“Rush Hour Planner project”); also Vercel Web Analytics.
- **APIs / cost drivers:** TomTom Routing (MyTomTom, `info@heystacks.com`), Google Maps Platform via **two** GCP billing accounts, OpenAI for parking-related calls.
- **Monetisation today:** Amazon Associates (“Road Trip Essentials” cards + disclosure) and Buy Me a Coffee (`https://buymeacoffee.com/rush.hour.planner`).

### How it’s used
- Dominantly **SEO / organic search** entry (Google >> Bing / DDG / Yahoo).
- Users land on the planner, run routing flows that hit TomTom (and Maps). Parking path can call OpenAI.
- Engagement is healthy for a utility: bounce ~21–23%, avg session ~2.5–3.0 minutes.
- Weekday traffic stronger than weekends (Vercel daily series mid-Sep: midweek ~250–275 pageviews/day vs weekend ~115–133).

### Current data (as of 21 Sep 2026)

**Product traffic (PostHog, filter test accounts, refreshed afternoon 21 Sep)**

| Window | Visitors | Sessions | Pageviews | Avg session | Bounce |
|---|---:|---:|---:|---:|---:|
| Rolling 7d | 1,220 | 1,424 | 1,580 | ~150s | ~21% |
| Rolling 30d | 4,727 | 5,767 | 6,555 | ~179s | ~23% |

**Channels (7d, InitialChannelType):** Organic Search 1,032 · Direct 196 · Organic Social 1.

**Earlier same-day snapshot (for trend context):** 7d visitors were ~1,209 (−3% vs prior week in that pull); 30d ~4,716 (roughly flat). Soft, not collapsing.

**Vercel Web Analytics (14–20 Sep UTC, earlier pull):** ~1,538 uniques / 1,826 pageviews.

**Deploy / reliability**
- Prod READY as of ~20 Sep 2026 (~21:30 BST), commit message “llms” (`dpl_5oa2wVxB2UgKnEZYou8x9fkMC99L` in earlier pull).
- Runtime errors (7d window, earlier pull): TomTom-related clusters — missing/invalid `travelTimeInSeconds`, no route forecast, occasional rate limit. OpenAI credit errors not re-confirmed in that window after parking 429 hardening (13 Sep).
- Box/datacenter IP can get Vercel system mitigation `403` (`x-vercel-mitigated: deny`) even when Bot Protection is off / AI bots allowed — Hobby cannot IP-allowlist; external fetches often still see real content. Treat as agent false-positive, not “site down.”

**API usage — TomTom (MyTomTom, read 21 Sep ~15:20 BST)**
- Plan: **Pay as you grow** (prepaid EUR).
- Project: “M's Personal Project”; traffic 100% on API key `rush-hour-planner-key`.
- Last 30d (Aug 20 → Sep 20): **135,084** Routing requests; **86,295 4XX (63.9%)**; 1 5XX; **218 QPS breaches**.
- Free Routing allowance **20,000/20,000 used**.
- Prepaid balance ~**€16.78**; burn ~**€4.3/day** → ~**€125–130/mo** (~£110–115). **Runway ~3–4 days** without top-up.
- Lifetime top-ups shown: €150 (Apr–Sep 2026). Sep 13 €50 top-up coincided with 4XX collapse — strongly suggests earlier 4XX storm was **quota/credit rejection**, not app logic bugs alone.
- Public Routing overage card: free to 20k/mo; then ~€1.00 / 1k (20k–1M tier).

**API cost — GCP Maps (BigQuery billing export, GBP, 21 Sep)**
- Account 1 `010FAE-78C152-04D391` (info@heystacks) — Rush Hour project almost all of bill.
- Account 2 `0148A6-8FF0DA-87F60B` (matthews3301) — Rush Hour project.
- **Combined Rush Hour projects:** Aug 2026 **£51.63**; Sep MTD to ~21 Sep **£24.90**.
- Top SKUs: Places Autocomplete + Directions Advanced (+ invoice tax on account 1 in Aug).
- Export freshness: current through morning of 21 Sep (not lagging).

**Revenue**
- User (21 Sep): **no new Amazon clicks or Buy Me a Coffee payments**.
- Mid-Sep historical note (stale): ~$11.40 combined BMC + Associates sample — **not re-verified**; treat as outdated.
- Associates day CSV 13 Sep had been $0 earnings that day.

**Unit-economics sketch (rough):** ~4.7k visitors / 30d vs ~£150/mo Maps+TomTom ≈ **~3p API cost per visitor**, with near-zero cash back.

**Gaps still open**
- OpenAI parking spend / remaining credits.
- Whether TomTom errors still hurt successful trip completion after credit restore.
- Conversion events beyond pageviews (planner success rate) not pulled as a formal funnel here.

---

## 2. Heystacks (formerly Tabltree)

### Background
- **What it is:** Document / spreadsheet discovery site — community “trackers” and reference sheets (heavily music-artist trackers: Ken Carson, Lil Uzi Vert, Playboi Carti, etc., plus niche guides). Branding in GA4 still “Tabltree - GA4” / Heystack page titles.
- **Stack / hosting:** **Not on the Vercel team used for Rush Hour / Benefits.** Apex served via Cloudflare + `X-Powered-By: Sails`. Repo: Bitbucket `HoneyB4dger/stansa-v3`.
- **Analytics:** GA4 property **382761646**, account MattSalamon. Search Console resource `sc-domain:heystacks.com` (not deeply used in this pass). No live GA4 MCP — CSV / browser only.
- **Monetisation:** None on-site (user confirmed 21 Sep). No pricing, ads, or donate CTA observed in earlier fetch.

### How it’s used
- Users arrive mostly via **Google organic** and **direct**, then open specific tracker / doc pages.
- Content is long-tail SEO: many titled “X Tracker - Heystack”.
- Bounce rates on top pages often ~55–70% (expected for “find the sheet → leave”).
- Small but real AI-assistant referral (ChatGPT) and social/referral (Reddit, Twitter/t.co, War Thunder forum).

### Current data (GA4 export attached by user 21 Sep; window **24 Aug – 20 Sep 2026**, 28 days)

**Snapshot**
| Metric | Value |
|---|---|
| Active users | **11,108** |
| New users | **10,157** |
| Event count | 66,415 |
| Avg engagement time / active user | ~155s (~2.6 min) |
| Daily active users (avg over 28d) | **~459** |
| Daily active users (last 7d of series avg) | **~534** |
| Daily active range | ~358–641 |

**Acquisition — first-user primary channel (new users)**  
Organic Search 4,860 · Direct 4,325 · Organic Social 652 · Referral 184 · AI Assistant 91 · Organic Video 43 · Email 1 · Unassigned 1.

**Sessions by channel**  
Organic Search 12,055 · Direct 6,719 · Organic Social 1,091 · Referral 328 · AI Assistant 185 · Organic Video 60 · Unassigned 34 · Email 1.

**Top session sources**  
google / organic ~10,893 · (direct) ~6,719 · bing / organic ~827 · reddit.com ~694 · t.co ~282 · forum.warthunder.com ~187 · duckduckgo ~149 · chatgpt.com ~130.

**Top pages (by views)** — music trackers dominate (Ken Carson, Lil Uzi Vert, Playboi Carti variants, OsamaSon, Che, Yeat, Michael Jackson, Drake, Eminem, Kanye Unreleased, etc.). Homepage “Heystack” also appears in top set.

**Earlier stale CSV (17 Aug–13 Sep)** had similar shape (~400–500 DAU; key events = 0). Fresh export confirms audience is **real and larger than Rush Hour**, still with **zero conversion instrumentation**.

### Ops / money
- Apex **UP** (confirmed 21 Sep).
- **www.heystacks.com Cloudflare 526** (invalid origin SSL) — reconfirmed 21 Sep ~14:04 BST. Unknown www vs apex traffic split.
- Hosting: user-stated **~£50 / month**. Domain/email identity tied to `info@heystacks.com` (also TomTom / some GCP).
- Revenue: **£0**; no monetisation intent executed yet.

### Gaps still open
- Exact www vs apex traffic share (how painful is the 526?).
- Monetisation *intent* (ads / sponsorship / premium / tips / stay free).
- Search Console query detail (optional).
- Whether Bitbucket deploy pipeline is healthy (not audited this pass).

---

## 3. Benefits Advisor

### Background
- **What it is:** Free UK benefits chat / advisor UI (`https://benefitsadvisor.uk/`). Positioned as a free public service; X/Twitter link historically; no pricing.
- **Stack / hosting:** Vercel project `serenna-vue` (`prj_YPmcRcRPSmDetEyKVDJNLSVwPe5G`). Git meta on Vercel: org `Matthews3301`, repo `serenna-vue`.
- **Analytics:** Vercel Web Analytics only (no PostHog project for this product on the connected account).
- **History:** Embedding / LLM-related commits (“new embedding model”, “reverted createEmbedding”) — implies model cost risk if keys still live.

### How it’s used
- Almost unused in the observed windows: visitors ≈ pageviews (no multi-page depth).
- No evidence of SEO traction comparable to the other two products.

### Current data (Vercel, refreshed 21 Sep)

| Window | Visitors | Pageviews |
|---|---:|---:|
| 14–21 Sep UTC | **8** | **8** |
| 22 Aug–21 Sep UTC | **25** | **25** |

**Deploy**
- Latest production READY: created **25 Oct 2025 15:42 BST** — **~11 months** before this brief.
- Commit message: “reverted createEmbedding”.
- Runtime errors last 7d: **none**.

**Source control**
- `gh api repos/Matthews3301/serenna-vue` → **404** (private elsewhere, renamed, or deleted). Blocks easy revive without recovering source.

**Money**
- Stated free service; no ads/affiliate observed.
- LLM / embeddings bill: **UNKNOWN** — important to confirm whether any OpenAI (or similar) key is still billed for a near-dead app.
- Vercel Hobby footprint itself is trivial vs model cost if any.

### Gaps still open
- Where is source now?
- Any LLM keys still billed?
- Intent: keep domain for SEO/sentiment, mothball, or delete?

---

## Cross-product comparison

| Dimension | Rush Hour | Heystacks | Benefits |
|---|---|---|---|
| Demand signal | Strong SEO utility traffic | Stronger SEO/doc discovery traffic | Near-zero |
| Trend | Soft/flat at healthy level | DAU mid-400s → last week ~530 (steady/up in window) | Flat ~zero |
| Engagement | Good session length / low bounce | Short doc lookups; higher bounce | 1 PV / visitor |
| Revenue | Thin / currently $0 new | £0 | £0 |
| Burn | High variable API (~£150/mo + OpenAI?) | Fixed ~£50 hosting | Unknown LLM + tiny Vercel |
| Maintenance | Active shipping | Low code churn?; SSL debt | Stale deploy; repo missing |
| Biggest risk | TomTom prepaid runs out in days; spend >> revenue | Leaving free money on table; www SSL | Paying for ghosts; opportunity cost of attention |
| Biggest asset | Clear product + SEO + shipping muscle | Largest audience; cheap host | Domain + prior LLM work (if recoverable) |

---

## Constraints & decision rules (from owner)

1. Grow / monetise where sensible; **shutdown OK** if data supports it.
2. Rush Hour: Amazon/BMC currently flat; TomTom + GCP accessible and now measured.
3. Heystacks: hosting ~£50/mo; **no monetisation at the moment**.
4. Benefits: owner rejected an immediate “lock sunset” without a full portfolio think — treat sunset as **option**, not decided.
5. Prefer evidence over vibes; do not invent metrics.

---

## Ordered open questions (still useful)

1. Rush Hour — OpenAI parking monthly £ / credits.
2. Rush Hour — acceptable monthly API burn vs willingness to top up TomTom every ~2 weeks.
3. Heystacks — ads/sponsorship/premium/tips vs stay free.
4. Heystacks — fix www→apex redirect vs repair origin cert.
5. Benefits — any LLM bill still running; where is `serenna-vue`.
6. Portfolio max monthly burn willing to carry for SEO/option value.
7. Decision deadline so SSL/API spend don’t drift.

---

## Appendix — source freshness

| Source | As-of |
|---|---|
| PostHog Rush Hour overview | 21 Sep 2026 afternoon BST |
| TomTom MyTomTom balance/usage | 21 Sep 2026 ~15:20 BST |
| GCP BigQuery billing export | 21 Sep 2026 (usage through early morning) |
| Heystacks GA4 CSVs (user export) | Window 24 Aug–20 Sep 2026 |
| Benefits Vercel analytics + deploy | 21 Sep 2026 |
| Heystacks www 526 check | 21 Sep 2026 ~14:04 BST |
| User statements (BMC/Amazon flat; Heystacks £50; no monetisation) | 21 Sep 2026 |

