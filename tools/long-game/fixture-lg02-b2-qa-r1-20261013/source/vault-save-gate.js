/* Stable cold recognition only. Absence is not writer ownership. */
window.VaultSaveGate = (() => {
  'use strict';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let blocked = false, resume = false;
  try {
    const raw = localStorage.getItem('imi-ops-v1');
    if (raw !== null) {
      const state = JSON.parse(raw);
      if (object(state) && own(state, 'prem')) {
        if (!object(state.prem)) blocked = true;
        else if (own(state.prem, 'vault')) {
          blocked = true;
          const flags = new URLSearchParams(location.search);
          // Version recognition selects copy, never validates or admits Vault state.
          resume = object(state.prem.vault) && state.prem.vault.version === 1 &&
            (flags.get('lg01a') !== '1' || flags.get('lg02') !== '1');
        }
      }
    }
  } catch { blocked = true; }
  if (blocked) {
    document.documentElement.dataset.vaultBlocked = '';
    const show = () => {
      for (const child of document.body.children) child.inert = true;
      const panel = document.createElement('main'); panel.className = 'o-vault-gate';
      panel.setAttribute('aria-labelledby', 'vaultGateTitle');
      const title = document.createElement('h1'); title.id = 'vaultGateTitle'; title.textContent = 'Vault test';
      const content = document.createElement('div'); content.className = 'o-vault-gate-content'; content.tabIndex = 0;
      content.setAttribute('role', 'region'); content.setAttribute('aria-label', 'Save status');
      const message = document.createElement('p');
      message.textContent = resume ? 'This save contains Vault items. Resume the Vault test to open it safely.' :
        'This save cannot be opened safely. Your saved data has not been changed.';
      const scope = document.createElement('p');
      scope.textContent = 'Vault test: one game document on this isolated test origin. Shared saves and public purchases are not enabled.';
      content.append(message, scope);
      const action = document.createElement('button'); action.type = 'button'; action.textContent = resume ? 'Resume' : 'Retry';
      action.addEventListener('click', () => {
        if (!resume) { location.reload(); return; }
        const url = new URL(location.href); url.searchParams.set('lg01a', '1'); url.searchParams.set('lg02', '1');
        location.replace(url.href);
      });
      panel.append(title, content, action); document.body.appendChild(panel); action.focus();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, { once:true }); else show();
  }
  return Object.freeze({ blocked });
})();
