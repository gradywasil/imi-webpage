# LG-02A historical profile and hash qualification

Recorded2026-10-13 after independent full QA r1. This corrects interpretation, not raw evidence or economy tuning. Original completion HANDOFF and all prior raw reports remain immutable.

The historical LG01 fresh disabled report at evidence/LG-01/qa-runtime-r3/disabled-fresh.raw.json has activeMinutes30. The LG02A fresh before/after and independent current reports use activeMinutes180, with requested/session/actual60, seed1 active/collect, tune{}. Under the same JSON.stringify(value,null,2) plus newline representation after only capturedAt/sourceCommit/sourceHashes/url/wallSeconds exclusions, the historical SHA is5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9 and the LG02 before/current SHA is017fae08d71fe4064f0ef4cd05a75dfecc449b5581677e351934bda54dd507ee.

The policy difference produces different gameplay totals: manual taps7046 versus14250, final bananas479300 versus485275, paws16 versus20, kids169 versus177, library3 versus0, earned1035550 versus1041525. Therefore the completion handoff's claim of only a different representation/source checkpoint without gameplay difference is not supported. A differing hash alone cannot explain that difference or prove a regression.

LG02A's original before and current reports compare the SAME actual policy and match exactly after the five authorized provenance exclusions. That local preservation result passes within the captured harness output. It does not establish equality with the historical different-policy report or exhaustive serialized internal state/RNG coverage. The harness's omitted systems and native supplements retain their actual boundaries.

Independent supporting receipts are LG-02A-QA-runtime-r1.md and evidence/LG-02/qa-runtime-a-r1/parity.json. All future LG02A repair/acceptance commands must state the actual activeMinutes180 policy when comparing these frozen reports. No old raw report, command, canonical artifact, failure or provider-interrupted source is replaced.
