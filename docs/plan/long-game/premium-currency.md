# Diamond Bananas: premium currency spec

**Status: broader premium spec remains a draft. The owner approved initial LG-02 restricted-build DB costs and behavior on2026-10-12 via [LG-02-owner-review.md](LG-02-owner-review.md).** G/T costs150/300/500/800 each, Plus100/200/400, seat300 and two-bed package200 are initial tunables for that isolated build. Endless/pack prices remain UNSET, cosmetics/Shelf deferred and shared/public purchases blocked. Approved local copy is not payment/policy legal approval. Other unselected prices/amounts and launch defaults below remain proposals;109 existing-content DB stays approved.

## Promises (shown to the player, in Settings and on the Vault page)

Design clarification approved2026-10-14: base Banana net may reuse the existing free golden-banana random effects unchanged, an explicit narrow exception to the broad wording below. No new random reward draw/category or Diamond Banana drop is permitted. See LG-03E-parent-review.md and evidence/LG-03/owner-approval-a5/receipt.json. This records mechanic authority, not revised user-facing legal/policy copy or premium activation.

1. **No ads. Ever.** Not banners, not rewarded video, not interstitials. The only income is Diamond Bananas bought by players who want to support the game.
2. **No loot boxes, no random prizes, no "gotchas".** Every item shows exactly what it does and costs before you buy it.
3. **Nothing is pay-only for progression.** Every layer, automation, challenge and award is reachable without paying. Premium is faster, roomier and prettier, not gated.
4. **You can earn Diamond Bananas by playing**, in a limited amount (about a sixth of the catalogue by the end of the capstone). Buying them just gets you there sooner.
5. **Permanent purchases.** No subscriptions, no expiring boosts, no consumables (default of Q5).
6. **No pressure tactics:** no countdown offers, no limited-time exclusives, no "last chance" pop-ups, no price that jumps because the game thinks you are stuck.

## Currency rules

- Name: **Diamond Bananas** (DB). One balance, shown in the top bar once the player owns at least 1, and on the Vault page.
- Two sources, one wallet: **earned** (in the save) and **bought** (credited from a verified receipt). They are spent from the same balance. Earned is spent first, so a player can see how much of the catalogue they got free.
- Free income: once-only awards, challenge first clears, layer first resets and Complete Works plays. The owner-approved LG-01 existing-content allocation is **109 DB**: 76 from the named award catalogue and 33 from first Printing/challenge clears; see [the approved reward design](LG-01-reward-design.md). Future award/layer/play amounts remain provisional, including Imprint 1: 25, Estate 1: 50 and each Complete Works play: 10. Target total free pool: **about 1,000 DB** by the end of the capstone, none of it from a repeatable grind. On 2026-10-12 the owner approved removing recurring daily DB; ordinary daily rewards remain. Recurring commissions and Seasons grant ordinary gameplay rewards unless a later approved finite milestone allocation says otherwise.
- DB is **never** dropped by golden bananas, pickups or random events, so it can never feel like a lottery.
- DB spent is final in the UI, but a purchase has a 10 s **Undo** toast (bought items are only restored locally; no cash refund path is implied).

## The catalogue (all permanent)

Costs are in DB. The ladders are staged exactly as the owner described: each tier is its own purchase and the last one is the big one.

| Line | Tier effect | Costs | Total |
| --- | --- | --- | --- |
| **Game Speed** | the whole simulation runs x1.25, x1.5, x1.75, **x2.0** | 150, 300, 500, 800 | 1,750 |
| **Typist Speed** | permanent x1.25, x1.5, x1.75, **x2.0** to every typist, on top of traits, coaching, Legacy | 150, 300, 500, 800 | 1,750 |
| **Night Lamp+** | offline cap 24 h, 36 h, 48 h (efficiency stays as the lamp tiers give it) | 100, 200, 400 | 700 |
| **Endless Night Lamp** | removes the offline time cap permanently: typists, keepers and royalties keep working however long you are away. Efficiency (50-70% by lamp tier) is unchanged, and Game Speed applies offline too | **price set by the owner (Q10); placeholder 1,200. Replaces Night Lamp+ for anyone who buys it** | 1,200 |
| **Fourth Muse seat** | a 4th seated Muse | 300 | 300 |
| **Extra garden beds** | beds 7 and 8 (2 more) | 200 | 200 |
| **Cosmetics** | typewriter paints, monkey outfits (uses the 30 looks and the art-v2 set), banana skins, UI themes, award frames, sound packs | 30-150 each | about 1,500 |
| **Supporter's Shelf** | name on the in-game credits shelf, a gold ribbon on the menu. Granted by *any* purchase of 500+ DB total, not itself sold | n/a | n/a |

Catalogue total about 7,400 DB (the Endless Night Lamp placeholder included; Night Lamp+ and Endless overlap, so a buyer of both pays for neither twice: Endless costs 1,200 minus what was already spent on Night Lamp+). Both ladders maxed is x2 game speed AND x2 typists, which is deliberately big ("not a gotcha"); what keeps it from breaking the month is the pacing section of the main plan (sub-linear reset currencies and a 55% calendar-time acceptance test).

What premium never sells: automations, layers, challenge clears, Legacy stars, Press Seals/Charters, bananas, letters, awards, or the capstone.

**What game speed touches:** `dt` in `tick()`, `simulateAway()` (decided: offline too), keeper, garden, premiere and buff timers, the Oulipo Deadline clock (it runs in game time so speed cannot be used to beat it unfairly, and a slow clock cannot cost the player a run). **What it does not touch:** the world clock (day/night/weather), the daily crate, Seasons, Commission expiries, the news ticker, and sound/animation timing.

