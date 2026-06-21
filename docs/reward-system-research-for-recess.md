# Reward system design for Recess: what makes chance-based mechanics work

**Bottom line.** Chance-based rewards are not a universally better mechanic than fixed rewards — the evidence is the opposite for one-shot tasks. Lotteries reliably beat fixed payments only when (a) the behavior is **repeated** (so the variable-ratio schedule has room to compress engagement over time), (b) the **probability is non-trivial** (1-in-5 to 1-in-100, not 1-in-400), and (c) the **probability is overweighted by the user** because the prize is salient. For Recess, this means the current "chance to unlock one blocked site after a focus session" mechanic is on the right side of the evidence — but only if it's designed as a **portfolio**, not a standalone gamble. The strongest patterns across industries share five elements: (1) a **transparent pity floor** so users know the worst case, (2) a **high reveal-moment design budget** (animation, sound, near-miss), (3) **layered cadences** (per-session + daily + weekly + seasonal) so different psychological drivers fire on different timescales, (4) **earnable progression with a visible distance-to-goal**, and (5) **pause-without-punishment** mechanics to survive real life. The biggest failure mode is not "boring" — it's **streak/ring obsession** turning a productivity tool into an anxiety machine, the same way Apple Watch users report exercising at 11:45 PM to avoid breaking a streak [fortune](https://fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications/).

---

## 1. The evidence base for chance-based rewards: read this first

The behavioral-economics literature on lottery incentives is more mixed than the gamification community typically claims, and the differences map directly onto Recess design choices.

**Lotteries lose head-to-head against fixed payments of equivalent expected value on one-shot tasks.** Halpern et al.'s three RCTs on clinician survey response are the cleanest test: a 1-in-400 lottery for $2,000 (EV = $5) produced a **39.4% response rate**, while an unconditional **$5 fixed payment produced 58.8%** (N=988 nurses, p<.05) [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC3207198/). At identical expected value, the certain $5 beat the lottery decisively. This means: **if Recess offers a 20% chance to unlock TikTok for 5 minutes as the only reward, a guaranteed 1-minute unlock may produce more session completions.** The lottery framing is not magic.

**Lotteries do beat no incentive, and they outperform fixed rewards when the behavior is repeated and the probability is non-trivial.** Volpp's JAMA weight-loss RCT (N=57) found a lottery arm and a deposit-contract arm both produced ~13–14 lbs lost vs. 3.9 lbs in control over 16 weeks (p<.02). The lottery was structured as a **daily 1-in-5 chance at $10 plus a 1-in-100 chance at $100**, contingent on hitting a weigh-in goal [hbs](https://www.hbs.edu/ris/download.aspx?name=Volpp+et+al+2008+-+Financial+Incentive-Based+Approaches+for+Weight+Loss.pdf). Patel's physical-activity RCT (N=209) found a combined lottery (18% chance at $5, 1% chance at $50) raised the proportion of days hitting 7,000 steps from 0.26 (control) to **0.38** (p=.01) — but a jackpot-only arm (1-in-400 chance at $500) made things **worse than control** (0.13 drop, p<.001) [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC6826643/). **The shape of the probability matters more than the EV.** High-frequency moderate-value rewards beat low-frequency jackpots.

**Prize-linked savings is the cleanest commercial proof.** Cole, Iverson, and Tufano's South African field study found PLSA holders increased total savings by 38% — equivalent to ~1% of annual income — versus controls . UK Premium Bonds hold £120+ billion across 24 million participants at a 3.3–3.8% prize-fund rate, with odds of 23,000-to-1 per £1 bond per draw [nsandi](https://www.nsandi.com/products/premium-bonds). PLSAs work because they exploit probability overweighting (the inverse-S-shaped weighting function in Kahneman & Tversky's cumulative prospect theory, where people overweight small probabilities like 1-in-23,000 of winning £1M) [wikipedia](https://en.wikipedia.org/wiki/Prospect_theory). The behavioral pattern transfers: **make a small-probability salient prize visible and the user's subjective valuation will exceed the EV** — which is exactly the engagement lever Recess wants.

**Variable-ratio reinforcement is the underlying mechanism.** Skinner's foundational work established that variable-ratio (VR) schedules produce the **highest and most persistent response rates** of any reinforcement schedule, with strong resistance to extinction precisely because the subject cannot predict the next reward [explorepsychology](https://www.explorepsychology.com/variable-ratio-schedule/). This is why slot machines, gacha pulls, and dating-app swipes all converge on the same architecture. For Recess, this argues for **variable-ratio reward (chance per session)** over variable-interval reward (chance per random timer).

**Implication for Recess.** The current "chance to unlock one site" is defensible — but only if (a) the base probability is **substantial** (something like 20–40% per session, not 1-in-50), (b) the reward is repeatedly earnable so VR conditioning compounds, and (c) it's paired with a certain reward floor for users who don't want to gamble.

---

## 2. Anatomy of a satisfying chance reveal: design specifics from gaming

Gacha is the world's most-tested chance-reward UX, and the design moves are remarkably consistent.

**Transparent pity floors are the difference between "fair" and "predatory."** Genshin Impact's system is the most-praised in the category and the most-copied:
- **Hard pity at 90 pulls** guarantees a 5-star character
- **Soft pity** begins around pulls 74–75 (probability ramps up linearly)
- **50/50 system**: when a 5-star drops, 50% chance it's the featured character vs. a permanent banner character. Lose the 50/50, and the **next 5-star is guaranteed featured** — and this guarantee carries between banners
- The new "**Capturing Radiance**" mechanic adds a 5% chance to win the 50/50 anyway, shifting effective featured odds to ~55%
- Worst case is therefore knowable: **180 pulls = guaranteed featured 5-star**  [bittopup](https://news.bittopup.com/news/genshin-impact-pity-system-guide-90-pull-guarantee-50-50)

The praised mechanic isn't the pity number — it's that **the worst case is bounded and disclosed**. The contrast: Fate/Grand Order historically had no pity, meaning $1,000+ could yield nothing, and earned a reputation as "worst gacha ever" [reddit](https://www.reddit.com/r/gachagaming/comments/hrc01k/warped_perspectives_on_gacha_rates_and_pity/).

**The reveal moment is engineered at the millisecond level.** Win audio uses ascending pitch sequences that activate reward pathways **faster than the ~200ms threshold** for conscious assessment — the brain processes "win" before it processes "what" [casinocenter](https://www.casinocenter.com/slot-machine-psychology-how-the-near-miss-effect-drives-player-behavior-in-online-gaming/). Near-miss animations (the rare item "almost" landing, one position away) generate arousal levels **comparable to actual wins** even though the outcome was predetermined by RNG [teachboston](https://www.teachboston.org/near-miss-effect-slots/). UK Gambling Commission flagged near-miss engineering as a regulatory concern in 2018, so this is a design lever Recess should use **carefully**, but the underlying lesson is that the **reveal animation deserves a real design budget**.

**Probability overweighting needs salience.** Kahneman & Tversky's cumulative prospect theory shows people overweight small probabilities — but only when the prize is concretely salient [wikipedia](https://en.wikipedia.org/wiki/Prospect_theory). McDonald's Monopoly leans on this: top prizes at 1-in-60-billion odds (worse than Mega Millions) still drive traffic because the **prize is visible on every wrapper** [mattpilz](https://mattpilz.com/mcdonalds-monopoly-2026-detailed-odds-of-winning-every-prize/) [entrepreneur](https://www.entrepreneur.com/business-news/mcdonalds-monopoly-game-odds-are-astronomical/498170). For Recess: don't just say "you might unlock a site" — show **which site, with its actual icon**, before revealing the outcome.

**The minimum viable chance-reveal for Recess:**
1. Pre-reveal screen: show the **specific** unlockable prize (e.g., "TikTok, 5 minutes") with its icon
2. Animation lasting **2–4 seconds** with ascending audio pitch
3. Explicit probability statement on every screen ("Your odds this session: 28% — guaranteed at session 12")
4. Pity floor: after N consecutive non-wins, the next reveal is guaranteed
5. Carry-over: pity progress persists across days

---

## 3. Cadence: how often should chance rewards fire?

The combined evidence points to a specific cadence range, not a single answer.

**Variable-ratio (per-session) beats variable-interval (per-time) for productivity.** Games use VR ("every Nth quest gives a reward"); BeReal-style apps use VI ("random time of day"). VR generates obsessive high-intensity engagement; VI generates lower, steadier engagement [achievebetteraba](https://achievebetteraba.com/blog/variable-ratio-schedule-and-examples/). Recess's behavior is action-triggered (completing a focus session), so VR is the natural fit.

**The probability-frequency trade-off has an inverted-U shape.** Patel's RCT data is the cleanest experimental evidence: a high-frequency moderate-value lottery (18% × $5) produced significant improvement, while a low-frequency jackpot (0.25% × $500) at the same EV produced **worse outcomes than no incentive at all** [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC6826643/). The optimal probability range across the studies that worked: **roughly 1-in-3 to 1-in-20 per behavioral attempt.** Recess's current "chance to unlock one site" should sit in this range — probably **20–35% base probability per session**, scaling with session quality.

**Layered cadences beat single-cadence systems.** Every retention-leading game stacks multiple reward clocks. Pokemon GO is the archetype:
- **Per-action**: every Pokémon caught
- **Daily catch streak**: +500 XP days 1–6, **+2,500 XP / +3,000 Stardust on day 7** (7× bonus creates "appointment" psychology)
- **Daily spin streak**: same shape, day 7 yields ~28–35 items including a guaranteed evolution item
- **Weekly Adventure Sync**: 25km walked = a 5km egg; 50km = a 10km egg
- **Per-egg hatch**: variable contents per 2/5/7/10/12 km tier
- **Buddy walking**: candy per kilometer, scaling with rarity (1–20 km) [pokemongohub](https://pokemongohub.net/post/wiki/daily-weekly-streaks/) [switchbladegaming](https://www.switchbladegaming.com/pokemon-go/adventure-sync-guide/)

The result: ~1,446 additional steps/day in a meta-analysis of 17 studies covering 33,108 participants [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12469678/). No single mechanic does that; the layering does.

**Daily vs. weekly cadence: pick by friction level.** This is the cleanest design split in the data:
- **Daily streaks work for low-friction behaviors.** Duolingo's daily streak correlates with **3.5× higher retention** for users with 7+ day streaks , and Apple Watch ring closures drive measurable behavior change
- **Daily streaks fail for high-friction behaviors.** Nike Run Club deliberately uses **weekly** streaks (3×/5×/7× runs per week), because daily running creates guilt and injury risk [reddit](https://www.reddit.com/r/nikerunclub/wiki/reference/achievements/)
- Valorant's battle pass requires **1,372,000 XP** for tier 50, with dailies covering 63% of the XP pool. Community sentiment: "feels like a full-time job," and players report quitting after one season [ginx](https://www.ginx.tv/en/valorant/valorant-players-complain-that-battle-pass-is-too-much-grinding) [dotesports](https://dotesports.com/valorant/news/valorant-players-are-fed-up-with-grindy-new-battle-pass-and-theyre-demanding-changes)
- Fortnite's contrasting model: 100 tiers over 96 days (~$0.90/day of cosmetic value on the free track), **Supercharged XP that 10×-multiplies when players fall behind**, daily Punch Cards plus weekly challenges with 3-week stacking buffer [dancarter](https://dan-carter.medium.com/the-battle-pass-how-to-get-it-right-74b0a4041eff)

**For Recess (focus work is medium-high friction):** weekly streaks with a daily "soft check-in" (was a session attempted?) better matches the behavior than rigid daily streaks. **Add catch-up mechanics**: a missed day should not destroy a multi-week streak. Apple deliberately added watchOS 11's "**pause for 1–90 days without breaking streak**" feature in 2024 because users had been demanding it for years to address ring-obsession harm [macworld](https://www.macworld.com/article/2446605/how-to-pause-apple-watch-activity-rings.html).

---

## 4. What makes rewards feel earned, not arbitrary

Four design moves repeatedly differentiated "satisfying" from "hollow" rewards across industries.

**Visible progression with a known endpoint** activates the goal-gradient effect — customers accelerate as they approach the threshold. Starbucks's tier structure is the canonical example: 25 stars = drink customization, 100 = free coffee, 200 = free handcrafted drink, 300 = sandwich, 400 = $20 merch [krazycouponlady](https://thekrazycouponlady.com/tips/money/starbucks-rewards-program). Stars expiring at 6 months (Green tier) creates urgency; never expiring (Gold+) creates safety. The **35.5M active US members** spend 3× more per visit and visit 5.6× more than non-members [growthhq](https://www.growthhq.io/our-thinking/starbucks-rewards-unveiled-how-digital-loyalty-drives-37b-revenue-and-global-growth-in-2025). Rewards members generate ~57% of US company-operated revenue.

**Forced choice between valued options creates engagement that pure RNG cannot.** TFT's augment system presents **3 augments at stages 2-1, 3-2, and 4-2**, with a **43–58 second timer**, each from the same rarity tier (Silver/Gold/Prismatic) ). Players cannot be offered three of the same category (e.g., no triple-economy). The mechanic feels high-stakes because: (1) **no safe default** forces commitment, (2) the augment **persists the entire game** — sunk cost on the decision, (3) the choice **reveals skill** (reading board state to find synergies), (4) ~140+ augments across sets prevents meta-gaming. Recess could surface this directly: instead of one random reward, **show 3 chance-based reward choices** after a focus session and let the user commit to one.

**Earnable currency exchanged for tangible items beats discounts of equivalent cash value.** Sephora's mechanic — 1 point per $1, 2,500 points = $100 Rouge Reward, redeemable for full-size products via the "Rewards Bazaar" updated Tuesdays/Thursdays — generates a **73% birthday-reward redemption rate and 17.8× ROI** ($5 cost, $89 average order value) [rivo](https://www.rivo.io/blog/sephoras-beauty-insider-program). The psychology: points feel like "earned currency" (mental accounting), products activate dopamine reward centers, cash discounts activate frugality calculation [acrjournal](https://acr-journal.com/article/understanding-subscription-models-how-psychology-shapes-customer-loyalty-value-perception-and-cancellation-patterns-1475/). For Recess: rewards should be **specific, named, tangible** (the actual TikTok app icon, 5 minutes, on this break) — not abstract ("you've earned 30% boost").

**Constraint creates value.** Wordle's deliberate one-puzzle-per-day cap is the cleanest example. From 90 players in November 2021 to 2 million in January 2022 to **NYT Games hitting 11.2 billion plays in 2025**, with over half of weekly users playing more than one puzzle/day ^[techcrunch](https://techcrunch.com/2022/05/04/wordle-new-york-times-user-growth/ "Wordle brought \"tens of millions\" of new users to NYT") [fastcompany](https://www.fastcompany.com/91539885/wordle-statistics-show-why-new-york-times-is-turning-game-into-nbc-tv-show). The constraint did three things: prevented burnout (no infinite scroll trap), created a shared social moment (everyone solves the same puzzle), and made the **green-square share grid** a viral marketing engine (3.3M people tweeted, 32.2M tweets, 6.6 trillion views over 7 months) ^[techcrunch](https://techcrunch.com/2022/05/04/wordle-new-york-times-user-growth/ "Wordle brought \"tens of millions\" of new users to NYT"). For Recess: **scarcity is a feature** — the chance reward shouldn't be available infinitely; one reward per completed session is structurally correct, and limiting daily focus sessions might even be worth testing.

---

## 5. The reward portfolio: layering mechanics for different psychological drivers

No high-retention product uses a single reward type. Every example we examined layered at least three of: **immediate certainty, immediate chance, delayed certainty, delayed chance, social, retrospective.** This is the most important strategic finding for Recess.

**Pokemon GO's portfolio:**
| Layer | Reward type | Driver |
|---|---|---|
| Per-catch | Immediate certain (XP, candy) | Reinforcement |
| Daily streak | Delayed certain w/ multiplier | Loss aversion |
| Egg hatching | Delayed chance (variable contents per egg) | Variable-ratio anticipation |
| Buddy candy | Delayed certain (km-based) | Progress |
| Raids | Immediate chance + social | Variable-ratio + social |

**Sephora's portfolio:**
- Insider/VIB/Rouge **tiers** (status hierarchy)
- 1 point per $1 (**predictable accumulation**)
- 1.25–1.5× bonus events (**variable boost**)
- 2,500 points = $100 Rouge Reward (**redemption goal**)
- Birthday gift (**annual scarcity event**)
- Rewards Bazaar refreshed Tue/Thu (**variable inventory**)
- Exclusive product launches (**FOMO + status**)

The portfolio survives even when single layers fail — Reddit users explicitly question whether Rouge tier's incremental benefits justify the $650 additional spend over VIB [reddit](https://www.reddit.com/r/Sephora/comments/18brjw7/really_whats_the_advantage_of_being_rouge_vs_vib/), but the program still drives **~80% of Sephora revenue** through emotional loyalty and 2.5× higher purchase frequency for Rouge members [rivo](https://www.rivo.io/blog/sephoras-beauty-insider-program).

**Noom's portfolio** is the most disciplined behavior-change example: traffic-light food coding + daily 5-10 min CBT lessons + human/AI coach + peer community ("4-Cs model"). The result: **65-75% 6-month retention** (multiples of fitness-app norms), 78% of ~36,000 users lost weight over 9 months, 75% maintained 5% loss at 1 year [millennialhawk](https://millennialhawk.com/noom-review/) [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10551118/). The portfolio decouples retention from any single mechanic.

**Recommended Recess portfolio (synthesis):**

| Layer | Type | Mechanic | Notes |
|---|---|---|---|
| Per-session reveal | Immediate chance | 20–35% chance to unlock a single site for the break | Current mechanic — keep it |
| Per-session floor | Immediate certain | Guaranteed 1-min unlock or pet happy state | Halpern finding — fixed reward also works |
| Daily check-in | Delayed certain | Soft streak (no hard penalty for missed days) | Pause-without-loss model |
| Weekly milestone | Delayed certain w/ multiplier | "Focus week complete" → guaranteed premium reward | Pokemon GO day-7 model |
| Pity floor | Delayed certain | After N sessions without a win, next is guaranteed | Genshin model — transparent |
| Retrospective | Annual / monthly chance | "Your focus month" recap (shareable) | Spotify Wrapped model |

The seventh column not in the table but worth flagging: **avoid a social leaderboard.** Recess's target user is already comparing themselves unfavorably to TikTok creators; importing more social comparison into the productivity workflow is high-risk for the "pacing and sustaining" segment per the test brief.

---

## 6. Chance-based without feeling like gambling: legitimacy design

This is the legal/ethical lane and the brand lane simultaneously.

**The cleanest non-gambling chance designs share three features:**

1. **No-loss structure.** UK Premium Bonds and Yotta Savings are technically lotteries, but the principal is preserved — you cannot lose money to play. The "stake" is foregone interest, not lost capital [nsandi](https://www.nsandi.com/products/premium-bonds). Recess is structurally aligned: the user isn't risking money or even time (they completed the focus session for productivity reasons; the chance reward is upside).

2. **Full odds disclosure up front.** China legally requires gacha games to disclose drop rates (Genshin lists every rarity tier's probability). The praised systems disclose; the reviled systems don't. FGO's pre-2024 absence of pity was the reputational anchor for "predatory" [reddit](https://www.reddit.com/r/gachagaming/comments/hrc01k/warped_perspectives_on_gacha_rates_and_pity/). For Recess: every chance reveal should show the probability explicitly.

3. **No artificial loss states ("try again" cards).** Scratch-card design research finds that "no winner" outcomes generate brand resentment; the best scratch promotions ensure all participants win **something** (the variation is in prize size) [veeloy](https://veeloy.com/blog/psychology-behind-scratch-cards/18). Recess analog: every chance reveal should produce a reward, with chance determining which reward (e.g., a 1-minute unlock as the floor, a 5-minute unlock as the lucky outcome, plus the pet happy state always).

**Regulatory frame:** Belgium banned loot boxes in 2018 under existing gambling law; the UK House of Lords Gambling Committee recommended regulation in 2020 [yukaichou](https://yukaichou.com/gamification-analysis/dark-patterns-brignull-manipulative-design-ux/). Academic consensus (Drummond & Sauer 2018; King & Delfabbro 2019) is that loot boxes with **hidden odds** are dark patterns; loot boxes with **full disclosure** remain contested but legal in most jurisdictions. The previous canvas research already established that Chrome Web Store explicitly permits chance-based reward mechanics provided no real money is involved and the listing discloses it.

**The cleanest non-gambling precedent in productivity:** Wordle's design has zero gambling parallels but maintains daily compulsion through pure scarcity + social proof + streak. If the Recess team wants a "we are decisively not a gambling app" reference, **Wordle is the design north star**; if they want a "we use chance ethically" reference, **Premium Bonds and Genshin's transparent-pity model** are the references.

---

## 7. Failure modes to design against (this is where Recess loses the user)

Each industry has a characteristic failure mode. Recess will hit at least three of these unless explicitly designed against them.

**Streak obsession converting a productivity tool into an anxiety tool.** Fortune profiled Apple Watch users "bullied" into closing rings — exercising at 10:45 PM, working out while sick, deliberately abandoning streaks for mental health reasons [fortune](https://fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications/). One r/AppleWatch user titled their post "quitting Apple Rings was the best thing I did" . Apple's response was the watchOS 11 pause feature in Sept 2024 — a major capability they had refused for years. **Recess should ship pause-without-penalty from day one.**

**Grind perceived as anti-consumer.** Valorant's battle pass community sentiment shifted "from fun to chore" because dailies were mandatory and missed days were uncompensated [ginx](https://www.ginx.tv/en/valorant/valorant-players-complain-that-battle-pass-is-too-much-grinding). Halo Infinite addressed this by making the battle pass **never expire** — pure scarcity removal. For Recess: any progression system that **expires** should have a generous catch-up mechanic, or it shouldn't expire.

**Tier benefit cliff.** Sephora Rouge requires $650 additional spend vs. VIB for only 5 percentage points of additional discount; Reddit threads explicitly question the value [reddit](https://www.reddit.com/r/Sephora/comments/18brjw7/really_whats_the_advantage_of_being_rouge_vs_vib/). Recess analog: don't promise a "premium tier" of rewards unless each step is meaningfully better than the prior — gating cosmetic rewards behind effort that doesn't pay off in perceived value is the most common loyalty-program failure.

**Streak rage-quit on a single missed day.** If a user loses a 500-day streak to one missed day, the typical response is **permanent abandonment**, not redoubled effort . Duolingo's response was the "Streak Freeze" (preserve streak on 1 missed day per month, free weekly to all users); Apple's was Pause. Recess needs an equivalent **before** users have built streaks worth losing.

**Authenticity collapse.** BeReal grew to 73.5M MAU by August 2022 on a single-mechanic novelty, then collapsed to 16M MAU by March 2025 (a ~78% decline) as users pivoted from spontaneous moments to "rehearsed spontaneity" and the novelty wore off [wikipedia](https://en.wikipedia.org/wiki/BeReal) [onlineoptimism](https://onlineoptimism.com/blog/bereal-stats-app-figures-data-be-real-numbers-to-know/). **A single-mechanic product cannot retain.** Recess's reward layer must be designed as a system, not a single delight moment, or it will follow the same curve.

**Gaming the metric.** Pokemon GO users put phones on car dashboards (until Niantic capped distance attribution above 10.5 km/h) [switchbladegaming](https://www.switchbladegaming.com/pokemon-go/adventure-sync-guide/); fitness-tracker users walk laps to hit step goals; Reddit users farm karma with low-quality reposts. Recess analog: users will minimize work to harvest rewards (alt-tabbing to fake "focus," opening blank tabs). Design must make **gaming the metric harder than the actual behavior**.

**Extinction after incentive withdrawal.** A consistent finding across the lottery/incentive RCTs: **behavior reverts when rewards stop**. Patel found zero residual effect post-incentive in the physical-activity RCT [nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC6826643/). This is the deepest failure mode: external rewards undermine intrinsic motivation (overjustification effect). Noom's approach — CBT-based education running alongside the reward layer — is the only research-backed counter. For Recess, this argues for **eventual user-facing controls to dial down or off** the gamification once habits form, rather than escalating it indefinitely.

---

## 8. Answering the specific design questions

**Q: Individual vs. social rewards for students / remote workers?** Mixed evidence but tilting individual for this specific use case. Strava research finds users completing the **hardest individual achievements (30–100× average daily activity)** retain at 74.17% vs. 32.26% for easiest tier — i.e., self-set difficulty matters more than competition [trophy](https://trophy.so/blog/nike-run-club-gamification-case-study). Nike Run Club deliberately frames rewards as "beat your past self" rather than "beat other runners," which scales across ability levels. BeReal's collapse suggests social-only mechanics decay fastest. Strong recommendation: keep social out of the initial Recess design — the target user (already losing focus to TikTok / Reels) is being beaten up by social comparison all day; productivity is the wrong place to import more of it.

**Q: Optimal cadence for variable rewards?** Per-session variable-ratio with 20–35% base probability and a transparent pity floor (~10–15 sessions max). Add layered cadences (daily soft check-in, weekly milestone, monthly retrospective) so different psychological drivers fire on different timescales.

**Q: What makes a reward feel earned?** Four factors, in priority order: (1) **visible progress with a known endpoint** (Starbucks tiers, Genshin pity), (2) **meaningful choice between valued options** (TFT augments, Sephora Rewards Bazaar), (3) **specific tangible reward** rather than abstract bonus (the actual TikTok icon for 5 mins, not "+30% boost"), (4) **scarcity / constraint** (Wordle's one-a-day, limited-time events). Effort alone is necessary but not sufficient — Valorant requires more effort than Fortnite and players resent it more.

**Q: Is there a reward portfolio concept?** Yes — see Section 5. Every high-retention product layers 4-6 reward types covering immediate/delayed × certain/variable × individual/social/retrospective dimensions. The portfolio is the unit of design, not the individual mechanic.

**Q: Cleanest chance-based that don't feel like gambling?** Three precedents, descending order of relevance to Recess:
1. **Genshin Impact's transparent pity** — explicit odds, bounded worst case, carry-over between rolls, no real-money loss
2. **UK Premium Bonds** — no-loss structure (principal preserved), legal lottery, mass adoption (24M+ holders, £120B+)
3. **Wordle** — pure scarcity + daily ritual, zero gambling parallels, viral via shareable spoiler-free grid

---

## 9. Minimum viable applications for Recess

The team can pick any subset of these and ship it inside the 2-week sprint window already defined in the canvas.

| Mechanic | Reference | Minimum viable Recess implementation |
|---|---|---|
| Chance reveal with pity | Genshin 90-pull pity | 20–35% per-session unlock probability; **guaranteed unlock at session 10**; pity counter visible at all times; carries across days |
| 3-choice forced pick | TFT augments | After session completion, show 3 reward choices (e.g., "5 min TikTok", "3 min YouTube", "10 min Reddit"); user commits to one before the chance roll |
| Layered streak | Pokemon GO 7-day | Daily soft streak with day-7 multiplier reward; streak preserved across 1 missed day per week (free); explicit pause feature |
| Progress to tangible goal | Sephora Bazaar | Earn "focus coins" per completed session → redeem for specific named rewards (extended break, new pet variant, custom theme); refreshed weekly |
| Scarcity ritual | Wordle daily | Cap chance-unlocks at one per session, max 3 sessions per day; explicit "you're done for today, see you tomorrow" framing on cap |
| Annual retrospective | Spotify Wrapped | Monthly (not annual) "Your Focus Month" recap: hours focused, distractions avoided, top blocked sites; shareable card |
| Pause without penalty | Apple Watch watchOS 11 | One-tap "pause my streak for up to 14 days" — explicit, no shame, default available from day 1 |

**Recommended priority for the current test:** (1) keep the chance reveal but add transparent pity counter, (2) add a per-session reward floor so even non-winners get something, (3) add the day-1 pause feature before users build streaks worth losing. These three are low-engineering and address the most likely failure modes the test would otherwise surface.

---

## Where additional research would most change the conclusions

Two areas where another round would meaningfully sharpen the design:

1. **Direct A/B tests on chance vs. fixed rewards for digital-work behaviors.** The available RCTs are on health behaviors (weight loss, steps, surveys), not focused-work sessions. The closest analog in the literature is Volpp's deposit-contract work, but a search for productivity-specific evidence (rescue time, focus apps, study habits) returned nothing rigorous. If the team can run an internal A/B during the test phase, that data will outweigh any extrapolation from the literature.

2. **Long-term decay of variable-ratio rewards in productivity contexts.** Every RCT we found showed behavior regression after the incentive stopped, but the timeframes were short (16–26 weeks). Whether a chance-based reward maintains efficacy across multiple months — versus habituating and losing its edge — is the single biggest open question for the Recess business model, and isn't answerable from current literature. The 2-month testing window is exactly the right timeframe to start gathering this evidence.