# LG-11A owner review package

UNAPPROVED, documents only, 2026-10-15. Parent review precedes owner decision. This sheet requests no live payment implementation or activation.

Recommend approving one provider-neutral, test-only local receipt contract mock. Exact future lease: new worker/payments-contract.mjs, worker/payments-contract.test.mjs, worker/README.md, plus a separate narrow .assetsignore worker/** exclusion before those files exist. No Ops/game edits, root deployment wiring, dependencies, HTTP server, provider adapter or actual paid grant. Proposed checks and commands are in [the design](LG-11A-payments-design.md#smallest-next-task).

The mock establishes stable receipt issuance, atomic modeled event/receipt state, authorized repeat retrieval, response-loss recovery and checkout-disabled behavior. It does not establish real signatures, database concurrency, actual save-owner application or public purchase safety. Provider and prices need not be selected to inspect this small prerequisite. Its only blocking decisions are the proposed mock behavior and exact lease/exclusion.

## Decisions before relying on a live design

- Q5 is an unconfirmed no-consumables default. Select the allowed paid catalogue before implementing payment semantics. Permanent items do not supply a currency spend ledger.
- Q6 is an unconfirmed no-accounts default. Select accountless parent-held recovery or a separately designed authenticated model. Do not promise exclusive-device or exact cross-device balances from a bearer code.
- Select what restoration promises. Recommended accountless option restores original purchased credits to an explicit replacement save, accepting local-copy/previous-spend limitations. Exact unspent DB, earned balance, owned items and save restoration need additional authoritative records or a save backup model. This recommendation remains unapproved.
- Select the provider and verify its signature protocol, product/currency mapping, idempotency/reconciliation and parent-held code delivery. No provider, fee, tax or country claim is approved here. Email stays with the provider; omit it from Worker/game storage.
- Select cash-refund/chargeback and partial-refund treatment, spent bought DB/mixed-source entitlements, restore eligibility and offline status policy. Retain purchase history; no anti-cheat deletion or automatic earned-balance clawback.
- Approve final pack amounts/prices and Endless price only when needed for live catalogue configuration. Draft examples remain unset. Q8/Q9 and unrelated progression defaults remain open without blocking the mock.

Fixed requirements need no reopening: adult gate and explicit confirmation before provider-hosted checkout, quiet/hidden paid store, ad-free play, no player data fields/chat/ads/gacha/FOMO and earned-play availability during outage. LG-12 policy/gate review and owner legal review remain separate prerequisites. No final user-facing legal text is supplied.

## Why the next task is bounded

Current source has only a pure Vault validator and restricted settlement coordinator. All Vault-bearing full-shell saves remain blocked. Local vault:<sequence> DB spending receipts are not authentic provider payment receipts. There is no current paid apply-once API to wire into the backend.

Replace globally redeem once with one receipt per verified payment, repeatable authorized retrieval and one acknowledged local credit per stable receipt ID. This avoids losing a purchase when a redeem response or save fails. It does not recover spent/earned balances or synchronize devices. The proposed transactional storage direction is D1 rather than a KV consumed flag; the design links the two official storage references and separates that future adapter from the first mock.

LG-10B is locally accepted. Current named earned maximum is 109+6=115 DB. The future 120 ceiling and other allocations remain unapproved. No premium prices or existing documents were amended.

## Review outcome and release boundary

Prepared for parent review only. All new routes, records, recovery/refund rules and the proposed next task remain UNAPPROVED. A separate client lease is required for paid-source validation, actual-owner acknowledged application/Retry, loader/admission/effect prerequisites and both-edition UI. Master LG-11 worker/** ownership grants no Ops writes.

Documents ownership is released with the evidence Handoff. Parent may review this package, then obtain the owner's concrete decision before dispatching any implementation. Runtime/payment/security/compliance acceptance remains UNVERIFIED; no commit, deployment or default activation occurred.
