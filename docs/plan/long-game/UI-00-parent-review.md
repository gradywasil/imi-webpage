## Parent review amendments

Parent personally opened all10 captures. Mechanical layout scan found no findings, while the rendered clipping, tab occlusion and alignment defects below are visible. The following amendments govern the implementation proposal:

- Full-right-area glow must anchor to #opsRoot, not only #o-floor: root includes News and desk/keeper cards as well as Floor, while #o-floor is just the lower pane. Enable it only on the game screen with Floor selected; exclude rail/menu and remove duplicate stage heat. Keep content above the tint and retain stage-local keyboard/ember behavior.
- Timer meters follow actual remaining buff time and existing deadline adjustments. advanceDeadlines moves end stamps for extra game time, so a fixed real-time animation alone is insufficient. Preserve current speed/hold/resume behavior, freeze meter motion in the held Retry presentation, and do not introduce a new clock or persisted timer format. productionNow is not pickup-only. This corrects the original timer wording below.
- For the first UI build, recommend the six proposed names with recognition-only milestone messages/tint at500+, without new resource grants or buff extensions. Their tangible rewards remain a later tuning decision. Existing10-200 rewards stay unchanged. New cosmetic feedback must not consume gameplay RNG.
- Include sw.js in the implementation lease for its cache-version bump. Serialize the Ops/CSS work after the production-goal slice so the shared layout changes can include its controls. No new art, rebrand or broad QA campaign.

