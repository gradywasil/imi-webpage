/* Implemented gameplay defaults; featureProfile=legacy preserves diagnostic controls. */
window.GameFeatures = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search);
  const legacy = flags.get('featureProfile') === 'legacy';
  const implemented = new Set(['lg01a', 'lg02', 'lg02funding', 'lg02lamp', 'lg02speed', 'lg03', 'lg05folio', 'lg05layers', 'lg08archive', 'lg08challenge', 'lg08estate', 'lg08mastery', 'lg08print', 'lg09board', 'lg09hall', 'lg09seasons', 'lg09works', 'lg10awards', 'mg01', 'pg01', 'pg02', 'pg03', 'ui01']);
  const enabled = name => flags.has(name) ? flags.get(name) === '1' : !legacy && implemented.has(name);
  return Object.freeze({enabled, legacy});
})();
