exec(open('tools/long-game/lg06b-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('automation.js',"function pitchReady() {", "function pitchReady(retry = false) {")
edit('automation.js',"!api.pitchStatus().pending &&", "(!api.pitchStatus().pending || retry) &&")
edit('ops.js',"(!helper.pitchReady() || pitchSelection() !== i)", "(!helper.pitchReady(!!retry) || pitchSelection() !== i)")
edit('ops.js',"""        t.version !== 1 || t.printing !== S.printing || t.imprint !== layers.identity(S) || !['manual','publisher'].includes(t.origin) ||
        typeof t.id !== 'string' || t.id !== `pitch-sale:${t.imprint}:${t.printing}:${t.recipe.id}` ||
        !Number.isFinite(t.mult) || t.mult < MK_MIN || t.mult > MK_MAX || !pitchInteger(t.pay) || !t.pay || t.pay % Economy.scale ||
        !pitchInteger(t.previous) || t.sequence !== t.previous + 1 || !pitchInteger(t.balance) ||""", "        t.printing !== S.printing || t.imprint !== layers.identity(S) ||")
edit('rewards.js',"!window.IMI.ops.progression.running() || !guard(state()) || request.action !== 'prepare')", "!window.IMI.ops.progression.running() || !guard(state()) || !object(request) || request.action !== 'prepare' ||\n        typeof request.id !== 'string' || typeof request.auto !== 'boolean' || Object.keys(request).some(k => !['action','id','auto'].includes(k)))")