**Typist Speed vs Legacy "Printing Press":** both stay and multiply. If testing shows the product is too strong, reduce the last tier (x1.75 cap) rather than re-pricing, and keep the ladder shape.

## Price and packs

Anchor: **about 100 DB per US dollar at the base pack**, bigger packs add a bonus. Final prices belong to the owner.

| Pack | Price | DB | Bonus |
| --- | --- | --- | --- |
| Handful | $2 | 200 | none |
| Bunch | $5 | 550 | +10% |
| Crate | $10 | 1,200 | +20% |
| Truckload | $20 | 2,600 | +30% |

The whole catalogue costs about $65-70 at the best rate; a **Supporter Bundle** (one item from each line, first tiers, about 20% off) is the single obvious "I just want to support you" purchase. A player who only wants to say thanks can buy $2 and keep it.

Earned DB (about 1,000) is worth roughly $9-10 of the catalogue, so a long-time free player can own for example Game Speed to x1.5 and Typist Speed to x1.25, or a handful of cosmetics.

## Technical design

The game is a static site on Cloudflare Workers assets with saves in `localStorage` and no accounts. Real-money purchase needs a small server, and the plan keeps it as small as it can be.

```
Vault UI (vault.js)  -> POST /api/checkout {pack}        -> Worker creates a hosted checkout session
Provider checkout    -> webhook /api/webhook              -> Worker verifies the signature, stores receipt {id, email, pack, db} in KV/D1
Provider redirect    -> /?redeem=<receipt id>            -> game calls /api/redeem
/api/redeem          -> returns {db, sig}  (once per receipt id)     -> client adds db to S.prem.bought, stores the receipt id
Settings > Restore   -> the purchaser (a parent) enters the recovery code from their receipt; Worker returns the receipt ids; client redeems any it has not seen
```

- **Provider:** a merchant of record (Paddle, Lemon Squeezy and similar) takes on sales tax/VAT filing, which a solo developer otherwise has to do per region; plain Stripe Checkout is the alternative with lower fees but you handle tax. Default: merchant of record. **Verify current fees, supported countries and terms with the providers before committing; this plan does not assert them.**
- **No accounts at launch** (Q6). The payment provider emails the receipt to the purchaser, never to the game; it carries a **recovery code**, and the game only ever sees that code. Cloud save is a possible later task and would also become the recovery mechanism.
- **Trust model:** DB lives in the local save, so a determined player can edit it. This is accepted for a single-player game with no leaderboards: the redeem step exists to make purchases durable and restorable, not to stop cheating. Do not add anti-cheat that could ever delete a legitimate player's purchase.
- **Web only.** Staying a PWA avoids app-store fees and store rules; wrapping in a store app later changes which payment methods are allowed and is a separate decision.
- **Worker code** lives in `worker/` (not served as game assets; add it to `.assetsignore`), secrets via `wrangler secret`, never in the repo.
- **Failure behaviour:** if the Worker is down, the Vault still shows earned DB and lets the player spend them; only buying packs shows "Store unavailable, try again later".

## Kids and families (Q7: decided, the audience includes children)

Treat every player as a possible minor. This is the owner's decision and it constrains the design:

- **Parent gate** before any real-money checkout: a step an adult passes easily and a young child cannot by tapping (for example a short written-out arithmetic or reading prompt, randomised), followed by a plain confirm ("This costs $5. A grown-up should say yes."). The gate is the only place real money is mentioned.
- **Store switch:** Settings > "Hide the Diamond store" removes every price, pack and buy button. Earned Diamond Bananas and what they bought still work. By default the store is visible but quiet: no pop-ups, no badges, no "!" on the Vault tab for paid offers.
- **No personal data from the player:** no accounts, no name/email/age fields in the game, no analytics that identify a person, no chat, no user-written text shared with others, no external links except the policy pages behind the parent gate. The payment provider collects payer details on its own page, from the adult.
- **Spending summary** (what was bought and when) on the Vault page so a parent can see it.
- No countdown offers, no FOMO, no characters begging the player to buy, no spending nudges inside a run or tutorial.
- The in-game content stays kid-friendly. The Imprint genres (horror, romance and so on) need an age-appropriate treatment; LG-05 must define it for every genre before anything ships.
- **Legal:** children's privacy rules (for example COPPA in the US, and the GDPR provisions on children in the EU) apply to services directed at or knowingly used by children. The design above collects nothing from the player precisely to stay clear of them, but the owner should have it reviewed by someone qualified before the first sale. This document is not legal advice.

## Compliance and trust checklist (owner decisions, not legal advice)

- Privacy policy, refund policy and terms pages linked from Settings and from the Vault, written before the first real sale.
- Show prices tax-inclusive where the provider does; digital-goods "right of withdrawal" notice where required (EU); the provider's checkout normally handles it, confirm.
- Kids and families (Q7): see the section above.
- No dark patterns: no fake scarcity, no tricking the player into the shop mid-run, no premium-only popups during tutorials.
- The "no ads" promise is written down in Settings and the README. If it is ever broken, that is a breach of this document, not a tuning change.

## Tasks that implement this

- **LG-01** the ledger (DB balance, source tagging, reward payout).
- **LG-02** the Vault page and everything you can spend earned DB on, including the speed and typist ladders (without any money flowing).
- **LG-11** the Worker and the purchase/restore flow.
- **LG-12** the policy pages and confirmation flow.
- **LG-13** the acceptance test that a fully upgraded bot still takes at least 55% of the free bot's time to the capstone.

Shipping LG-02 first, *free-only*, is deliberate: the economy can be tuned and the premium line can be felt before a single payment exists, and the first public version of the Vault is a good-faith gift to long-time players.
