# LG-13C R2 partial result and source diagnosis

2026-10-15. PARTIAL RESULT REVIEWED. One approved trajectory ran once, stopping after 7.944 wall seconds. Native Classic/Core empty-save admission, intended enabled owners/flags, G1, real intro completion and Bot startup were observed. No first session end, away, Printing, Folio, foundation or endpoint Save/reload occurred. endpointAcknowledged=false and horizonComplete=false; this is not a pacing result.

Parent read report, handoff, checkpoints/settings/resource identity and relevant current Bot/commission/Core code. All 16 current used-source hashes match the recorded run-final hashes. No source change or HTTP failure was recorded. Browser/server closure is reported and was checked by the operator; parent launched no new browser. Original R1, source repair and R2 artifacts remain preserved.

The final clock is 89 simulated seconds. The completed policy counters are 88 calendar/active seconds and approximately 87 productive seconds, because the exception interrupted the next policy second before its counters published. Intro completed at about 53 seconds. Final displayed Printing1, pending/current/lifetime stars0, one owned desk/three crew, wallet11375 and run-earned30875. These are early controlled-bot observations, not evidence of long-term pacing. One ordinary pickup was observed and removed without an attempted click; expiry versus disposal remains unknown.

Concrete source chain for the saved TypeError:

1. tools/bot.js:67 invokes D.action('commission',{i:String(best)}) in its realActions branch.
2. ops.js:3561 exposes action by passing ACTIONS[name] a plain {dataset} object.
3. ops.js:4686 commission passes that object to commission/commissionPublished.
4. ops.js:879 commissionPublished calls IMI.centerOf(el).
5. core.js:12 centerOf calls el.getBoundingClientRect(), which the plain object lacks.

tools/balance.html supplies centerOf:()=>[0,0], so the old headless fixture concealed the missing DOM-element contract. The product's ordinary commission button supplies a real element. The preceding source review missed this dependency. This diagnosis does not justify changing the game's geometry helper or weakening any owner/guard. The exception may occur after commission mutation/acknowledgement, so do not treat it as a rolled-back purchase or resume this state as a fresh trajectory.

Minimum next proposal is a tool-only optional commission dispatcher in tools/bot.js, supplied by regular-pilot-policy.js to activate the matching actual visible commission control through normal DOM navigation. Preserve the bot's offer choice and economics, actual owner/guard/ACK, and old default dispatch when the option is absent. No new fake getBoundingClientRect, centerOf stub, lower commit call, grants or synthetic commission. The runner can remain unchanged. This adds one previously read-only old tool to the next explicit lease, so it requires a new owner decision.

Recommend approving that narrow repair and ONE fresh bounded run together, as described in LG-13D-owner-review.md, rather than separate repair/run approval turns. No correction or new trajectory has been started under the consumed execution-only lease. Full LG-13 and six-week/all-profile/premium pacing remain UNVERIFIED.
