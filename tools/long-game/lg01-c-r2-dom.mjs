// Measured DOM evidence, evaluated in the task-owned T3 preview.
export function measure() {
  const rect = e => e?.getBoundingClientRect().toJSON();
  const phone = innerWidth <= 720;
  const button = document.querySelector(phone ? '.o-goals-phone' : '.o-goals-desktop button');
  const floor = document.getElementById('o-floor');
  const host = document.getElementById('oGoals');
  return {
    url:location.href, edition:document.documentElement.dataset.style,
    viewport:[innerWidth,innerHeight], document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
    host:rect(host), hidden:host?.hidden, button:rect(button), description:button?.getAttribute('aria-description'),
    lines:[...document.querySelectorAll(phone ? '.o-goals-phone .o-goal-line' : '.o-goals-desktop .o-goal-line')].map(e => ({
      text:e.textContent,rect:rect(e),font:getComputedStyle(e).font,progress:rect(e.lastElementChild),progressText:e.lastElementChild?.textContent,
      progressFits:!e.lastElementChild || e.lastElementChild.scrollWidth <= e.lastElementChild.clientWidth,
      action:rect(e.firstElementChild)
    })),
    nextDesk:rect(document.getElementById('oDesks')),
    floor:{rect:rect(floor),overflow:getComputedStyle(floor).overflow,scrollHeight:floor.scrollHeight,clientHeight:floor.clientHeight,scrollTop:floor.scrollTop},
    targets:[...document.querySelectorAll(phone ? '.o-goals-phone' : '.o-goals-desktop button')].map(rect),
    awards:{cards:document.querySelectorAll('.o-award').length,rewards:document.querySelectorAll('.o-award .o-reward-line').length,
      fullRows:[...document.querySelectorAll('.o-goal-full button,.o-reward-inventory button')].map(e=>({rect:rect(e),text:e.textContent,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth})),
      incomeLines:[...document.querySelectorAll('.o-award .o-reward-line')].filter(e=>e.textContent.includes('+1% income')).length},
    goals:window.IMI.ops.extensions.state().rewards.goals,
    ownedDesks:window.IMI.ops.extensions.state().desks.filter(d=>d.owned).length,
    activeGold:window.IMI.ops.extensions.state().rewards.activeGold,
    nativeRush:window.IMI.ops.extensions.nativeRush?.(),held:window.Rewards.held?.(),
    focus:window.IMI.ops.extensions.state().focus,activeElement:document.activeElement?.id,
    rail:{open:document.getElementById('rail').classList.contains('open'),rect:rect(document.getElementById('rail'))},
    modal:rect(document.querySelector('.o-modal-card')),status:rect(document.querySelector('.o-writer-status'))
  };
}
