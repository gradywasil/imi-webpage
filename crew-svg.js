/* CREW SVG (classic edition): the same thirty looks as crew-art.js, as a soft vector monkey.
   CrewSvg.svg(look, hat) returns a 64x64 SVG string with the feet at (32, 56), so it shares the pixel monkey's anchor on the keyboard.
   Fur and skin come from crew-art.js (CrewArt.getVariant); each look's outfit, headgear and prop are drawn here.
   Expressions are CSS: the hopper's data-expr="screech" opens the mouth, data-expr="wink" closes an eye (ops.css). A worn award hat (2-8) replaces the headgear. */
(() => {
  const O = '#3d2410', W = 1.6;                                     // the classic edition's warm outline
  const cache = {};
  const st = (fill, extra = '') => `fill="${fill}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round" ${extra}`;
  const ln = (col, w = 2) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

  /* ---- every look: top (body), sleeves, bottom (legs), shoes, head (headgear), eyes, prop, and extras drawn behind (back) ---- */
  const L = {
    v01: { top: ['tank', '#c91c1c', '#ffffff'], bottom: '#c91c1c', shorts: 1, shoes: '#c91c1c', head: ['band', '#c91c1c', 1], hands: '#ffffff' },
    v02: { top: ['bare'], bottom: '#cba115', shorts: 1, shoes: '#eef2f6', head: [], towel: '#d0d8e0', hands: '#ffffff', brow: 1 },
    v03: { top: ['singlet', '#205cb0', '#ffffff'], bottom: '#205cb0', shorts: 1, shoes: '#f4f6f8', head: ['band', '#205cb0'], hands: '#ffffff' },
    v04: { top: ['hoodie', '#642c8c', '#8c46bf'], sleeves: '#642c8c', bottom: '#1a1a20', shoes: '#1a1a20', head: ['snapback', '#126464', '#702e96'], eyes: 'wink' },
    v05: { top: ['jersey', '#e8b010', '#181c22'], bottom: '#181c22', shorts: 1, shoes: '#181c22', head: ['cyclecap', '#202630', '#e43232'], eyes: 'goggles', eyeC: '#ff9a1a', prop: ['bottle'] },
    v06: { top: ['bare'], belt: ['#dfae28', '#d41c2c'], bottom: '#167c94', shoes: '#dfae28', head: ['lucha', '#167c94', '#dfae28'], hands: '#dfae28' },
    v07: { top: ['overalls', '#c4b797', '#284568'], sleeves: '#c4b797', bottom: '#284568', shoes: '#442716', head: [], brow: 1 },
    v08: { top: ['apron', '#282c36', '#542e18'], sleeves: '#282c36', bottom: '#3a3530', shoes: '#22140c', head: ['band', '#6b3f24'], prop: ['tongs'], soot: 1 },
    v09: { top: ['suspenders', '#383e4c', '#a83a2a'], sleeves: '#383e4c', bottom: '#5a5e66', shoes: '#22252a', head: ['hardhat', '#f4b410', '#fffde0'], back: ['pickaxe'], soot: 1 },
    v10: { top: ['plaid', '#9e1a1a', '#1c2838'], sleeves: '#9e1a1a', bottom: '#9e8054', shoes: '#7c5428', head: ['pencil'], prop: ['ruler'] },
    v11: { top: ['apron', '#3a3a40', '#4a5436'], sleeves: '#3a3a40', bottom: '#2c4466', shoes: '#462812', head: ['goggleup', '#2a323c', '#165c26'], hands: '#704424', prop: ['torch'] },
    v12: { top: ['vest', '#f0ece2', '#223a58'], sleeves: '#f0ece2', bottom: '#1a2a40', shoes: '#22161a', head: ['engineer', '#1a2a40', '#f4f6fa'], scarf: '#b81c1c', prop: ['watch'] },
    v13: { top: ['vest', '#f4f6f4', '#4b6136', '#871632'], sleeves: '#f4f6f4', bottom: '#16191d', shoes: '#5a3a1e', head: ['temples', '#c8d0d8'], eyes: 'monocle', stache: 1, prop: ['magnifier'] },
    v14: { top: ['jacket', '#62381e', '#f8f2e4', '#87162e'], sleeves: '#62381e', bottom: '#b6a47e', shoes: '#3e2212', head: ['tufts', '#d8d8d0'], eyes: 'specs', stache: 1, prop: ['book', '#2e5a8a'] },
    v15: { top: ['apron', '#e8e0d0', '#1e3250'], sleeves: '#e8e0d0', bottom: '#2a2a34', shoes: '#141418', head: [], eyes: 'loupe', prop: ['tweezers'] },
    v16: { top: ['jacket', '#a8946c', '#d6c6a4'], sleeves: '#a8946c', bottom: '#a8946c', shorts: 1, shoes: '#5a3a1e', head: ['pith', '#b6a47e', '#52341c'], strap: '#52341c', prop: ['compass'] },
    v17: { top: ['robe', '#181a22', '#ffffff'], sleeves: '#181a22', bottom: '#181a22', robe: 1, shoes: '#0c0d12', head: ['wig', '#d8e2ec'], prop: ['gavel'] },
    v18: { top: ['trench', '#a88e6a', '#f0ece2', '#18181c'], sleeves: '#a88e6a', bottom: '#5c4832', shoes: '#3e2a1a', head: ['fedora', '#886d4e', '#18181c'], prop: ['notebook'] },
    v19: { top: ['bare'], belt: ['#5a3a1e', '#b8b8c4'], bottom: '#284568', shoes: null, head: ['bandana', '#c74609'], prop: ['wrench'], grease: 1 },
    v20: { top: ['bomber', '#472917', '#ded4b6'], sleeves: '#472917', bottom: '#a8946c', shoes: '#2a170d', head: ['aviator', '#472917', '#80c8e8'], scarf: '#ffffff' },
    v21: { top: ['divesuit', '#3e5056', '#966616'], sleeves: '#3e5056', bottom: '#3e5056', shoes: '#2a2a30', head: ['dive', '#966616', '#40a0d0'] },
    v22: { top: ['vest', '#e8e0d0', '#543422', '#9a5a2a'], sleeves: '#e8e0d0', bottom: '#3a3a44', shoes: '#22140c', head: ['cogtop', '#543422', '#dfae28'], eyes: 'amber' },
    v23: { top: ['shirt', '#4a5236', '#363c2c'], sleeves: '#4a5236', bottom: '#4a5236', shoes: '#16161a', head: ['phones', '#3a422e', '#7a8694'], back: ['antenna'] },
    v24: { top: ['robe', '#4c2270', '#ffd034'], sleeves: '#4c2270', bottom: '#4c2270', robe: 1, shoes: '#28123c', head: ['cowl', '#4c2270'], prop: ['tube', '#12c468'] },
    v25: { top: ['stripes', '#ffffff', '#162c4a'], sleeves: '#ffffff', bottom: '#162b48', shorts: 1, shoes: null, head: ['tuft'], scarf: '#db2323', eyes: 'sparkle', ink: 1 },
    v26: { top: ['coat', '#1c2a4a', '#a81424', '#e2b428'], sleeves: '#1c2a4a', bottom: '#24242c', shoes: '#14141a', head: ['tricorn', '#1c2028', '#e2b428'], eyes: 'patch', prop: ['cutlass'] },
    v27: { top: ['chef', '#ffffff', '#121418'], sleeves: '#ffffff', bottom: '#30323a', check: 1, shoes: '#121418', head: ['toque', '#ffffff'], scarf: '#d82424', prop: ['spoon'], hands: '#fff6ea' },
    v28: { top: ['tux', '#12141a', '#ffffff', '#c81628'], sleeves: '#12141a', bottom: '#12141a', shoes: '#0c0c10', head: ['tophat', '#181c24', '#c81628'], back: ['cape', '#c81628'], hands: '#ffffff', eyes: 'wink', prop: ['wand'] },
    v29: { top: ['gi', '#1a1f26', '#2c3440'], sleeves: '#1a1f26', bottom: '#1a1f26', shoes: '#101318', head: ['ninja', '#1a1f26', '#646c78'], back: ['swords'] },
    v30: { top: ['cowvest', '#4c6a8e', '#f0ece2', '#542e16'], sleeves: '#4c6a8e', bottom: '#2c4a78', shoes: '#6a4020', head: ['stetson', '#a68052', '#3c2212'], scarf: '#c81c1c', star: 1 },
  };

  /* ---- body parts ---- */
  const tail = f => `<path d="M38 47 C50 48 54 37 48 33 C44 31 42 36 46 37" ${ln(O, 4.6)}/><path d="M38 47 C50 48 54 37 48 33 C44 31 42 36 46 37" ${ln(f.base, 2.6)}/>`;
  function legs(s, f) {
    const pant = s.bottom || f.base, sh = s.shorts ? 50 : 54, out = [];
    if (s.robe) out.push(`<path d="M23 44 L41 44 L43 54 L21 54 Z" ${st(pant)}/>`);
    else for (const x of [27.5, 36.5]) {
      out.push(`<rect x="${x - 3}" y="44" width="6" height="11" rx="3" ${st(f.base)}/>`);
      out.push(`<rect x="${x - 3.3}" y="44" width="6.6" height="${sh - 44}" rx="2.4" ${st(pant)}/>`);
      if (s.check) out.push(`<path d="M${x - 2} 47h4M${x - 2} 50h4M${x - 1} 45.5v7M${x + 1} 45.5v7" ${ln('#ffffff', .9)} opacity=".7"/>`);
    }
    for (const x of [26.5, 37.5]) out.push(s.shoes ? `<ellipse cx="${x}" cy="55" rx="4.6" ry="2.6" ${st(s.shoes)}/><path d="M${x - 2.6} 54h3" ${ln('#ffffff', 1)} opacity=".45"/>` : `<ellipse cx="${x}" cy="55" rx="4" ry="2.3" ${st(s.ink ? '#2a2026' : f.skin)}/>`);
    return out.join('');
  }
  function body(s, f, k) {
    const [kind, a, b, c] = s.top, out = [];
    const torso = col => `<path d="M23 38 C23 33 41 33 41 38 L42 46 C42 50 22 50 22 46 Z" ${st(col)}/>`;
    if (kind === 'bare') { out.push(torso(f.base), `<ellipse cx="32" cy="43" rx="6" ry="5" fill="${k.base}"/>`); }
    else if (kind === 'robe') out.push(`<path d="M22 37 C23 32 41 32 42 37 L44 52 L20 52 Z" ${st(a)}/>`, `<path d="M29 34 L32 40 L35 34 Z" ${st(b)}/>`, a === '#4c2270' ? `<path d="M26 46h3M35 46h3M27 49l2-1M36 49l2-1" ${ln(b, 1.2)}/>` : '');
    else if (kind === 'trench' || kind === 'coat' || kind === 'chef' || kind === 'tux') {
      out.push(`<path d="M22 37 C23 32 41 32 42 37 L43 50 L21 50 Z" ${st(a)}/>`);
      if (kind === 'trench') out.push(`<path d="M29 34 L32 42 L35 34" ${st(b)}/>`, `<path d="M22 44h20" ${ln(c, 2)}/>`, `<path d="M29 34 L26 42 M35 34 L38 42" ${ln(O, 1)}/>`);
      if (kind === 'coat') out.push(`<path d="M29 34 L32 41 L35 34 Z" fill="#f0ece2"/>`, `<path d="M22 43 L42 41" ${ln(b, 3.4)}/>`, `<path d="M24 38v8M40 38v8" ${ln(c, 1.2)}/>`);
      if (kind === 'chef') out.push(`<circle cx="29" cy="39" r=".9" fill="${b}"/><circle cx="35" cy="39" r=".9" fill="${b}"/><circle cx="29" cy="43" r=".9" fill="${b}"/><circle cx="35" cy="43" r=".9" fill="${b}"/>`);
      if (kind === 'tux') out.push(`<path d="M29 34 L32 44 L35 34 Z" fill="${b}"/>`, `<path d="M30 35 L32 36 L34 35 L34 37 L32 36 L30 37 Z" fill="${c}"/>`);
    } else {
      const col = { tank: a, singlet: a, hoodie: a, jersey: a, overalls: a, apron: a, suspenders: a, plaid: a, vest: a, jacket: a, bomber: a, divesuit: a, shirt: a, stripes: a, gi: a, cowvest: a }[kind] || a;
      out.push(torso(col));
      if (kind === 'tank') out.push(`<path d="M29 35 L29 48 M35 35 L35 48" ${ln(b, 1.6)}/>`);
      if (kind === 'singlet') out.push(`<path d="M24 46 L40 36" ${ln(b, 2.6)}/>`);
      if (kind === 'hoodie') out.push(`<path d="M27 44 h10 v3 h-10 Z" fill="${b}"/>`, `<path d="M30 35 v4 M34 35 v4" ${ln('#ffffff', .9)}/>`);
      if (kind === 'jersey') out.push(`<path d="M22.5 41 h19" ${ln(b, 1.6)}/>`, `<path d="M30 34 L32 37 L34 34" ${ln(b, 1.2)}/>`);
      if (kind === 'overalls') out.push(`<path d="M25 41 h14 v8 h-14 Z" ${st(b)}/>`, `<path d="M26 41 L25 34 M38 41 L39 34" ${ln(b, 2.2)}/>`, `<circle cx="26" cy="41.5" r=".9" fill="#dfae28"/><circle cx="38" cy="41.5" r=".9" fill="#dfae28"/>`);
      if (kind === 'apron') out.push(`<path d="M26 36 h12 L39 50 h-14 Z" ${st(b)}/>`, `<path d="M26 36 L24 33 M38 36 L40 33" ${ln(b, 1.4)}/>`);
      if (kind === 'suspenders') out.push(`<path d="M26 35 L27 48 M38 35 L37 48" ${ln(b, 2)}/>`);
      if (kind === 'plaid') out.push(`<path d="M23 39h18M23 43h19M23 47h18M27 35v14M32 34v15M37 35v14" ${ln(b, 1.2)} opacity=".75"/>`);
      if (kind === 'vest') out.push(`<path d="M24 36 L30 36 L32 47 L23 47 Z M40 36 L34 36 L32 47 L41 47 Z" ${st(b)}/>`, c ? `<path d="M32 36 L31 43 L32 45 L33 43 Z" fill="${c}"/>` : '', `<circle cx="27" cy="42" r=".7" fill="#dfae28"/><circle cx="37" cy="42" r=".7" fill="#dfae28"/>`);
      if (kind === 'jacket') out.push(`<path d="M29 34 L32 42 L35 34 Z" fill="${b}"/>`, c ? `<path d="M30 35.5 L32 36.5 L34 35.5 L34 37.5 L32 36.5 L30 37.5 Z" fill="${c}"/>` : '', `<path d="M24 40h3v3h-3Z M37 40h3v3h-3Z" ${ln(O, .8)}/>`);
      if (kind === 'bomber') out.push(`<path d="M25 34 C28 38 36 38 39 34 L39 36 C36 40 28 40 25 36 Z" fill="${b}" stroke="${O}" stroke-width="1"/>`, `<path d="M32 38 v10" ${ln(O, .9)}/>`);
      if (kind === 'divesuit') out.push(`<path d="M24 35 C26 40 38 40 40 35 L40 37 C38 43 26 43 24 37 Z" ${st(b)}/>`, `<circle cx="27" cy="38" r=".8" fill="#fed266"/><circle cx="37" cy="38" r=".8" fill="#fed266"/>`);
      if (kind === 'shirt') out.push(`<path d="M24 36 L40 47 M40 36 L24 47" ${ln(b, 2)}/>`);
      if (kind === 'stripes') out.push(`<path d="M23 39h18M22.5 42.5h19M22.5 46h19" ${ln(b, 1.6)}/>`);
      if (kind === 'gi') out.push(`<path d="M28 34 L32 40 L36 34" ${ln(b, 1.4)}/>`, `<path d="M23 45h18" ${ln(b, 2.2)}/>`);
      if (kind === 'cowvest') out.push(`<path d="M24 36 L30 36 L32 48 L23 48 Z M40 36 L34 36 L32 48 L41 48 Z" ${st(b)}/>`, `<path d="M25.5 39 q1.6 -1 2.6 .6 q-.4 1.8 -2.4 1.2 Z M37 43 q1.8 -.6 2 1.2 q-1.2 1.4 -2.4 .2 Z M27 45 q1 -1 2 0 q-.4 1.2 -1.6 .9 Z" fill="${c}"/>`);
    }
    if (s.belt) out.push(`<path d="M22.5 45 h19" ${ln(s.belt[0], 3.2)}/>`, `<rect x="29.5" y="43.3" width="5" height="3.4" rx="1" ${st(s.belt[1] || s.belt[0])}/>`);
    if (s.towel) out.push(`<path d="M23 36 C26 32 38 32 41 36 L39 40 C36 37 28 37 25 40 Z" ${st(s.towel)}/>`);
    if (s.scarf) out.push(`<path d="M26 34.5 C29 37 35 37 38 34.5" ${ln(O, 4.2)}/><path d="M26 34.5 C29 37 35 37 38 34.5" ${ln(s.scarf, 2.6)}/><path d="M33 36 L35 40 L32 39 Z" ${st(s.scarf)}/>`);
    if (s.strap) out.push(`<path d="M24 35 L40 47" ${ln(s.strap, 1.8)}/><circle cx="39" cy="46" r="2.2" ${st('#7a8694')}/>`);
    if (s.star) out.push(`<path d="M27 40 l.8 1.7 1.8.2 -1.3 1.2 .4 1.8 -1.7 -.9 -1.6.9 .3 -1.8 -1.3 -1.2 1.8 -.2 Z" fill="#ffd23a" stroke="${O}" stroke-width=".6"/>`);
    if (s.grease) out.push(`<path d="M27 41 q2 1 1 3" ${ln('#120c14', 1.4)} opacity=".6"/>`);
    return out.join('');
  }
  function arms(s, f, k) {
    const sl = s.sleeves || f.base, hand = s.hands || k.base, out = [];
    for (const [x0, x1] of [[24, 20.5], [40, 43.5]]) out.push(`<path d="M${x0} 37 L${x1} 46" ${ln(O, 6.2)}/><path d="M${x0} 37 L${x1} 46" ${ln(sl, 4.4)}/><circle cx="${x1}" cy="46.6" r="2.7" ${st(hand)}/>`);
    return out.join('');
  }
  function face(s, f, k, hat) {
    const h = s.head[0], hide = !hat && (h === 'dive' || h === 'ninja'), out = [];
    out.push(`<circle cx="19.5" cy="23" r="4.6" ${st(f.base)}/><circle cx="19.5" cy="23" r="2.5" fill="${k.base}"/><circle cx="44.5" cy="23" r="4.6" ${st(f.base)}/><circle cx="44.5" cy="23" r="2.5" fill="${k.base}"/>`);
    out.push(`<circle cx="32" cy="22" r="12" ${st(f.base)}/><path d="M24 15 C27 11 37 11 40 15" ${ln(f.light, 1.6)} opacity=".6"/>`);
    if (hide) return out.join('');
    out.push(`<path d="M32 21.5 C30 18 24 18.5 24.5 23.5 C24.8 27 26.5 30.5 32 31 C37.5 30.5 39.2 27 39.5 23.5 C40 18.5 34 18 32 21.5 Z" fill="${k.base}"/>`);
    if (s.soot) out.push(`<circle cx="26.5" cy="27" r="1.5" fill="#1e1a1a" opacity=".35"/><circle cx="37" cy="19" r="1.2" fill="#1e1a1a" opacity=".3"/>`);
    if (s.ink) out.push(`<circle cx="32.5" cy="26.4" r="1.4" fill="#0c060a" opacity=".55"/>`);
    const brow = s.brow ? `<path d="M25.5 19.5 L30 20.6 M38.5 19.5 L34 20.6" ${ln(O, 1.6)}/>` : '';
    const eyesOpen = `<g class="cs-eyes"><ellipse cx="28.5" cy="23" rx="2.3" ry="2.7" fill="#fff" stroke="${O}" stroke-width=".9"/><ellipse cx="35.5" cy="23" rx="2.3" ry="2.7" fill="#fff" stroke="${O}" stroke-width=".9"/><circle cx="29" cy="23.6" r="1.35" fill="${O}"/><circle cx="35" cy="23.6" r="1.35" fill="${O}"/><circle cx="29.5" cy="22.9" r=".45" fill="#fff"/><circle cx="35.5" cy="22.9" r=".45" fill="#fff"/></g>`;
    const eyesWink = `<g class="cs-wink"><ellipse cx="28.5" cy="23" rx="2.3" ry="2.7" fill="#fff" stroke="${O}" stroke-width=".9"/><circle cx="29" cy="23.6" r="1.35" fill="${O}"/><path d="M33.4 23.4 q2.1 -1.6 4.2 0" ${ln(O, 1.2)}/></g>`;
    out.push(eyesOpen, eyesWink, brow);
    out.push(`<circle cx="31" cy="26.3" r=".7" fill="${O}"/><circle cx="33" cy="26.3" r=".7" fill="${O}"/>`);
    out.push(`<path class="cs-smile" d="M29 28.2 q3 2.4 6 0" ${ln(O, 1.2)}/><g class="cs-open"><ellipse cx="32" cy="29" rx="2.6" ry="2.1" fill="#5a1a1a" stroke="${O}" stroke-width=".9"/><ellipse cx="32" cy="30" rx="1.4" ry=".8" fill="#ff8aa0"/></g>`);
    if (s.stache) out.push(`<path d="M28.4 27.6 q1.8 -1.4 3.6 0 q1.8 -1.4 3.6 0" ${ln('#e8e8e0', 1.4)}/>`);
    const e = s.eyes;
    if (e === 'goggles') out.push(`<path d="M24 22 h16" ${ln('#222', 1.4)}/><circle cx="28.5" cy="22.8" r="3" fill="${s.eyeC}" fill-opacity=".55" stroke="#222" stroke-width="1.2"/><circle cx="35.5" cy="22.8" r="3" fill="${s.eyeC}" fill-opacity=".55" stroke="#222" stroke-width="1.2"/>`);
    if (e === 'monocle') out.push(`<circle cx="35.5" cy="23" r="3.2" fill="#cfe8f8" fill-opacity=".3" stroke="#dfae28" stroke-width="1.1"/><path d="M38.5 24 q2 4 0 8" ${ln('#dfae28', .7)}/>`);
    if (e === 'specs') out.push(`<circle cx="28.5" cy="23" r="3.1" fill="none" stroke="${O}" stroke-width="1"/><circle cx="35.5" cy="23" r="3.1" fill="none" stroke="${O}" stroke-width="1"/><path d="M31.6 23 h.8" ${ln(O, 1)}/>`);
    if (e === 'loupe') out.push(`<path d="M35.5 23 L42 18" ${ln('#cc9a18', 1.2)}/><circle cx="35.5" cy="23" r="3.6" fill="#98d8f8" fill-opacity=".45" stroke="#cc9a18" stroke-width="1.6"/>`);
    if (e === 'amber') out.push(`<circle cx="35.5" cy="23" r="3.3" fill="#ff941a" fill-opacity=".6" stroke="#dfae28" stroke-width="1.3"/><path d="M38.8 23 h4" ${ln('#dfae28', 1)}/>`);
    if (e === 'patch') out.push(`<path d="M22 18 L40 25" ${ln(O, 1)}/><ellipse cx="28.5" cy="23" rx="3" ry="3.2" fill="#0e0e12"/>`);
    if (e === 'sparkle') out.push(`<circle cx="28" cy="22" r=".7" fill="#fff"/><circle cx="35" cy="22" r=".7" fill="#fff"/>`);
    return out.join('');
  }
  /* headgear, drawn over the head; returns [behind-head, over-head] */
  function headgear(s, f) {
    const [kind, a, b] = s.head;
    switch (kind) {
      case 'band': return ['', `<path d="M20.5 16.5 C26 13 38 13 43.5 16.5" ${ln(O, 4.4)}/><path d="M20.5 16.5 C26 13 38 13 43.5 16.5" ${ln(a, 2.8)}/>${b ? `<path d="M44 16 l5 -1 -1 3 M44 17 l4 3" ${ln(a, 1.8)}/>` : ''}`];
      case 'snapback': return ['', `<path d="M21 17 C22 7 42 7 43 17 Z" ${st(a)}/><path d="M18 16 C20 13 25 13 27 15 L27 17 L18 18 Z" ${st(b)}/>`];
      case 'cyclecap': return ['', `<path d="M22 16 C23 9 41 9 42 16 Z" ${st(a)}/><path d="M28 10 v6 M32 9.6 v6.4 M36 10 v6" ${ln(b, 1.2)}/><path d="M40 15 L47 14 L46 16.5 L40 17 Z" ${st(a)}/>`];
      case 'lucha': return ['', `<path d="M20.5 22 C20 9 44 9 43.5 22 C42 25 39 27 32 27 C25 27 22 25 20.5 22 Z" ${st(a)} opacity=".95"/><path d="M25 21 l2 -3 2 3 -2 3 Z M35 21 l2 -3 2 3 -2 3 Z" fill="#fff" stroke="${b}" stroke-width="1"/><path d="M32 11 v5" ${ln(b, 1.6)}/>`];
      case 'hardhat': return ['', `<path d="M20 17 C20 6 44 6 44 17 Z" ${st(a)}/><path d="M17 17.5 h30" ${ln(O, 3)}/><path d="M17 17.5 h30" ${ln(a, 1.6)}/><circle cx="32" cy="12" r="2.6" ${st('#dfae28')}/><circle cx="32" cy="12" r="1.3" fill="${b}"/>`];
      case 'pencil': return ['', `<path d="M42 17 L48 11" ${ln(O, 3)}/><path d="M42 17 L48 11" ${ln('#ffd23a', 1.8)}/><path d="M48 11 l1 -1" ${ln('#f08aa4', 2)}/>`];
      case 'goggleup': return ['', `<path d="M21 15 C26 12 38 12 43 15" ${ln(a, 2)}/><circle cx="28" cy="13.5" r="3" ${st(b)}/><circle cx="36" cy="13.5" r="3" ${st(b)}/><circle cx="27.3" cy="12.8" r=".8" fill="#9fe8ff"/>`];
      case 'engineer': return ['', `<path d="M21.5 16 C22 8 42 8 42.5 16 Z" ${st(a)}/><path d="M26 9.6 v6.4 M30 8.8 v7.2 M34 8.8 v7.2 M38 9.6 v6.4" ${ln(b, 1)}/><path d="M22 16 L30 17.5 L22 18.5 Z" ${st(a)}/>`];
      case 'temples': return ['', `<path d="M20 18 q-1 6 2 9 M44 18 q1 6 -2 9" ${ln(a, 2.6)}/>`];
      case 'tufts': return ['', `<path d="M22 14 l-3 -3 4 1 M42 14 l3 -3 -4 1 M30 10.5 l2 -4 2 4" ${ln(a, 2)}/>`];
      case 'pith': return ['', `<path d="M21 16 C21 5 43 5 43 16 Z" ${st(a)}/><path d="M16 17 C24 14 40 14 48 17 C40 19.5 24 19.5 16 17 Z" ${st(a)}/><path d="M21.5 14.5 h21" ${ln(b, 1.6)}/>`];
      case 'wig': return [`<path d="M18 18 C16 30 18 36 22 38 M46 18 C48 30 46 36 42 38" ${ln(O, 6.8)}/><path d="M18 18 C16 30 18 36 22 38 M46 18 C48 30 46 36 42 38" ${ln(a, 5)}/>`, `<path d="M20 18 C19 7 45 7 44 18 C40 15 24 15 20 18 Z" ${st(a)}/><path d="M23 13 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0" ${ln('#b0bcc8', .9)}/>`];
      case 'fedora': return ['', `<path d="M22 15 C22 7 42 7 42 15 Z" ${st(a)}/><path d="M16 15.5 C24 13 40 13 48 15.5 C40 18 24 18 16 15.5 Z" ${st(a)}/><path d="M22.5 13.4 h19" ${ln(b, 1.8)}/><rect x="35" y="9.5" width="4.5" height="3.2" fill="#fff" stroke="${O}" stroke-width=".6"/>`];
      case 'bandana': return ['', `<path d="M20.5 18 C20 8 44 8 43.5 18 C38 15 26 15 20.5 18 Z" ${st(a)}/><circle cx="27" cy="13" r=".8" fill="#fff"/><circle cx="35" cy="12" r=".8" fill="#fff"/><path d="M43 17 l5 2 -4 2 Z" ${st(a)}/>`];
      case 'aviator': return ['', `<path d="M20 22 C19 7 45 7 44 22 L42 23 C41 13 23 13 22 23 Z" ${st(a)}/><path d="M22 15 h20" ${ln('#2a170d', 1.4)}/><circle cx="28" cy="14.5" r="2.8" ${st('#cca024')}/><circle cx="36" cy="14.5" r="2.8" ${st('#cca024')}/><circle cx="28" cy="14.5" r="1.6" fill="${b}"/><circle cx="36" cy="14.5" r="1.6" fill="${b}"/>`];
      case 'dive': return ['', `<circle cx="32" cy="22" r="14" ${st(a)}/><circle cx="32" cy="23" r="7" fill="${b}" stroke="#5a3a0c" stroke-width="2"/><path d="M27 21 q2 -2 4 -1" ${ln('#d6f0ff', 1.2)}/><circle cx="20" cy="22" r="1.2" fill="#fed266"/><circle cx="44" cy="22" r="1.2" fill="#fed266"/><circle cx="32" cy="9.5" r="1.2" fill="#fed266"/>`];
      case 'cogtop': return ['', `<path d="M17 15 h30" ${ln(O, 3.4)}/><path d="M17 15 h30" ${ln(a, 2)}/><rect x="24" y="2" width="16" height="13" rx="1.4" ${st(a)}/><circle cx="36" cy="9" r="3" fill="${b}" stroke="${O}" stroke-width=".8"/><circle cx="36" cy="9" r="1" fill="${a}"/><path d="M24 12 h16" ${ln(b, 1.4)}/>`];
      case 'phones': return ['', `<path d="M20 20 C20 6 44 6 44 20" ${ln(O, 3)}/><path d="M20 20 C20 6 44 6 44 20" ${ln(b, 1.6)}/><rect x="16" y="18" width="6" height="9" rx="2.4" ${st(a)}/><rect x="42" y="18" width="6" height="9" rx="2.4" ${st(a)}/><path d="M18 27 Q19 31 25 30.5" ${ln('#222', 1)}/><circle cx="25.5" cy="30.5" r="1.2" fill="#222"/>`];
      case 'cowl': return [`<path d="M17 24 C16 8 48 8 47 24 L45 34 L19 34 Z" ${st(a)}/>`, `<path d="M19 21 C19 5 45 5 45 21 C40 14 24 14 19 21 Z" ${st(a)}/><path d="M28 9 l1.5 2 M34 8.6 l-1 2.2" ${ln('#ffd034', 1)}/>`];
      case 'tuft': return ['', `<path d="M30 11 C29 7 33 6 32 9 C34 6 37 8 34 11" ${st(f.base)}/>`];
      case 'tricorn': return ['', `<path d="M16 16 C20 6 44 6 48 16 C42 13 22 13 16 16 Z" ${st(a)}/><path d="M16 16 C22 13 42 13 48 16" ${ln(b, 1.4)}/><circle cx="32" cy="11" r="2" fill="#fff"/><path d="M30.5 13.6 l3 -1.6 M30.5 12 l3 1.6" ${ln('#fff', .8)}/>`];
      case 'toque': return ['', `<rect x="23" y="11" width="18" height="6" rx="1" ${st(a)}/><path d="M23 12 C17 6 22 -2 27 2 C28 -3 36 -3 37 2 C42 -2 47 6 41 12 Z" ${st(a)}/><path d="M28 4 v7 M32 2 v9 M36 4 v7" ${ln('#d2dce8', 1)}/>`];
      case 'tophat': return ['', `<path d="M16 15 h32" ${ln(O, 3.4)}/><path d="M16 15 h32" ${ln(a, 2)}/><rect x="24" y="0" width="16" height="15" rx="1.4" ${st(a)}/><path d="M24 11 h16" ${ln(b, 2.4)}/>`];
      case 'ninja': return ['', `<path d="M19.5 24 C18 7 46 7 44.5 24 C44 31 40 34 32 34 C24 34 20 31 19.5 24 Z" ${st(a)}/><path d="M24 20.5 h16 v4.6 h-16 Z" fill="#c9a37a"/><ellipse cx="28.5" cy="22.8" rx="1.8" ry="1.3" fill="#fff"/><ellipse cx="35.5" cy="22.8" rx="1.8" ry="1.3" fill="#fff"/><circle cx="29" cy="22.9" r=".9" fill="${O}"/><circle cx="35" cy="22.9" r=".9" fill="${O}"/><rect x="27" y="13" width="10" height="4" rx="1" ${st(b)}/><path d="M44 18 l6 3 -5 1" ${ln(a, 2)}/>`];
      case 'stetson': return ['', `<path d="M23 15 C22 5 42 5 41 15 Z" ${st(a)}/><path d="M32 6 v7" ${ln(O, 1)}/><path d="M13 16 C18 11 22 15 32 15 C42 15 46 11 51 16 C46 20 18 20 13 16 Z" ${st(a)}/><path d="M23.4 13.2 h17.2" ${ln(b, 1.8)}/>`];
      default: return ['', ''];
    }
  }
  /* award hats (ops.js HATS ids) */
  function awardHat(id) {
    switch (id) {
      case 2: return `<path d="M17 15 h30" ${ln(O, 3.4)}/><path d="M17 15 h30" ${ln('#1a0f14', 2)}/><rect x="24" y="1" width="16" height="14" rx="1.4" ${st('#1a0f14')}/><path d="M24 11 h16" ${ln('#b8322a', 2.4)}/>`;
      case 3: return `<path d="M24 15 L32 -2 L40 15 Z" ${st('#ff5d73')}/><path d="M26.5 9.5 h11 M28.6 5 h6.8" ${ln('#ffd23a', 1.6)}/><circle cx="32" cy="-2" r="2" ${st('#ffd23a')}/>`;
      case 4: return `<ellipse cx="31" cy="12.5" rx="12" ry="5" ${st('#2e44a8')}/><path d="M31 7.5 v-2.6" ${ln('#2e44a8', 1.8)}/>`;
      case 5: return `<path d="M22 15 L22 6 L26.5 10.5 L32 4 L37.5 10.5 L42 6 L42 15 Z" ${st('#ffd23a')}/><circle cx="32" cy="12" r="1.4" fill="#b8322a"/><circle cx="26" cy="12.6" r="1" fill="#5470d8"/><circle cx="38" cy="12.6" r="1" fill="#5470d8"/>`;
      case 6: return `<path d="M21 16 C22 7 42 7 43 16 Z" ${st('#b8322a')}/><path d="M37 15 C41 13 47 14 48 16 L38 17.5 Z" ${st('#b8322a')}/>`;
      case 7: return `<g transform="translate(40 14)">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-3" rx="2.2" ry="3.2" transform="rotate(${r})" ${st('#e8323e')}/>`).join('')}<circle r="1.4" fill="#ffd23a"/></g>`;
      case 8: return `<rect x="24" y="9" width="16" height="6" ${st('#1a0f14')}/><path d="M16 9 L32 4 L48 9 L32 13 Z" ${st('#1a0f14')}/><path d="M44 9 v8" ${ln('#ffd23a', 1.2)}/><circle cx="44" cy="17.6" r="1.2" fill="#ffd23a"/>`;
      default: return '';
    }
  }
  /* things held in the right paw (at 43.5, 46.6), or worn on the back */
  function prop(s) {
    const [kind, a] = s.prop || [];
    switch (kind) {
      case 'bottle': return `<rect x="42" y="40" width="4" height="7" rx="1.2" ${st('#5fc8ff')}/><rect x="42.8" y="38.6" width="2.4" height="1.6" fill="#222"/>`;
      case 'tongs': return `<path d="M44 46 L52 38 M44 47 L53 41" ${ln('#4c5666', 1.6)}/><rect x="51" y="37" width="4" height="3" fill="#ff9a3a" stroke="${O}" stroke-width=".6"/>`;
      case 'ruler': return `<path d="M44 47 L52 36" ${ln(O, 3.4)}/><path d="M44 47 L52 36" ${ln('#fad028', 2)}/>`;
      case 'torch': return `<path d="M44 47 L50 41" ${ln('#4c5666', 2.4)}/><circle cx="51" cy="40" r="1.6" fill="#9fe8ff"/><circle cx="51" cy="40" r="3" fill="#9fe8ff" opacity=".35"/>`;
      case 'watch': return `<path d="M26 44 q3 3 6 0" ${ln('#ffd438', .9)}/><circle cx="32.5" cy="44" r="1.4" ${st('#dfae28')}/>`;
      case 'magnifier': return `<path d="M44 47 L48 42" ${ln('#5a3a1e', 2)}/><circle cx="50" cy="39.5" r="3.2" fill="#cfe8f8" fill-opacity=".6" stroke="#dfae28" stroke-width="1.4"/>`;
      case 'book': return `<rect x="41" y="42" width="7" height="8" rx=".8" ${st(a)}/><path d="M42.5 44h4M42.5 46h4" ${ln('#fff', .7)}/>`;
      case 'tweezers': return `<path d="M44 46 L50 40 M45 47 L51 41" ${ln('#c4d0dc', .9)}/>`;
      case 'compass': return `<circle cx="45" cy="45" r="3" ${st('#dfae28')}/><path d="M45 43 v4" ${ln('#b8322a', 1)}/>`;
      case 'gavel': return `<path d="M44 47 L50 41" ${ln('#7a4a1e', 1.8)}/><rect x="47.5" y="36" width="7" height="4" rx="1" transform="rotate(45 51 38)" ${st('#8a5a2b')}/>`;
      case 'notebook': return `<rect x="41" y="41" width="6" height="8" ${st('#fff6d6')}/><path d="M42.4 43.5h3M42.4 45.5h3" ${ln('#555', .6)}/>`;
      case 'wrench': return `<path d="M44 47 L51 39" ${ln('#9aa4b0', 2.2)}/><circle cx="51.6" cy="38.4" r="2.4" fill="none" stroke="#9aa4b0" stroke-width="1.8"/>`;
      case 'tube': return `<rect x="42.5" y="38" width="3.4" height="9" rx="1.6" ${st('#e8f4f8')}/><rect x="42.9" y="42" width="2.6" height="4.6" rx="1.2" fill="${a}"/><circle cx="44" cy="36" r="1" fill="${a}" opacity=".7"/>`;
      case 'cutlass': return `<path d="M44 47 C50 42 53 36 52 31" ${ln(O, 3)}/><path d="M44 47 C50 42 53 36 52 31" ${ln('#d8e0e8', 1.8)}/><path d="M42 46 l4 3" ${ln('#e2b428', 1.8)}/>`;
      case 'spoon': return `<path d="M44 47 L50 39" ${ln('#a8743c', 1.8)}/><ellipse cx="51" cy="37.5" rx="2" ry="2.8" transform="rotate(35 51 37.5)" ${st('#c08a4a')}/>`;
      case 'wand': return `<path d="M44 47 L51 40" ${ln('#12141a', 1.8)}/><path d="M50.5 40.5 L51.8 39.2" ${ln('#fff', 1.8)}/><path d="M53 35.5 l.9 1.9 2 .3 -1.5 1.4 .4 2 -1.8 -1 -1.8 1 .4 -2 -1.5 -1.4 2 -.3 Z" fill="#ffd23a" stroke="${O}" stroke-width=".6"/>`;
      default: return '';
    }
  }
  function back(s) {
    const [kind, a] = s.back || [];
    if (kind === 'pickaxe') return `<path d="M22 46 L40 30" ${ln('#7a4a1e', 2.4)}/><path d="M36 26 C41 27 44 30 45 34" ${ln('#7a889e', 2.6)}/>`;
    if (kind === 'antenna') return `<rect x="35" y="31" width="9" height="12" rx="1.6" ${st('#363c2c')}/><path d="M42 31 L46 13" ${ln('#dfae28', 1.2)}/><circle cx="46" cy="12.5" r="1.3" fill="#e83a3a"/>`;
    if (kind === 'cape') return `<path d="M23 36 C18 44 18 52 20 55 L44 55 C46 52 46 44 41 36 Z" ${st(a)}/>`;
    if (kind === 'swords') return `<path d="M20 32 L44 52 M44 32 L20 52" ${ln('#141418', 2.6)}/><path d="M20 32 l3 2.5 M44 32 l-3 2.5" ${ln('#503622', 3)}/>`;
    return '';
  }

  function svg(id, hat = 0) {
    const key = id + ':' + hat; if (cache[key]) return cache[key];
    const s = L[id] || L.v01, V = window.CrewArt && CrewArt.getVariant(id);
    const f = V ? { base: V.fur.base, light: V.fur.light, dark: V.fur.dark } : { base: '#7d4c17', light: '#b47323', dark: '#492b0c' };
    const k = V ? { base: V.skin.light, dark: V.skin.base } : { base: '#f3b281', dark: '#d08853' };
    const [hb, ho] = hat ? ['', awardHat(hat)] : headgear(s, f);
    /* layer order: back, tail, both legs, torso, both arms, held prop, then the head (headgear back, face, headgear front) on top so the face is never covered */
    const out = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${back(s)}${tail(f)}${legs(s, f)}${body(s, f, k)}${arms(s, f, k)}${prop(s)}${hb}${face(s, f, k, hat)}${ho}</svg>`;
    return (cache[key] = out);
  }
  /* the keyboard crew draws bitmaps, not live SVG: each look/hat/expression is rasterised once at the size on screen, so a hop only swaps
     a cached image and scales a canvas (re-painting eight detailed SVGs on every pose cost a quarter of the frame rate) */
  const EXPR_CSS = { '': '.cs-wink,.cs-open{display:none}', wink: '.cs-eyes,.cs-open{display:none}', screech: '.cs-wink,.cs-smile{display:none}' };
  const bm = {};
  function bitmap(id, hat, expr, px, onload) {
    expr = EXPR_CSS[expr] ? expr : ''; const key = id + ':' + hat + ':' + expr + ':' + px, rec = bm[key];
    if (rec) return rec.ready ? rec.cv : null;
    const cv = document.createElement('canvas'); cv.width = cv.height = px; const r = bm[key] = { cv, ready: false };
    const img = new Image();
    img.onload = () => { cv.getContext('2d').drawImage(img, 0, 0, px, px); r.ready = true; if (onload) onload(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, hat).replace('aria-hidden="true">', 'aria-hidden="true"><style>' + EXPR_CSS[expr] + '</style>'));
    return null;
  }
  window.CrewSvg = { svg, bitmap };
})();
