from pathlib import Path

p = Path('ops.js')
b = p.read_bytes()
s = b.decode().replace('\r\n', '\n')
def replace(a, z):
    global s
    assert s.count(a) == 1, (a, s.count(a))
    s = s.replace(a, z)
replace("${first ? ` ${challengeReward(C)}` : ''}", "${first ? C.helper ? ` ${challengeReward(C)}` : ` +${C.stars} Legacy stars and a permanent perk.` : ''}")
replace("const slots = timed && !chal('patientpress') && S.pub.tier", "const slots = timed && S.pub.tier")
replace('el.innerHTML = `<div class="o-modal-card"><h3 id="oPrT">Go to press?</h3>', 'el.innerHTML = `<div class="o-modal-card${C?.helper ? \' o-vault-gate\' : \'\'}"><h3 id="oPrT">Go to press?</h3>\n      ${C?.helper ? \'<div class="o-vault-gate-content" tabindex="0" role="region" aria-label="Printing and challenge details">\' : \'\'}')
replace('<div class="o-row"><button type="button" class="o-btn" data-cancel>Not yet</button>', '${C?.helper ? \'</div>\' : \'\'}<div class="o-row"><button type="button" class="o-btn" data-cancel>Not yet</button>')
replace("'<p class=\"o-dim\">Choose a constraint for the next run. The four new constraints require Printing 5, the completed introduction and the reward save owner (lg01a=1). Each first clear pays its listed benefit once.</p>'", "`<p class=\"o-dim\">${challengePrototype ? 'Four more constraints unlock at Printing 5 after the introduction, with reward saving enabled. First clears pay the listed benefit once.' : 'Constraints make a run harder in a literary way. Each is worth stars and a permanent perk the first time you finish it.'}</p>`")
p.write_bytes(s.replace('\n', '\r\n' if b'\r\n' in b else '\n').encode())
