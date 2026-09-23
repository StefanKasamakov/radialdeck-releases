/* RadialDeck landing: interactive ring demo, autoplaying "how it works", themes, light reveals. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';

  const { I, svg, R, RI, slicePath, sliceAt, THEMES, themeById, themeRing, buildRing, applyThemeEverywhere, DEFAULT_THEME } = window.RDRing;

  // [label, icon, result text, url to open (optional)]
  const RINGS = {
    launch: { hub: 'Launch', slices: [
      ['Google', I.google, 'Opened google.com', 'https://www.google.com'], ['YouTube', I.youtube, 'Opened YouTube', 'https://www.youtube.com'],
      ['GitHub', I.github, 'Opened GitHub', 'https://github.com'], ['Gmail', I.mail, 'Opened Gmail', 'https://mail.google.com'],
      ['Maps', I.map, 'Opened Google Maps', 'https://maps.google.com'], ['Wikipedia', I.book, 'Opened Wikipedia', 'https://en.wikipedia.org'],
      ['ChatGPT', I.chat, 'Opened ChatGPT', 'https://chatgpt.com'], ['Calculator', I.calc, 'Opened a calculator', 'https://www.google.com/search?q=calculator'] ] },
    explorer: { hub: 'Explorer', slices: [
      ['Terminal here', I.terminal, 'Windows Terminal opened in C:\\Projects\\site'], ['Extract here', I.archive, 'report.zip → report\\'], ['Convert', I.convert, 'video.mov → video.mp4 (FFmpeg)'],
      ['Copy path', I.copy, 'Full path copied'], ['Search here', I.search, 'Everything opened in this folder'], ['Git status', I.git, '2 modified, 1 untracked'],
      ['SHA-256', I.hash, 'Hash copied to clipboard'], ['Zip', I.archive, '3 files → archive.zip'] ] },
    outlook: { hub: 'Outlook', slices: [
      ['Reply', I.reply, 'Reply opened'], ['Reply all', I.replyAll, 'Reply to 4 recipients'], ['Forward', I.forward, 'Forward opened'],
      ['Template', I.template, 'Pasted your reply template'], ['Calendar', I.calendar, 'Calendar view'], ['Mark read', I.check, '3 messages marked'],
      ['New mail', I.mail, 'New message'], ['Send', I.send, 'Sent'] ] },
    admin: { hub: 'IT admin', slices: [
      ['RDP', I.monitor, 'Connecting to SRV01…'], ['Entra', I.globe, 'Entra admin center opened'], ['Flush DNS', I.wifi, '✓ Flush DNS'],
      ['Intune', I.shield, 'Intune portal opened'], ['AD users', I.users, 'Active Directory Users and Computers'], ['BitLocker', I.key, 'Recovery key lookup'],
      ['Restart svc', I.power, 'Spooler restarted'], ['Lock', I.lock, 'Workstation locked'] ] },
    nested: { hub: 'Windows', slices: [
      ['Power', I.power, '', null, { hub: 'Power', slices: [['Lock', I.lock, 'Workstation locked'], ['Sleep', I.power, 'Going to sleep…'], ['Restart', I.convert, 'Restarting'], ['Screen off', I.monitor, 'Display off']] }],
      ['Media', I.youtube, '', null, { hub: 'Media', slices: [['Play / Pause', I.youtube, 'Playback toggled'], ['Next', I.forward, 'Next track'], ['Previous', I.reply, 'Previous track'], ['Mute', I.wifi, 'Muted']] }],
      ['Servers', I.server, '', null, { hub: 'Servers', slices: [['SRV01', I.server, 'RDP to SRV01'], ['SRV02', I.server, 'RDP to SRV02'], ['DC01', I.server, 'RDP to DC01'], ['NAS', I.archive, 'Opened \\\\nas\\share']] }],
      ['Snip', I.scissors, 'Snipping tool opened'], ['Emoji', I.chat, 'Emoji panel opened'], ['Clipboard hist', I.clipboard, 'Clipboard history opened'],
      ['Portals', I.globe, '', null, { hub: 'Portals', slices: [['Entra', I.globe, 'Entra admin center'], ['Intune', I.shield, 'Intune portal'], ['Azure', I.globe, 'Azure portal'], ['Exchange', I.mail, 'Exchange admin']] }],
      ['Empty bin', I.archive, 'Recycle bin emptied'] ] },
    clip: { hub: 'Clipboard', slices: [
      ['Paste plain', I.clipboard, 'Pasted without formatting'], ['UPPER', I.caseUp, 'HELLO FROM RADIALDECK'], ['Clean URL', I.link, 'Tracking parameters removed'],
      ['JSON', I.braces, 'Pretty-printed, 14 lines'], ['Count', I.hash, '12 words, 71 characters'], ['Transliterate', I.languages, 'Zdravey → Здравей'],
      ['Ask AI', I.bot, 'Sent to your assistant'], ['New note', I.note, 'New note in Obsidian'] ] },
  };

  // Static rings in the feature section: each shows what that feature is about.
  const STATIC = {
    outlook: RINGS_STATIC('Outlook', [['Reply', 'reply'], ['Reply all', 'replyAll'], ['Forward', 'forward'], ['Template', 'template'], ['Calendar', 'calendar'], ['Mark read', 'check'], ['New mail', 'mail'], ['Send', 'send']], 0),
    clip: RINGS_STATIC('Clipboard', [['Paste plain', 'clipboard'], ['UPPER', 'caseUp'], ['Clean URL', 'link'], ['JSON', 'braces'], ['Count', 'hash'], ['Transliterate', 'languages'], ['Base64', 'lock'], ['Slug', 'link']], 2),
    explorer: RINGS_STATIC('Explorer', [['Terminal', 'terminal'], ['Extract', 'archive'], ['Convert', 'convert'], ['Copy path', 'copy'], ['Search', 'search'], ['Git status', 'git'], ['SHA-256', 'hash'], ['Zip', 'archive']], 1),
    nested: RINGS_STATIC('‹ Power', [['Lock', 'lock'], ['Sleep', 'power'], ['Restart', 'convert'], ['Screen off', 'monitor']], 1),
  };
  function RINGS_STATIC(hub, items, hot) { return { hub, hot, slices: items.map(([l, k]) => [l, I[k], '']) }; }

  // ---- Hero demo ------------------------------------------------------------------------
  const ringEl = document.getElementById('ring');
  const ringSvg = ringEl.querySelector('.ring-svg');
  const labelsEl = document.getElementById('ring-labels');
  const hubText = document.getElementById('ring-hub-text');
  const toast = document.getElementById('demo-toast');
  const hint = document.getElementById('demo-hint');
  let current = 'launch', shown = RINGS.launch, stack = [], hot = -1, toastTimer;

  function setHot(i) {
    if (i === hot) return;
    ringEl.querySelectorAll('.is-hot').forEach(e => e.classList.remove('is-hot'));
    hot = i;
    if (i >= 0) {
      ringEl.querySelector(`.slice[data-i="${i}"]`).classList.add('is-hot');
      ringEl.querySelector(`.ring-label[data-i="${i}"]`).classList.add('is-hot');
      hubText.textContent = shown.slices[i][0];
    } else {
      hubText.textContent = stack.length ? '‹ back' : shown.hub;
    }
  }
  function present(ring) {
    shown = ring; hot = -1;
    buildRing(ringSvg, labelsEl, ring);
    ring.slices.forEach((s, i) => { if (s[4]) labelsEl.querySelector(`.ring-label[data-i="${i}"]`).classList.add('has-sub'); });
    hubText.textContent = stack.length ? '‹ back' : ring.hub;
    ringEl.classList.toggle('is-nested', stack.length > 0);
    if (hasGsap && !reduced) {
      gsap.fromTo(ringSvg.querySelectorAll('.slice, .slice-pat'), { opacity: 0, transformOrigin: '160px 160px', scale: .86 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', stagger: .02 });
      gsap.fromTo(labelsEl.querySelectorAll('.ring-label'), { opacity: 0 }, { opacity: 1, duration: .4, delay: .15, stagger: .03 });
    }
  }
  function loadRing(id) {
    current = id; stack = [];
    hint.textContent = id === 'launch' ? 'This ring is real. Click a slice.' : id === 'nested' ? 'Slices with dots open a nested ring. Click the centre to go back.' : 'Hover to highlight, click to see the result.';
    present(RINGS[id]);
  }
  function fire(i) {
    const [label, , result, url, sub] = shown.slices[i];
    if (sub) { stack.push(shown); present(sub); return; }
    toast.innerHTML = `<b>${label}</b> · ${result}`;
    toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
    if (hasGsap && !reduced) {
      gsap.fromTo(ringEl.querySelector(`.slice[data-i="${i}"]`), { transformOrigin: '160px 160px', scale: 1 }, { scale: 1.06, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
    if (url) window.open(url, '_blank', 'noopener');
  }
  function back() { if (stack.length) present(stack.pop()); }
  ringEl.addEventListener('pointermove', e => { hint.classList.add('is-hidden'); setHot(sliceAt(ringEl, e.clientX, e.clientY, shown.slices.length)); });
  ringEl.addEventListener('pointerleave', () => setHot(-1));
  ringEl.addEventListener('click', e => { const i = sliceAt(ringEl, e.clientX, e.clientY, shown.slices.length); if (i >= 0) fire(i); else back(); });
  ringEl.addEventListener('keydown', e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= shown.slices.length) { setHot(k - 1); fire(k - 1); } if (e.key === 'Escape') back(); });
  document.querySelectorAll('.demo-switch button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.demo-switch button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    hint.classList.remove('is-hidden');
    loadRing(b.dataset.ring);
  }));
  loadRing('launch');

  document.querySelectorAll('.ring-static').forEach(el => {
    const ring = STATIC[el.dataset.ring]; if (!ring) return;
    buildRing(el.querySelector('.ring-svg'), el.querySelector('.ring-labels'), ring);
    el.querySelector('.ring-hub span').textContent = ring.hub;
    el.querySelector(`.slice[data-i="${ring.hot}"]`).classList.add('is-hot');
    el.querySelector(`.ring-label[data-i="${ring.hot}"]`).classList.add('is-hot');
  });

  // ---- Styles: preview ring in the section itself, dark/light switch, applies to every ring on the page -------------
  const strip = document.getElementById('theme-strip');
  const styleRing = document.getElementById('style-ring');
  const styleName = document.getElementById('style-name');
  let themeMode = 'dark', activeTheme = 'glass';
  const STYLE_RING = { hub: 'Windows', slices: [['Lock', I.lock, ''], ['Snip', I.scissors, ''], ['Terminal', I.terminal, ''], ['Servers', I.server, ''], ['Settings', I.monitor, ''], ['Media', I.youtube, ''], ['Portals', I.globe, ''], ['Power', I.power, '']] };
  if (styleRing) {
    buildRing(styleRing.querySelector('.ring-svg'), styleRing.querySelector('.ring-labels'), STYLE_RING);
    styleRing.querySelector('.ring-hub span').textContent = STYLE_RING.hub;
    styleRing.querySelector('.slice[data-i="2"]').classList.add('is-hot');
    styleRing.querySelector('.ring-label[data-i="2"]').classList.add('is-hot');
    styleRing.addEventListener('pointermove', e => { const k = sliceAt(styleRing, e.clientX, e.clientY, 8); if (k < 0) return; styleRing.querySelectorAll('.is-hot').forEach(x => x.classList.remove('is-hot')); styleRing.querySelector(`.slice[data-i="${k}"]`).classList.add('is-hot'); styleRing.querySelector(`.ring-label[data-i="${k}"]`).classList.add('is-hot'); });
  }
  const GROUPS = [
    ['Clean', 'Quiet colours for every day', ['glass', 'midnight', 'nord', 'catppuccin-mocha', 'dracula', 'paper', 'mono', 'frost', 'sakura', 'sunset']],
    ['Glow', 'Neon, grids and terminals', ['neon', 'cyberpunk', 'synthwave', 'gridline', 'terminal', 'blueprint', 'gold']],
    ['Games & nostalgia', 'Pixels, gloss and CRT scanlines', ['minecraft', 'handheld', 'vault', 'inferno', 'lab', 'overworld', 'stealth', 'aero']],
  ];
  function renderStrip() {
    const card = t => `<button class="theme${t.id === activeTheme ? ' is-active' : ''}" role="listitem" data-id="${t.id}" aria-pressed="${t.id === activeTheme}"><img src="assets/themes/${t.id}-${themeMode}.png" alt="" loading="lazy" width="356" height="356"><span>${t.name}</span></button>`;
    const used = new Set(GROUPS.flatMap(g => g[2]));
    const rest = THEMES.filter(t => !used.has(t.id));
    strip.innerHTML = GROUPS.map(([name, sub, ids]) => `<div class="theme-group"><div class="theme-group-head"><b>${name}</b><span>${sub}</span></div><div class="theme-grid">${ids.map(themeById).filter(Boolean).map(card).join('')}</div></div>`).join('')
      + (rest.length ? `<div class="theme-group"><div class="theme-group-head"><b>More</b></div><div class="theme-grid">${rest.map(card).join('')}</div></div>` : '');
  }
  function pickTheme(id) {
    activeTheme = id;
    const v = themeById(id)[themeMode];
    applyThemeEverywhere(v);
    document.querySelector('.styles').classList.toggle('is-light', themeMode === 'light');
    if (styleName) styleName.textContent = themeById(id).name + ' · ' + themeMode;
    strip.querySelectorAll('.theme').forEach(x => { const on = x.dataset.id === id; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
  }
  if (strip) {
    renderStrip();
    strip.addEventListener('click', e => { const b = e.target.closest('.theme'); if (b) pickTheme(b.dataset.id); });
    document.querySelectorAll('.mode-switch button').forEach(b => b.addEventListener('click', () => {
      themeMode = b.dataset.mode;
      document.querySelectorAll('.mode-switch button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      renderStrip(); pickTheme(activeTheme);
    }));
  }

  // ---- "How it works": autoplays and loops while on screen -----------------------------
  const howRing = document.getElementById('how-ring');
  const howSvg = howRing.querySelector('.ring-svg');
  buildRing(howSvg, document.getElementById('how-labels'), RINGS.launch);
  const howCursor = document.getElementById('how-cursor');
  const howKey = document.getElementById('how-key');
  const steps = [...document.querySelectorAll('.step')];
  const showStep = k => steps.forEach((s, i) => s.classList.toggle('is-active', i === k));
  let howTl = null, howVisible = false;

  function playHow() {
    const slices = howSvg.querySelectorAll('.slice');
    const pats = howSvg.querySelectorAll('.slice-pat');
    const labels = howRing.querySelectorAll('.ring-label');
    const target = 1; // YouTube, upper right
    if (!hasGsap || reduced) { showStep(0); slices[target].classList.add('is-hot'); return; }
    howTl && howTl.kill();
    howTl = gsap.timeline({ defaults: { ease: 'expo.out' }, repeat: -1, repeatDelay: 1.2 })
      .set(howCursor, { x: 0, y: 0 }).set([slices, pats, labels], { opacity: 0 }).set([slices, pats], { transformOrigin: '160px 160px', scale: .8 })
      .call(() => { showStep(0); howKey.classList.remove('is-down'); slices[target].classList.remove('is-hot'); labels[target].classList.remove('is-hot'); })
      .call(() => howKey.classList.add('is-down'), null, '+=0.5')
      .to([slices, pats], { opacity: 1, scale: 1, duration: .45, stagger: .02 }, '<')
      .to(labels, { opacity: 1, duration: .3 }, '<0.15')
      .call(() => showStep(1), null, '+=0.6')
      .to(howCursor, { x: 92, y: -40, duration: .55, ease: 'power3.out' })
      .call(() => { slices[target].classList.add('is-hot'); labels[target].classList.add('is-hot'); }, null, '-=0.25')
      .call(() => showStep(2), null, '+=0.6')
      .call(() => howKey.classList.remove('is-down'))
      .to(slices[target], { transformOrigin: '160px 160px', scale: 1.06, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' })
      .to([slices, pats, labels], { opacity: 0, duration: .3, ease: 'power2.in' }, '+=0.7')
      .to(howCursor, { x: 0, y: 0, duration: .01 });
  }
  steps.forEach(s => s.addEventListener('click', () => { if (howTl) { howTl.restart(); const at = [0, 1.35, 2.7][+s.dataset.step]; howTl.seek(at); } }));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting && !howVisible) { howVisible = true; playHow(); }
    else if (!en.isIntersecting && howVisible) { howVisible = false; howTl && howTl.pause(); }
  }), { threshold: .35 });
  io.observe(howRing);

  // ---- Playground: hold, flick, release inside a fake app window ------------------------
  const play = document.getElementById('playground');
  if (play) {
    const stage = play.querySelector('.play-stage');
    const pring = play.querySelector('.play-ring');
    const psvg = pring.querySelector('.ring-svg');
    const plabels = pring.querySelector('.ring-labels');
    const phub = pring.querySelector('.ring-hub span');
    const out = play.querySelector('.play-output');
    const log = play.querySelector('.play-log');
    const apps = [...play.querySelectorAll('.play-app')];
    const h = t => t.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const APPS = {
      notepad: { hub: 'Notepad', title: 'Untitled - Notepad', slices: [['Paste plain', I.clipboard], ['UPPER', I.caseUp], ['Date', I.calendar], ['Signature', I.mail], ['Clean URL', I.link], ['Count', I.hash]] },
      explorer: { hub: 'Explorer', title: 'C:\\Projects\\site', slices: [['Terminal here', I.terminal], ['Extract here', I.archive], ['Copy path', I.copy], ['SHA-256', I.hash], ['Zip', I.archive], ['Git status', I.git]] },
      outlook: { hub: 'Outlook', title: 'Inbox - Outlook', slices: [['Reply', I.reply], ['Reply all', I.replyAll], ['Template', I.template], ['Calendar', I.calendar], ['Mark read', I.check], ['Forward', I.forward]] },
    };
    // What the pretend clipboard holds, and what each slice makes of it.
    const CLIP = 'The meeting moves to Thursday at 3 pm.';
    const NOTE_RESULTS = { 'Paste plain': CLIP, 'UPPER': CLIP.toUpperCase(), 'Date': new Date().toLocaleDateString(), 'Signature': 'Best regards,\nAlex', 'Clean URL': 'https://example.com/article', 'Count': `${CLIP.split(/\s+/).length} words, ${CLIP.length} characters` };
    const NOTE_DONE = { 'Paste plain': 'the copied text, without its formatting', 'UPPER': 'the copied text in capitals', 'Date': "today's date", 'Signature': 'your signature', 'Clean URL': 'the copied link without ?utm_source=… tracking', 'Count': 'counted, nothing pasted' };
    let app = 'notepad', held = false, phot = -1;
    const state = {};
    function reset(id) {
      if (id === 'notepad') state.notepad = { text: `Press and hold anywhere in this window (mouse button or finger), move toward a slice, release.\n\nOn the clipboard: "${CLIP}"` };
      if (id === 'explorer') state.explorer = { files: [['report.zip', 'zip', true], ['video.mov', 'mov'], ['notes.md', 'md'], ['index.html', 'html']], term: null, chip: null };
      if (id === 'outlook') state.outlook = { unread: true, view: 'mail', compose: null };
    }
    const FICON = { zip: I.archive, mov: I.youtube, md: I.note, html: I.globe, folder: I.template };
    function render() {
      if (app === 'notepad') { out.innerHTML = `<pre class="np">${h(state.notepad.text)}</pre>`; return; }
      if (app === 'explorer') {
        const st = state.explorer;
        out.innerHTML = `<div class="ex"><div class="ex-crumbs">This PC › C: › Projects › site</div><ul class="ex-files">${st.files.map(([n, t, sel, kids]) => `<li class="${sel ? 'is-sel' : ''}">${svg(FICON[t] || I.note)}<span>${h(n)}</span>${kids ? `<ul>${kids.map(k => `<li>${svg(I.note)}<span>${h(k)}</span></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>${st.chip ? `<div class="ex-chip">${svg(I.clipboard)}<span>${h(st.chip)}</span></div>` : ''}${st.term ? `<pre class="ex-term">${h(st.term)}<i class="caret"></i></pre>` : ''}</div>`;
        return;
      }
      const st = state.outlook;
      if (st.view === 'calendar') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        out.innerHTML = `<div class="ol"><div class="ol-head">Calendar · this week</div><div class="ol-cal">${days.map((d, k) => `<div class="ol-day"><b>${d}</b>${k === 1 ? '<i>10:00 Offer review</i>' : ''}${k === 3 ? '<i>14:00 Q4 planning</i>' : ''}</div>`).join('')}</div></div>`;
        return;
      }
      out.innerHTML = `<div class="ol"><div class="ol-list"><div class="ol-item ${st.unread ? 'is-unread' : ''}"><b>Maria Schmidt</b><span>Offer for Q4</span><small>${st.unread ? 'Unread' : 'Read'}</small></div><div class="ol-item"><b>James Carter</b><span>Server maintenance window</span><small>Read</small></div></div><div class="ol-read"><div class="ol-meta"><b>Offer for Q4</b><span>Maria Schmidt · to you, James, Daniel, Emily</span></div><p>Hi,<br>can you send me the updated offer by Friday?<br><br>Thanks,<br>Maria</p>${st.compose ? `<div class="ol-compose"><div><small>To</small><span>${h(st.compose.to)}</span></div><div><small>Subject</small><span>${h(st.compose.subject)}</span></div><pre>${h(st.compose.body)}<i class="caret"></i></pre></div>` : ''}</div></div>`;
    }
    function act(label) {
      if (app === 'notepad') { const t = state.notepad; const next = t.text + (t.text.endsWith('\n') ? '' : '\n\n') + NOTE_RESULTS[label]; const full = next.split('\n').length > 12 || out.scrollHeight > stage.clientHeight - 40; t.text = full ? NOTE_RESULTS[label] : next; return '✓ ' + label + ' · ' + NOTE_DONE[label] + (full ? ' · page cleared' : ''); }
      if (app === 'explorer') {
        const st = state.explorer;
        if (label === 'Terminal here') st.term = 'PS C:\\Projects\\site> ';
        if (label === 'Extract here') { if (!st.files.some(f => f[0] === 'report')) st.files.splice(1, 0, ['report', 'folder', false, ['summary.docx', 'numbers.xlsx', 'chart.png']]); }
        if (label === 'Copy path') st.chip = 'C:\\Projects\\site\\report.zip';
        if (label === 'SHA-256') st.chip = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        if (label === 'Zip') { if (!st.files.some(f => f[0] === 'archive.zip')) st.files.push(['archive.zip', 'zip']); }
        if (label === 'Git status') st.term = 'PS C:\\Projects\\site> git status\nOn branch main\nChanges not staged for commit:\n  modified:   index.html\n  modified:   styles.css\nUntracked files:\n  notes.md\nPS C:\\Projects\\site> ';
        return '✓ ' + label + ' · ' + { 'Terminal here': 'Windows Terminal opened in this folder', 'Extract here': 'report.zip → report\\ (3 files)', 'Copy path': 'full path on the clipboard', 'SHA-256': 'hash on the clipboard', 'Zip': 'archive.zip created next to the files', 'Git status': 'ran in the folder you are looking at' }[label];
      }
      const st = state.outlook;
      st.view = 'mail';
      if (label === 'Reply') st.compose = { to: 'Maria Schmidt', subject: 'RE: Offer for Q4', body: '' };
      if (label === 'Reply all') st.compose = { to: 'Maria Schmidt; James Carter; Daniel Novak; Emily Brooks', subject: 'RE: Offer for Q4', body: '' };
      if (label === 'Forward') st.compose = { to: '', subject: 'FW: Offer for Q4', body: '' };
      if (label === 'Template') { if (!st.compose) st.compose = { to: 'Maria Schmidt', subject: 'RE: Offer for Q4', body: '' }; st.compose.body = 'Hi Maria,\n\nthanks for your message. I will get back to you by tomorrow with the updated offer.\n\nBest regards,\nAlex'; }
      if (label === 'Calendar') st.view = 'calendar';
      if (label === 'Mark read') st.unread = false;
      return '✓ ' + label + ' · ' + { 'Reply': 'reply window opened', 'Reply all': 'reply to 4 recipients', 'Forward': 'forward window opened', 'Template': 'your template pasted into the reply', 'Calendar': 'switched to the calendar', 'Mark read': 'message marked as read' }[label];
    }
    function setApp(id) {
      app = id;
      apps.forEach(a => a.setAttribute('aria-selected', a.dataset.app === id ? 'true' : 'false'));
      play.querySelector('.play-title').textContent = APPS[id].title;
      play.querySelector('.play-window').dataset.app = id;
      reset(id); render();
      log.textContent = '';
    }
    function pSetHot(i) {
      if (i === phot) return;
      pring.querySelectorAll('.is-hot').forEach(e => e.classList.remove('is-hot'));
      phot = i;
      if (i >= 0) { pring.querySelector(`.slice[data-i="${i}"]`).classList.add('is-hot'); pring.querySelector(`.ring-label[data-i="${i}"]`).classList.add('is-hot'); }
      phub.textContent = i >= 0 ? APPS[app].slices[i][0] : APPS[app].hub;
    }
    function open(x, y) {
      held = true;
      const b = stage.getBoundingClientRect();
      const size = pring.offsetWidth;
      pring.style.left = Math.min(Math.max(x - b.left - size / 2, 0), b.width - size) + 'px';
      pring.style.top = Math.min(Math.max(y - b.top - size / 2, 0), b.height - size) + 'px';
      buildRing(psvg, plabels, APPS[app]);
      phub.textContent = APPS[app].hub;
      pring.classList.add('is-open');
      if (hasGsap && !reduced) gsap.fromTo(psvg.querySelectorAll('.slice, .slice-pat'), { opacity: 0, transformOrigin: '160px 160px', scale: .8 }, { opacity: 1, scale: 1, duration: .28, ease: 'expo.out', stagger: .01 });
    }
    function release() {
      if (!held) return;
      held = false;
      const i = phot;
      pring.classList.remove('is-open');
      if (i >= 0) { log.textContent = act(APPS[app].slices[i][0]); render(); }
      else log.textContent = 'Released in the centre: nothing happened. Flick further next time.';
      pSetHot(-1);
    }
    stage.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); stage.setPointerCapture(e.pointerId); open(e.clientX, e.clientY); });
    stage.addEventListener('pointermove', e => { if (held) pSetHot(sliceAt(pring, e.clientX, e.clientY, APPS[app].slices.length)); });
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('contextmenu', e => e.preventDefault());
    apps.forEach(a => a.addEventListener('click', () => setApp(a.dataset.app)));
    setApp('notepad');
  }


  // ---- Reveals, split headline, counters ---------------------------------------------
  document.querySelectorAll('[data-split]').forEach(h => { h.innerHTML = h.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' '); });
  if (hasGsap && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('[data-split] .w', { opacity: 0, y: 26, duration: .8, stagger: .06, ease: 'expo.out' });
    gsap.from('.hero-copy > :not(h1)', { opacity: 0, y: 18, duration: .7, stagger: .08, ease: 'power2.out', delay: .25 });
    gsap.from('.demo-stage', { opacity: 0, y: 30, scale: .96, duration: .9, ease: 'expo.out', delay: .2 });
    ScrollTrigger.batch('.reveal', { start: 'top 88%', once: true, onEnter: els => gsap.from(els, { opacity: 0, y: 24, duration: .7, stagger: .08, ease: 'power2.out', overwrite: true }) });
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: target, duration: 1.4, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); } }); } });
    });
  }
})();
