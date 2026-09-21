# Web products portfolio — recommendations

**For:** M Sal
**Date:** 21 Sep 2026
**Evidence base:** [`web-products-portfolio-brief-2026-09-21.md`](./web-products-portfolio-brief-2026-09-21.md) (read-only). Every number below is cited from the brief unless marked **Derived** (arithmetic on brief numbers) or **Judgment** (opinion / estimate, not measured).
**Scope:** Docs only. No application code, dependency, or Vercel config changes are proposed *in this PR*; the action lists describe work to be done separately.

---

## Executive summary

1. **Heystacks is the portfolio's best asset and is under-managed:** ~11.1k active users / 28d, DAU trending up (~459 avg → ~534 last 7d), ~£50/mo fixed cost, £0 revenue, zero conversion tracking, and a broken `www` host (Cloudflare 526). **Recommendation: grow + monetise-first.**
2. **Rush Hour Planner is a good product with bad unit economics:** ~4.7k visitors / 30d against ~£150/mo API burn (~3p per visitor) and **$0 new revenue**. TomTom prepaid runs out in ~3–4 days. **Recommendation: keep, but cost-cap first, then monetise** — the lever is API calls per session, not more traffic.
3. **Benefits Advisor has no audience:** 25 visitors / 30d, 1 pageview per visitor, deploy ~11 months old, source repo 404, LLM bill unknown. **Recommendation: mothball now (kill any live LLM keys, keep domain), with a dated sunset-or-revive decision at day 30.** Sunset is not assumed; it is the default if no revive plan appears.
4. **This week's must-dos, in order:** (a) TomTom top-up decision today (avoid outage on an SEO-led product), (b) Heystacks `www` redirect fix, (c) Benefits LLM-key audit, (d) turn on conversion instrumentation on both live products so the day-30 decisions are made on data.
5. **Portfolio burn today (known):** ~£200/mo (Rush Hour ~£150 + Heystacks ~£50), plus **two unknowns** (OpenAI parking, Benefits LLM). Target by day 60: ≤ £100/mo known burn with ≥ one monetisation experiment live on each kept product.
6. The three open data points that would most change these calls: OpenAI parking spend, Benefits LLM bill, and Heystacks `www` vs apex traffic share (see [§ Missing data](#missing-data-that-would-change-the-call)).

---

## Decision frame

**Owner mandate (brief):** analyse, housekeep, fix bugs, grow audiences, monetise where possible; shutdown OK if data supports it; be ambitious; evidence over vibes.

**How the options are used here:**

| Option | Meaning in this document |
|---|---|
| **keep** | Maintain as-is; minimal spend; no growth investment |
| **grow** | Invest attention in audience growth (SEO, content, product) |
| **monetise-first** | Prioritise revenue/cost work before growth work |
| **mothball** | Stop attention and variable spend; keep domain and data; reversible |
| **sunset** | Planned shutdown: redirect/park domain, delete infra; not easily reversible |

---

## 1. Rush Hour Planner — **keep + cost-cap, then monetise-first**

### Facts (brief)

- Traffic: **4,727 visitors / 5,767 sessions / 6,555 pageviews** (30d, PostHog); 7d: 1,220 visitors. Trend "soft, not collapsing" (7d −3% vs prior week; 30d roughly flat).
- Acquisition: **Organic Search 1,032 · Direct 196 · Organic Social 1** (7d). SEO-led.
- Engagement: bounce ~21–23%, avg session ~150–179s. Weekday ~250–275 PV/day vs weekend ~115–133.
- TomTom (Aug 20 → Sep 20): **135,084 Routing requests**, **86,295 4XX (63.9%)**, **218 QPS breaches**, free allowance 20k/20k used. Balance **~€16.78**, burn **~€4.3/day** (~€125–130/mo, ~£110–115), **runway ~3–4 days**. Sep 13 €50 top-up coincided with 4XX collapse → earlier 4XX storm was likely credit/quota rejection. Overage ~€1.00 / 1k requests above 20k/mo.
- GCP Maps: Aug **£51.63**; Sep MTD **£24.90**; top SKUs Places Autocomplete + Directions Advanced; split across **two** billing accounts.
- OpenAI (parking): spend **unknown**.
- Revenue: **no new Amazon clicks or BMC payments** (21 Sep). ~$11.40 mid-Sep sample is stale and unverified. Associates 13 Sep: $0.
- Brief's unit-economics sketch: **~3p API cost per visitor, near-zero cash back**.
- Reliability: prod READY 20 Sep; 7d runtime errors are TomTom-related (`travelTimeInSeconds` missing/invalid, no route forecast, occasional rate limit).

### Derived (arithmetic on brief numbers; assumptions stated)

- **~23 TomTom Routing requests per session** (135,084 ÷ 5,767). The repo README states each forecast samples ~8–15 TomTom calls, so this implies roughly 1.5–3 forecasts per session *or* additional calls outside the forecast path. Either way, **calls per session is the cost lever.**
- Successful TomTom requests ≈ 135,084 − 86,295 − 1 ≈ **48.8k / 30d**. If the current €4.3/day rate holds (~4.3k billable requests/day at €1/1k, all post-top-up requests succeeding), the run-rate is ~**130k billable requests/month**, i.e. **~€110/mo above the 20k free tier**.
- To bring TomTom to **€0**, monthly successful requests must fall below **20k** — an ~85% cut from the current run-rate. To halve the bill, cut to ~75k.
- Known burn ≈ **£110–115 (TomTom) + ~£25–50 (Maps) ≈ £135–165/mo**, before OpenAI.

### Judgment

- The product is worth keeping: it has real, SEO-led demand, low bounce, and active shipping muscle. But at the current shape it is a **subsidised public utility**, and revenue at ~4.7k visitors will not close a ~£150/mo gap through display ads or affiliates alone (**Judgment:** ad revenue for ~5.8k sessions/month would likely be low single-digit to low-tens of £/month; not measured).
- Therefore **cost reduction beats revenue growth as the first move**: cutting TomTom calls per session is engineering work that is fully in your control; monetisation is not.
- Letting TomTom lapse this week is a bad default: the product is SEO-led, and an outage or broken core flow damages the one asset that is working. **Top up a small amount now, then earn the right to stop topping up by cutting calls.**
- The "pause APIs until monetisation moves" lean in the brief is the right *fallback*, not the first move — it kills the product's core function and, with it, the SEO position.

### 30-day action list

**Week 1 (by 28 Sep) — stop the bleeding, get the data**

1. **TomTom top-up decision today.** At €4.3/day, **€50 ≈ 11–12 days**, **€100 ≈ 23 days** (Derived). Recommend a **€50 top-up** as a bridge, explicitly time-boxed to the call-reduction work below. Do *not* set up auto-recharge yet.
2. **Set spend alerts** on TomTom (if available) and **GCP budget alerts** on both billing accounts (e.g. £30 and £60/mo thresholds). Consolidate Rush Hour Maps usage onto **one** GCP billing account.
3. **Close the OpenAI gap:** read the OpenAI usage dashboard for the parking key — monthly £ and remaining credits. Record the number in the brief. Set a hard monthly usage limit on the key.
4. **Verify the forecast cache is actually shared.** The server forecast cache in this repo uses Upstash Redis only if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set in the Vercel environment; otherwise it falls back to per-instance in-memory maps, which are close to useless on serverless. **Whether prod has these set is unknown** — check Vercel env vars. If unset, provisioning a free-tier Upstash instance is likely the single cheapest cost cut available. (This is an environment/config check to record, not a code change in this PR.)
5. **Instrument the funnel in PostHog:** `forecast_requested`, `forecast_succeeded`, `forecast_failed` (with reason: TomTom 4XX / rate limit / no route), `affiliate_click`, `bmc_click`. The brief notes success rate is not measured; without it you cannot tell whether the 63.9% 4XX storm is still hurting users.

**Weeks 2–3 — cut calls per session**

6. **Measure calls per forecast in prod** using the existing `apiCallCount` metadata already returned by the forecast endpoint (log it to PostHog as an event property). Target: ≤ 8 TomTom calls per *uncached* forecast; ≥ 40% forecast cache-hit rate.
7. **Investigate the 218 QPS breaches** — bursty parallel sampling. Serialise or throttle sampling per request; QPS breaches are wasted calls that still cost money.
8. **Reduce sampling granularity** for low-value time windows (e.g. coarser overnight sampling; interpolate more, sample less) and **cap forecasts per session** for anonymous users (e.g. 3 free forecasts, then a soft prompt).
9. **Maps:** confirm Places Autocomplete uses **session tokens** and has debounced input; check whether **Directions Advanced** calls are needed at all given TomTom does the routing (client-side route drawing may be achievable with the polyline already returned). Restrict the Maps key by HTTP referrer.

**Week 4 — first monetisation moves (only after cost is trending down)**

10. **Replace the generic Amazon "Road Trip Essentials" cards** with intent-matched offers: the user's intent is "I'm about to drive somewhere". Candidates (**Judgment**, none verified): parking apps (e.g. JustPark/YourParkingSpace partner programmes), breakdown cover, hotel/overnight stop for long routes, fuel price comparison. One offer, one placement, measured via `affiliate_click`.
11. **Add a low-friction "Buy me a coffee" moment** at the point of value (after a successful forecast), not in the footer. Measure `bmc_click`.
12. **Test Google AdSense** on the blog/SEO pages only (not the planner UI) as a floor. Expect small numbers; the point is a measured baseline.

### Risks

- **Outage by neglect:** TomTom balance hits zero within days; SEO-led product degrades silently. Mitigated by action 1.
- **Cost work that doesn't move the number:** if calls/session cannot be cut below ~10, TomTom stays ~€60+/mo and the product remains net-negative.
- **Hidden OpenAI spend:** unknown; could be material. Mitigated by action 3.
- **Two GCP billing accounts** obscure the true Maps cost and double the chance of a surprise bill.
- **Vercel Hobby limits** (no IP allowlist; datacenter 403 mitigation) — agent false positives, not a user-facing risk per the brief, but Hobby is also a ceiling on growth tooling.
- **Attention cost:** this is the product that consumes the most engineering time; that time competes directly with Heystacks monetisation.

### Kill-criteria (evaluate at day 30 and day 60)

Move to **"pause APIs / static-only"** (planner replaced by informational content, TomTom key disabled) if, at day 60:

- TomTom + Maps + OpenAI known burn is still **> £75/mo**, **and**
- calls per session have not fallen by **≥ 50%** from the ~23 baseline (Derived), **and**
- measured monthly revenue (affiliate + BMC + ads) is **< 25%** of known burn.

Move to **sunset** only if, additionally, 30d visitors fall **below ~2,000** (i.e. the SEO asset has decayed to less than half of today's 4,727) for two consecutive months — at that point neither cost-cutting nor monetisation has anything to work with.

Explicit *non*-kill: flat traffic alone is not a kill signal for this product; the burn/revenue ratio is.

---

## 2. Heystacks — **grow + monetise-first** (fix `www` this week)

### Facts (brief)

- Audience (GA4, 24 Aug–20 Sep, 28d): **11,108 active users**, **10,157 new users**, 66,415 events, avg engagement ~155s. DAU avg **~459**, last-7d avg **~534**, range ~358–641. Brief: "steady/up in window".
- Acquisition (new users): **Organic Search 4,860 · Direct 4,325 · Organic Social 652 · Referral 184 · AI Assistant 91 · Organic Video 43**.
- Sessions by channel: Organic Search **12,055** · Direct 6,719 · Organic Social 1,091 · Referral 328 · AI Assistant 185. Top sources: google/organic ~10,893; reddit.com ~694; t.co ~282; forum.warthunder.com ~187; chatgpt.com ~130.
- Content: long-tail "X Tracker – Heystack" pages, dominated by music-artist trackers (Ken Carson, Lil Uzi Vert, Playboi Carti, Yeat, Drake, Eminem, "Kanye Unreleased", etc.). Top-page bounce ~55–70%.
- Ops: apex **UP**; **`www.heystacks.com` returns Cloudflare 526** (invalid origin SSL), reconfirmed 21 Sep. `www` vs apex traffic split **unknown**.
- Cost: **~£50/mo hosting** (user-stated). Not on the Vercel team; Cloudflare + Sails origin; Bitbucket repo `HoneyB4dger/stansa-v3`; deploy pipeline **not audited**.
- Revenue: **£0**; no monetisation on-site; monetisation intent **not decided**.
- Instrumentation: **key events = 0** in GA4. GA4 property still branded "Tabltree".

### Derived

- Sessions ≈ 20,473 / 28d (sum of channel sessions), i.e. **~730 sessions/day**.
- Cost per active user ≈ **£50 / 11,108 ≈ 0.45p** — roughly **1/7th** of Rush Hour's ~3p per visitor.
- Heystacks has **~2.3× Rush Hour's audience at ~1/3 of the cost**.

### Judgment

- This is the portfolio's highest-leverage product and it is getting the least attention. It has the audience, the cheapest cost base, a rising DAU line, and *zero* attempts at revenue.
- The `www` 526 is the most embarrassing bug in the portfolio: any inbound link, bookmark, or search result pointing at `www` shows a Cloudflare error page. Because `www` is Cloudflare-proxied, a **Cloudflare redirect rule `www → apex` needs no origin certificate at all** and is a sub-hour fix; repairing the origin cert can follow at leisure. Fix the redirect first, then decide whether to repair the cert.
- Monetisation fit (**Judgment**): the audience is young music fans looking up trackers of *unreleased* material. That is (a) low-CPM for display ads, and (b) a **content-policy risk** with mainstream ad networks (AdSense/Mediavine-type networks are sensitive to leaked/unreleased-content contexts). The safer first experiments are **direct/affiliate** (merch, vinyl, concert tickets via artist-matched placements), **tips/patronage** ("keep the trackers free"), and **community sponsorship** (Discord/tracker maintainers). Display ads should be a *measured* experiment on a subset of pages, not the whole site, until policy risk is understood.
- Growth: the long-tail SEO engine is already working (12k organic sessions/28d). The cheapest growth is *operational*: fix `www`, submit a clean sitemap, verify Search Console coverage, rename GA4 from Tabltree, and make it trivially easy for the community to add/refresh trackers (fresh trackers = fresh long-tail pages).

### 30-day action list

**Week 1 (by 28 Sep) — housekeeping that costs nothing**

1. **Fix `www` today:** add a Cloudflare Redirect Rule (or Page Rule) `www.heystacks.com/*` → `https://heystacks.com/$1` (301). Verify with `curl -I https://www.heystacks.com/`. Log the fix in the brief.
2. **Size the damage:** in Search Console, check impressions/clicks for `www.` URLs over the last 3 months (the `sc-domain` property covers both hosts). This resolves the "how painful is the 526?" gap.
3. **GA4 hygiene:** rename property from "Tabltree - GA4"; mark **key events** (`tracker_open`, `outbound_doc_click`, `search`, later `tip_click` / `affiliate_click`). Without these, no day-30 decision on monetisation is possible.
4. **Audit the Bitbucket → Sails deploy pipeline**: confirm you can deploy a trivial change end-to-end. If you can't, that is the top risk to *everything* below.
5. **Decide monetisation intent** (the brief's open question 3). Recommended answer: **"free to read, monetised around the edges"** — no paywall on trackers.

**Weeks 2–3 — first revenue experiment, measured**

6. **Experiment A — patronage:** a single, tasteful "Heystacks is free and run by one person — support it" banner with BMC/Ko-fi, shown on tracker pages after ≥ 20s dwell. Measure `tip_click` and £.
7. **Experiment B — artist-matched affiliate:** on the top ~10 artist tracker pages only, one placement (e.g. official merch/vinyl/tickets). Measure `affiliate_click` per page. (**Judgment:** ticket/merch affiliates are the best fit for this intent; specific programmes are not verified.)
8. **Check ad-network eligibility** *before* applying: read the content policies for AdSense and one mid-tier network against the top 20 pages. If ineligible or borderline, skip display ads entirely rather than risk account bans on the `info@heystacks.com` identity, which is also tied to TomTom and GCP.

**Week 4 — growth hygiene**

9. **Search Console:** submit sitemap; review coverage errors; fix any 4xx/redirect chains left by the Tabltree → Heystacks rename.
10. **Community loop:** make "submit / update a tracker" a visible CTA; track submissions. Fresh trackers are the growth engine.
11. **Cost check:** confirm the ~£50/mo hosting figure from invoices and whether a cheaper tier exists for a Sails app at ~730 sessions/day (**Judgment:** likely yes, but not measured).

### Risks

- **Content/legal risk** (**Judgment**): fan trackers of unreleased music can attract DMCA notices; ad networks may reject or ban. Mitigation: monetise via patronage/affiliate first; keep a takedown process.
- **Deploy pipeline unknown** — if it is broken, no fix ships. Mitigation: action 4.
- **`www` share unknown** — the 526 may be losing a material slice of traffic and trust today. Mitigation: actions 1–2.
- **Shared identity:** `info@heystacks.com` is the login for TomTom, some GCP and the domain. A single compromised or suspended account hits two products.
- **Platform dependence:** Google organic is ~53% of sessions (Derived: 10,893 / 20,473); a core update could move DAU sharply either way.

### Kill-criteria

Heystacks should **not** be mothballed on current data. Re-evaluate only if, at day 90:

- 28d active users fall **below ~5,000** (less than half of today's 11,108) for two consecutive months, **and**
- measured monthly revenue is **< hosting cost** after two completed experiments, **and**
- the deploy pipeline cannot be restored with reasonable effort.

If revenue is < hosting but audience holds, the correct move is **keep** (it is ~0.45p per user), not mothball.

---

## 3. Benefits Advisor — **mothball now; dated sunset-or-revive decision at day 30**

### Facts (brief)

- Traffic (Vercel): **8 visitors / 8 pageviews (14–21 Sep)**; **25 visitors / 25 pageviews (22 Aug–21 Sep)**. Visitors ≈ pageviews → no multi-page depth. No SEO traction observed.
- Deploy: latest prod READY **25 Oct 2025** (~11 months old), commit "reverted createEmbedding". Runtime errors 7d: **none**.
- Source: `gh api repos/Matthews3301/serenna-vue` → **404** (private elsewhere, renamed, or deleted).
- Money: free; no ads/affiliate. **LLM / embeddings bill unknown.** Vercel Hobby footprint trivial.
- Owner position: sunset is an **option, not decided**.

### Derived

- ~0.8 visitors/day. At 1 PV each, there is no evidence anyone completes an advice flow.

### Judgment

- There is no audience to protect and nothing shipping. The only two things this product can do right now are **cost money silently** (a live LLM key) or **consume attention**. Mothballing removes both without foreclosing a revive.
- **Revive is a real option but a large one.** The UK benefits-advice space is dominated by gov.uk, entitledto, Turn2us and Citizens Advice (**Judgment**). A revive is a *new product launch* (content/SEO strategy, LLM cost model, source recovery), not a maintenance task. It should compete for the same attention budget as Heystacks monetisation — and on the evidence it loses that comparison.
- Recommending **sunset outright today** would over-reach the data: if the LLM bill is £0 and the source is recoverable, the dormant app costs nothing and the domain has option value. Hence **mothball with a 30-day decision date**, not sunset now.

### 30-day action list

**Week 1 (by 28 Sep) — stop paying for ghosts**

1. **LLM key audit:** in OpenAI (and any other provider used for embeddings), list keys and last-30d usage. Any key associated with Benefits Advisor / `serenna-vue`: **revoke or set to $0 hard limit** unless usage is genuinely zero and you want the demo to keep working. Record the monthly £ in the brief.
2. **Locate the source:** check personal GitHub (private repos, renamed), Bitbucket, and local machines for `serenna-vue` / "serenna". Vercel's project still holds the last deployed build — **download the deployment source/output from Vercel as a backup** before anything else changes.
3. **Confirm zero infra cost:** Vercel Hobby, domain renewal date and price (`benefitsadvisor.uk`).

**Weeks 2–4 — mothball state**

4. Leave the current deployment live *if* the LLM key is dead or hard-capped (no runtime errors in 7d; it costs nothing). If any LLM key must stay live for it to function, **replace the app with a static holding page** ("Benefits Advisor is paused — see gov.uk / entitledto / Turn2us") instead.
5. Keep the domain and Vercel project; **archive** any analytics access; remove it from weekly checks.
6. **Day-30 decision (by 21 Oct):** choose one of —
   - **Sunset:** delete the Vercel project, set the domain to a redirect or let it lapse at renewal; or
   - **Revive:** only with a written one-page plan covering audience source, LLM cost cap, and a 90-day traffic target; or
   - **Extend mothball** (acceptable only if known cost is £0).

### Risks

- **Unknown LLM bill** — the one thing here that could be materially expensive. Mitigated by action 1 *this week*.
- **Source loss:** if the 404 means the repo is deleted and Vercel's stored build is the last copy, waiting makes recovery harder. Mitigated by action 2.
- **Sunk-cost pull:** "prior LLM work" is listed as the biggest asset; it is only an asset if the source exists.
- **Reputational:** a 'live' free advice tool with an 11-month-old model may give outdated benefits guidance (**Judgment**). A holding page is safer than a stale advisor if anyone does arrive.

### Kill-criteria (already met on audience; gated on data hygiene)

- **Sunset at day 30** if: source is not recovered **or** no revive plan is written **or** any non-zero LLM cost cannot be eliminated. On today's traffic (25 / 30d), audience is not a factor that could rescue it.
- **Do not sunset** before actions 1–2 are done — revoke keys and back up the build first; deletion is the last step, not the first.

---

## Portfolio sequence

### This week (22–28 Sep) — in this order

| # | Product | Action | Why first | Effort (Judgment) |
|---|---|---|---|---|
| 1 | Rush Hour | Decide TomTom top-up (recommend €50 bridge ≈ 11–12 days) | Balance ~€16.78, runway 3–4 days; outage hits an SEO-led product | 10 min |
| 2 | Heystacks | Cloudflare redirect `www → apex` | Live error page on the largest-audience product; no origin work needed | < 1 h |
| 3 | Benefits | LLM key audit; revoke/cap; back up Vercel build | Only potentially material unknown cost; source-loss risk grows with time | 1 h |
| 4 | Rush Hour | OpenAI parking spend read; GCP budget alerts; check Upstash env vars | Closes the two Rush Hour unknowns that set the kill threshold | 1 h |
| 5 | Rush Hour + Heystacks | Conversion instrumentation (PostHog funnel; GA4 key events) | Day-30 decisions need success/click data that does not exist today | 2–4 h |
| 6 | Heystacks | Search Console `www` share; deploy-pipeline smoke test | Sizes the 526 damage; de-risks all later Heystacks work | 1 h |

### Weeks 2–4 (29 Sep – 21 Oct)

- **Rush Hour:** calls-per-session reduction (target ≥ 50% cut); Maps SKU review; consolidate GCP billing. No monetisation work until burn is trending down.
- **Heystacks:** monetisation intent decision → Experiment A (patronage) and B (artist-matched affiliate) live on a page subset; ad-network eligibility read.
- **Benefits:** stays mothballed; **day-30 decision on 21 Oct** (sunset / revive / extend).

### Days 31–60 (22 Oct – 20 Nov)

- **Rush Hour:** first intent-matched affiliate + in-flow BMC prompt; AdSense baseline on blog pages. **Day-60 kill-criteria review** (burn vs revenue vs calls/session).
- **Heystacks:** read experiment results; scale the winner; growth hygiene (sitemap, community submit loop).
- **Portfolio:** set the **max monthly burn** you are willing to carry (brief open question 6). Recommended target: **≤ £100/mo known burn** across the portfolio by day 60 (Judgment).

### Day 90 (~20 Dec)

- Heystacks kill-criteria check (expected: pass comfortably). Rush Hour: keep / pause-APIs decision locked. Benefits: already resolved.

### Attention allocation (Judgment)

Roughly **50% Heystacks / 40% Rush Hour / 10% Benefits** for the next 30 days — the inverse of where attention appears to go today (Rush Hour ships weekly; Heystacks has an unfixed SSL error and no analytics goals).

---

## Missing data that would change the call

| Gap (brief) | If it turns out to be… | Then… |
|---|---|---|
| **OpenAI parking spend** (Rush Hour) | > ~£30/mo | Known Rush Hour burn approaches £180+/mo; the "pause APIs" fallback moves forward from day 60 to day 30; parking feature becomes the first thing to gate or remove. |
| | ≈ £0 (credits/fallback) | Cost story is purely TomTom + Maps; call-reduction alone can get close to break-even. |
| **Benefits LLM bill** | Any non-zero recurring charge | Mothball becomes urgent (revoke keys this week); sunset likelihood rises sharply. |
| | £0 and source recoverable | Dormant app is genuinely free; "extend mothball" becomes a legitimate day-30 outcome; sunset is less pressing. |
| **Heystacks `www` vs apex share** | Material (e.g. ≥ 10% of Search Console impressions on `www`) | Fixing 526 likely yields an immediate audience bump; prioritise repairing the origin cert too, and re-baseline DAU before judging experiments. |
| | Negligible | Redirect is still worth doing (trust/bookmarks), but no growth effect expected; move straight to monetisation. |
| **Rush Hour forecast success rate** (not measured) | 4XX still failing user forecasts post-top-up | Fix reliability before any monetisation; failing forecasts also waste paid calls. |
| **Portfolio max burn** (owner's call) | e.g. £50/mo | Rush Hour must reach ≤ 20k TomTom calls/mo or pause APIs; Heystacks alone fits the budget. |
| | e.g. £200/mo | Rush Hour can be carried as a subsidised SEO asset while monetisation is tested over 90 days rather than 60. |
| **Heystacks deploy pipeline health** | Broken | All Heystacks actions block; fixing it becomes the week-1 priority above monetisation. |
| **Heystacks hosting cost basis** | Overpaying for a small Sails app | Cheaper tier could take the portfolio's fixed cost near zero. |

---

## One-page comparison

| | **Rush Hour Planner** | **Heystacks** | **Benefits Advisor** |
|---|---|---|---|
| **Recommendation** | **Keep + cost-cap → monetise-first** | **Grow + monetise-first** | **Mothball now → decide sunset/revive at day 30** |
| Audience (brief) | 4,727 visitors / 30d | 11,108 active users / 28d | 25 visitors / 30d |
| Trend (brief) | Soft/flat | DAU ~459 avg → ~534 last 7d (up) | Flat ~zero |
| Engagement (brief) | Bounce ~21–23%; ~2.5–3 min | ~155s; bounce ~55–70% (doc lookup) | 1 PV / visitor |
| Known burn (brief) | ~£150/mo (TomTom ~£110–115 + Maps ~£25–50) + OpenAI unknown | ~£50/mo hosting | Unknown LLM + trivial Vercel |
| Cost per user (Derived) | ~3p / visitor | ~0.45p / active user | n/a |
| Revenue (brief) | $0 new | £0 | £0 |
| Biggest risk (brief + judgment) | TomTom runway 3–4 days; burn ≫ revenue | `www` 526; money left on table; content-policy risk for ads | Paying for a dead app; source loss |
| Biggest lever (Judgment) | Cut TomTom calls/session (~23 today) | Fix `www`; first revenue experiment | Kill keys; back up build |
| Week-1 must-do | €50 TomTom bridge; OpenAI read; budget alerts; Upstash check; PostHog funnel | `www → apex` redirect; GA4 key events; pipeline smoke test | LLM key audit; locate source; back up Vercel build |
| Day-30 checkpoint | Calls/session down ≥ 25%; OpenAI known; funnel live | `www` fixed; Experiment A + B live; intent decided | **Sunset / revive / extend** decision |
| Day-60 checkpoint | Kill-criteria review: burn ≤ £75 or calls −50% or revenue ≥ 25% of burn | First £ measured; scale winner | Resolved |
| Kill-criteria | Burn > £75 **and** calls not −50% **and** revenue < 25% burn at day 60 → pause APIs; < 2k visitors/30d for 2 months → sunset | 28d users < 5k for 2 months **and** revenue < hosting **and** pipeline unrecoverable | Source not found **or** no revive plan **or** non-zero LLM cost → sunset at day 30 |

---

*Nothing in this document changes application code, dependencies, or Vercel configuration. All actions are to be carried out and verified separately; numbers marked Derived or Judgment should be replaced by measurements as they become available.*
