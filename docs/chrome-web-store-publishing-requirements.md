# Chrome Web Store publishing requirements for Recess: a 2-week sprint plan

**Bottom line: a 2-week sprint to "submitted and approved" is achievable but tight, and the single biggest lever is permission design.** If Recess ships with `declarativeNetRequest` (no broad host permissions like `<all_urls>` or `https://*/*`) and a complete, accurate store listing, real-world data from April 2026 puts the review at **hours to ~2 days** [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/). If Recess requests broad host permissions, Chrome's submission dashboard will explicitly flag "**your extension may require an in-depth review**," and timelines stretch to **7 days–5 weeks** [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/) [developer.chrome](https://developer.chrome.com/docs/webstore/review-process). Chance-based reward mechanics are **explicitly permitted** as long as no real money is involved and the listing says so [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/regulated-goods-and-services). The hard work is not in passing review — it's in producing the listing assets, privacy policy, and per-permission justifications in parallel with code freeze.

---

## 1. Developer account: $5 and identity verification through Google Payments

The Chrome Web Store charges a **one-time $5 USD registration fee** paid through Google Payments [developer.chrome](https://developer.chrome.com/docs/webstore/register). The account also requires:

- **Identity verification** via the Google Payments profile (name, address, payment method) [developer.chrome](https://developer.chrome.com/docs/webstore/register)
- **A dedicated developer email address** that is verified at signup and **cannot be changed afterward** [developer.chrome](https://developer.chrome.com/docs/webstore/register) — pick this carefully (a team alias like `dev@recess.app` is better than a personal Gmail)

**Sprint implication:** This is a Day 1 task and can take a few business days for Google Payments verification to clear. Do not leave it for the end of the sprint. If you plan to publish under a company name or take payments later, set up the developer account as a "group publisher" account from the start — converting later is friction.

---

## 2. Store listing assets: exact specs and counts

| Asset | Spec | Count |
|---|---|---|
| Store icon | **128×128 px**, PNG or JPEG | 1 required [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) |
| Screenshots | **1280×800 px** preferred (or 640×400), PNG or JPEG | **1 minimum, 5 maximum** [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) |
| Small promo tile | **440×280 px**, PNG or JPEG | 1 required [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) |
| Marquee promo tile | **1400×560 px**, PNG or JPEG | Optional (only used if Google features you) [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) |
| Summary (short description) | **132 characters max**, plain text only | 1 required [developer.chrome](https://developer.chrome.com/docs/webstore/best-listing) |
| Detailed description | No documented hard limit; should be comprehensive prose | 1 required [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) |

**Sprint implication:** The PhD and PM can produce **all five screenshots, both promo tiles, and the icon in parallel** while the developer finalizes code. Treat the **132-char summary** as a marketing artifact — it shows in search results and is the highest-leverage copy you'll write. Practitioner reports repeatedly cite "**vague or placeholder screenshots**" and "**title stuffed with keywords**" as common rejection causes [ycombinator](https://news.ycombinator.com/item?id=37121263).

---

## 3. Permissions: which trigger warnings, and why declarativeNetRequest is your friend

Of the permissions Recess plans to use:

| Permission | Install warning shown to user | Notes |
|---|---|---|
| `storage` | **No warning** [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) | Safe for session/event logging |
| `tabs` | **"Read your browsing history"** [developer.chrome](https://developer.chrome.com/docs/extensions/reference/permissions-list) | Triggered because it exposes URL/title |
| `declarativeNetRequest` | **"Block page content"** [developer.chrome](https://developer.chrome.com/docs/extensions/reference/permissions-list) | **No host permissions required for blocking** |
| `webRequest` | Warning + requires host permissions [developer.chrome](https://developer.chrome.com/docs/extensions/reference/permissions-list) | MV3-discouraged; avoid |
| `<all_urls>` / `https://*/*` host perms | **"Read and change all your data on all websites"** [developer.chrome](https://developer.chrome.com/docs/extensions/reference/permissions-list) | The single biggest review-delay trigger |

**Critical design decision for Recess:** Use **`declarativeNetRequest` without broad host permissions** for the website-blocking feature. Per Chrome's own docs, "for blocking/upgrading requests: no host permissions required" [developer.chrome](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest). Host permissions are only required if you also need to **redirect** or **modify headers**. Pure blocking + a redirect to a "you're being protected, do focus instead" page hosted *inside* the extension itself can be done without host permissions.

A developer reporting in April 2026 captures the practical impact: "*extensions using only Declarative Net Request with no rule changes get auto-approved in hours, while anything touching broad host permissions gets shunted into mandatory manual review with no way back*" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/). Another: "*Once I cut down on all of those as much as possible my review times went down from 12 days to 2 or less*" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/).

Avoid `webRequest` entirely — it's a Manifest V2 holdover, and Manifest V3 is mandatory for all new extensions as of January 2024 [developer.chrome](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).

---

## 4. Privacy policy: required, must be a linkable URL, must cover three things

Because Recess logs usage events and session data, a privacy policy **is required** — Chrome's program policies state a privacy policy is needed "if the Product handles any user data" [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/policies).

It must be entered as a **URL link in the dashboard** — Chrome's docs say it "must be accessible by providing a link in the designated Chrome Web Store Developer Dashboard field" [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/policies). The docs do not require a custom domain; in practice developers host on GitHub Pages, Notion, a marketing landing page, or a privacy-policy generator URL — but it must be a stable, publicly accessible link (not a Google Doc behind sign-in).

The policy itself must "**comprehensively disclose**" three things [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/policies):

1. How the product **collects** user data
2. How it **uses** that data
3. **All parties** the data will be **shared with**

**Separate from the policy itself**, the dashboard's **Privacy practices tab** requires you to fill in [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy):

- A **single-purpose description** (free-form text)
- **Per-permission justifications** (free-form text per permission listed in your manifest)
- **Data usage checkboxes**: what data types the extension collects (usage data, personally identifiable info, authentication info, etc.)
- **Limited Use certifications** confirming the extension complies with Chrome's data-handling restrictions

**Prominent Disclosure** is an additional in-product requirement: if the extension handles data "not closely related to described functionality," the user must give "affirmative and informed consent prior to installation" via an in-product disclosure [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/policies). For Recess, session timing and usage events are closely related to the productivity functionality, so this likely won't apply — but if you later add analytics SDKs or behavioral tracking, you'll need to add a first-run consent screen.

---

## 5. Review timeline 2025–2026: bimodal, with permissions as the cliff edge

Real-world review times for new extensions in 2025–2026 follow a **bimodal distribution**:

- **Fast path (hours to 2 days):** narrow permissions, complete listing, MV3-clean code. April 2026 reports: "6 hours," "under a couple of hours," "24 hours" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/). May 2025 reports: "3 days," "5 days," "usually between 2-6 days" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1kpzq7v/may_2025_chrome_extension_review_times_much/)
- **Slow path (7 days to 5 weeks):** broad host permissions, sensitive APIs, first submission with permission changes, or any flagged content. One developer in April 2026: stuck at "**4–5 weeks manual review every time**" for updates touching broad permissions [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/). Another: 9–15 days for a first submission [reddit](https://www.reddit.com/r/chrome_extensions/comments/1sosivd/chrome_web_store_approval_taking_over_9_days_is/)

Chrome's official documentation confirms the trigger: "**Reviews may take longer for extensions that request broad host permissions or sensitive execution permissions**" [developer.chrome](https://developer.chrome.com/docs/webstore/review-process). Practitioners report a specific warning appearing in the dashboard at submit time: "*Because of the following issue, your extension may require an in-depth review: Broad host permissions*" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1pxctjb/i_just_submitted_my_first_extension_to_chrome/).

**Trend note:** Multiple May 2025 Reddit threads report a perceived slowdown vs. prior years — "*Anyone else experiencing Chrome Extension reviews taking a lot longer than they used to? It's now taking multiple days as opposed to 24 hrs or less in the past*" [reddit](https://www.reddit.com/r/chrome_extensions/comments/1kpzq7v/may_2025_chrome_extension_review_times_much/). Commenters speculate AI-generated extensions have inflated queue volume. Plan for **3–5 business days as your "expected" case** if everything is clean, with a 2-week buffer if anything trips the manual queue.

**Top rejection causes** observed across practitioner reports:

1. **Excessive permissions** (asking for `<all_urls>` when specific patterns would suffice) [reddit](https://www.reddit.com/r/chrome_extensions/comments/1suf4kl/chrome_review_times_are_brutal/)
2. **Incomplete/misleading metadata** — placeholder screenshots, vague descriptions ("*Description provided is insufficient to understand the functionality*") [ycombinator](https://news.ycombinator.com/item?id=37121263)
3. **Broken or non-functional features** [extensionfast](https://www.extensionfast.com/blog/how-to-pass-the-chrome-web-store-review-on-your-first-try)
4. **Obfuscated or minified code** — one developer cited "no comments (change your build process)" as a flag reason [stackoverflow](https://stackoverflow.com/questions/32278173/how-can-i-find-out-the-reason-for-chrome-webstore-extension-rejection)
5. **Single-purpose violation** — extension does multiple unrelated things [developer.chrome](https://developer.chrome.com/docs/webstore/troubleshooting)
6. **Missing/inadequate privacy policy** [developer.chrome](https://developer.chrome.com/docs/webstore/troubleshooting)
7. **Remote code execution** — loading scripts from external URLs or using `eval()` (banned in MV3) [theregister](https://www.theregister.com/2025/02/07/google_chrome_extensions/)

Resubmissions after a rejection are typically reviewed in **1–3 days** if you fix exactly the cited issue [extensionfast](https://www.extensionfast.com/blog/how-to-pass-the-chrome-web-store-review-on-your-first-try).

---

## 6. Permission justifications: per-permission, free-form, must be specific

Justifications are submitted in the **Privacy practices tab** of the developer dashboard, as a **"Permissions justification" section** with a free-form text field for **each permission** listed in your manifest [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy). There is no documented character limit, but reviewers expect specificity tied to a concrete feature.

Generic justifications like "to provide functionality" fail review [extensionfast](https://www.extensionfast.com/blog/chrome-extension-permissions-how-to-request-less-and-get-more-installs). The pattern that works: **one feature, one permission, in plain language**. Example drafts for Recess:

- **`declarativeNetRequest`:** "Used to block user-selected distracting websites during active focus sessions, per the user's configured site list. Rules are loaded from local extension storage and applied only when a focus session is running."
- **`storage`:** "Used to persist the user's site block list, focus/break session history, reward state, and preferences locally on the user's device. No data leaves the user's browser."
- **`tabs`:** "Used to detect when the user navigates to a blocked site during a focus session, so the extension can redirect them to the focus-restore page. Only URL is read; no browsing history is retained or transmitted."

The Privacy practices tab also requires a **single-purpose description** — write this as one sentence (see §7 below).

If a permission listed under Privacy practices isn't actually needed by your code, **remove it from the manifest and re-upload** before submission [developer.chrome](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) — unused permissions are an easy rejection.

---

## 7. Content policy traps: chance-based rewards are fine; "single purpose" needs a one-line frame

**Chance-based rewards / loot boxes / slot mechanics: explicitly permitted.** Chrome's regulated-goods policy states verbatim: "*Products that simulate gambling but don't offer any opportunity for real money winnings, payouts, or prizes of value may be allowed. However, such products must clearly indicate that no real money is involved and comply with all other applicable policies of the Chrome Web Store*" [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/regulated-goods-and-services). A live precedent: the "Gamble Classroom" extension uses loot boxes with the disclaimer "*Lootboxes are luck based and cosmetics do not give any monetary value or advantages*" and is published on the store [chromewebstore](https://chromewebstore.google.com/detail/gamble-classroom/negckdpijkpfbellbeoapmmhbpnmnbef).

**Action:** Add a one-sentence disclaimer in your store listing detailed description such as "*Reward outcomes are chance-based, cosmetic only, and involve no real money or prizes of value*." Mirror it in the in-app reward screen.

**Single-purpose policy: low risk for Recess if framed correctly.** Productivity extensions combining blocking + scheduling + gamified rewards are all currently approved on the store, including direct conceptual analogs to Recess:

- **Focus Guard** — blocking + schedules + achievements [chromewebstore](https://chromewebstore.google.com/detail/focus-guard/ffcenbalgajgcmjiogbphhmieokhnjpk)
- **FOCUSMAN** — website blocker + dopamine tracking + gamification [chromewebstore](https://chromewebstore.google.com/detail/focusman-gamified-aesthet/cgiopcnlcnbfipiahophhjpeboiopbfe)
- **FlowGuard** — blocking + task-based reward time [chromewebstore](https://chromewebstore.google.com/detail/flowguard-focus-time-rewa/gildnaolammombfmmmggokedcpbdphjg)
- **Focumon** — Pomodoro + site blocking + monster collection [chromewebstore](https://chromewebstore.google.com/detail/focumon/abfbbbhpdmikoaemhhmdfkdpdkfnhihh)

The pattern: reviewers interpret "single purpose" as a **narrow subject area**, not a single feature. State the single purpose as one tight sentence — e.g., "*Recess helps users stay focused on intended work by blocking distractions and rewarding sustained focus sessions*" — and all the sub-features (blocking, scheduling, rewards, pet) read as services of that purpose.

**Pet characters / mascots: design them yourself.** Chrome's IP policy is general: "*Don't infringe on the intellectual property rights of others, including patent, trademark, trade secret, copyright*" [developer.chrome](https://developer.chrome.com/docs/webstore/program-policies/policies). No specific policy on original mascot designs was found. Risk arises only if pet designs resemble third-party IP (Pokémon, Tamagotchi, etc.). Keep designs original or commission them with rights assignment documented.

**"Addictive design" / dark patterns: no Chrome-specific policy.** Chrome Web Store has no published rule against streak counters, variable rewards, or notification mechanics. EU's Digital Services Act and FTC dark-pattern rules apply at the regulatory level but are not enforced through the store review process.

**COPPA / under-13 users: no Chrome-specific rule, but a real legal exposure.** Chrome Web Store has no published age policy [ftc](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy). However, COPPA (16 CFR 312) applies to any product "directed to children" under 13 or with actual knowledge of collecting data from children under 13. Recess's stated audience (students and remote workers) likely skews 16+, but if school districts adopt it for younger students you would acquire COPPA exposure. **Action:** In your privacy policy and store listing, state the target audience as "students aged 13+ and remote workers." This is a meaningful legal hedge that costs nothing.

**Cautionary precedent:** the Habitica Chrome extension (a major gamified productivity tool) was removed from the store and never returned [habitica](https://habitica.fandom.com/wiki/Chrome_Extension). Removal reasons appear to be technical (bugs, x-client enforcement) rather than content-policy — but it's a reminder that ongoing compliance, not just initial review, matters.

---

## 8. Fastest realistic path: a 2-week sprint plan

The submit button requires: working `.zip` + metadata (name, summary, detailed description, icon, ≥1 screenshot, small promo tile, privacy policy URL, privacy practices form, permission justifications). Everything else can run in parallel.

### Suggested 2-week sprint structure

**Days 1–2 (parallel):**
- **Jon:** Pay $5, set up developer account, complete Google Payments verification (this alone can take 2–3 days to clear)
- **Developer:** Audit manifest. Confirm `declarativeNetRequest` is used (not `webRequest`). Remove `<all_urls>` and any unnecessary permissions. Confirm no `eval()` or remote-loaded scripts. Strip obfuscation, add comments
- **PM/PhD:** Draft the 132-char summary, the single-purpose sentence, and the per-permission justifications
- **Designer/PhD:** Draft icon (128×128) and 5 screenshot concepts

**Days 3–5 (parallel):**
- **Developer:** Internal QA on unpacked load (catches the "broken feature" rejection class)
- **PM/PhD:** Produce 5 final screenshots (1280×800), small promo tile (440×280), detailed description, and the privacy policy text covering collection, use, and sharing
- **Jon:** Stand up a hosted privacy policy URL (GitHub Pages, Notion, or your landing page — must be publicly accessible without sign-in)

**Days 6–7:**
- Fill out the dashboard: upload `.zip`, paste all metadata, complete the Privacy practices tab (single-purpose, justifications, data-usage checkboxes, Limited Use certifications), paste privacy policy URL
- Final pre-submit checklist: confirm no broad host permissions, confirm chance-based-rewards disclaimer is in the detailed description, confirm screenshots show real functionality
- **Submit**

**Days 8–14 (review wait, work in parallel):**
- If you used narrow permissions, expect **hours to ~3 days** to approval; if anything triggered in-depth review, expect to use the full window
- Build landing page, waitlist form, test-recruitment materials for Phase 03
- Prepare a v1.1 fixes branch so you can respond to any rejection in 1–3 days [extensionfast](https://www.extensionfast.com/blog/how-to-pass-the-chrome-web-store-review-on-your-first-try)
- Onboard early testers via unpacked-load distribution so the test can start the day approval lands

### Sequential dependencies (cannot be parallelized)

1. **Developer account creation must precede submit** (Day 1, but verification can lag)
2. **Privacy policy URL must be live before submitting** (must be linkable in dashboard)
3. **Final `.zip` must precede dashboard upload** (you can fill metadata first, but the build must exist to submit)
4. **First review must complete before any further version goes live** — if rejected, you fix and resubmit; if approved, future updates without permission changes can be much faster [developer.chrome](https://developer.chrome.com/docs/webstore/review-process)

### What blows up a 2-week timeline

- **Keeping `<all_urls>` in the manifest** — immediate shift to manual queue, often 2+ weeks
- **Listing the wrong permissions in the Privacy practices tab** vs. what's actually in the manifest
- **Privacy policy hosted somewhere that requires login** (Google Doc with restricted sharing, Notion in private workspace)
- **Generic permission justifications** ("for the app to work")
- **Skipping the chance-based-rewards disclaimer** — a single sentence costs nothing and removes a discretionary-rejection risk

---

## Where additional research would most help

Two areas would meaningfully sharpen the plan if pursued:

1. **The exact Privacy practices tab field structure** — official Chrome docs describe the data-usage and Limited Use checkboxes at a summary level. Sitting down with the live dashboard (which requires the $5 account to view) would let you pre-write the exact answers and avoid mid-submission surprises. Treat Day 1 of the sprint as the moment to take screenshots of the dashboard for your team.
2. **Recent (2025–2026) rejection patterns for productivity blockers specifically** — practitioner data here is dominated by ad-blocker rejections, which face higher scrutiny than focus blockers. A targeted outreach to founders of Focumon, FlowGuard, or FOCUSMAN (the closest precedents) could surface specific gotchas they encountered, which public sources do not capture.