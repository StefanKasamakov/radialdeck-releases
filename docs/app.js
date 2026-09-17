/* RadialDeck landing: interactive ring demo, autoplaying "how it works", themes, light reveals. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';

  // ---- Icons (Lucide, inline) ----------------------------------------------------------
  const I = {
    google: '<circle cx="12" cy="12" r="10"/><path d="M12 8a4 4 0 1 0 3.5 6H12"/>',
    youtube: '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49 49 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49 49 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
    map: '<path d="M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2 6.9-3V3z"/><path d="M9.9 4v13M14.1 6v13"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    caseUp: '<path d="M4 20 10 4l6 16M6 14h8M19 8v12M16 11l3-3 3 3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    bot: '<path d="M12 8V4H8M4 8h16v12H4zM2 14h2M20 14h2M15 13v2M9 13v2"/>',
    note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    convert: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    git: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9M6 9v3a3 3 0 0 0 3 3h3"/>',
    reply: '<path d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4"/>',
    replyAll: '<path d="M7 17 2 12l5-5M12 17l-5-5 5-5M22 18v-2a4 4 0 0 0-4-4H7"/>',
    forward: '<path d="m15 17 5-5-5-5M4 18v-2a4 4 0 0 1 4-4h12"/>',
    template: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    wifi: '<path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    key: '<path d="m21 2-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15 8m3-3 3 3-3 3-3-3"/>',
    power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

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

  // ---- Ring geometry ------------------------------------------------------------------
  const R = 150, RI = 48, C = 160, GAP = 1.2;
  const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  function slicePath(i, n) {
    const sweep = 360 / n, start = -sweep / 2 + i * sweep + GAP / 2, end = start + sweep - GAP;
    const [x1, y1] = polar(R, start), [x2, y2] = polar(R, end), [x3, y3] = polar(RI, end), [x4, y4] = polar(RI, start);
    const large = sweep - GAP > 180 ? 1 : 0;
    return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${RI} ${RI} 0 ${large} 0 ${x4} ${y4} Z`;
  }
  const defs = `<defs>
    <linearGradient id="sliceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--r-slice-top)"/><stop offset="1" stop-color="var(--r-slice-bottom)"/></linearGradient>
    <linearGradient id="hoverGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--r-hover-top)"/><stop offset="1" stop-color="var(--r-hover-bottom)"/></linearGradient>
  </defs>`;
  function buildRing(svgEl, labelsEl, ring) {
    const n = ring.slices.length;
    svgEl.innerHTML = defs + ring.slices.map((_, i) => `<path class="slice" data-i="${i}" d="${slicePath(i, n)}"/>`).join('');
    if (labelsEl) {
      labelsEl.innerHTML = ring.slices.map(([label, icon], i) => {
        const [x, y] = polar((R + RI) / 2 + 2, i * 360 / n);
        const longest = Math.max(...label.split(' ').map(w => w.length));
        const size = longest > 10 ? ' is-long' : label.length > 12 ? ' is-mid' : '';
        return `<div class="ring-label${size}" data-i="${i}" style="left:${x / 320 * 100}%;top:${y / 320 * 100}%">${svg(icon)}<span>${label}</span></div>`;
      }).join('');
    }
  }

  // Static rings in the feature section: each shows what that feature is about.
  const STATIC = {
    outlook: RINGS_STATIC('Outlook', [['Reply', 'reply'], ['Reply all', 'replyAll'], ['Forward', 'forward'], ['Template', 'template'], ['Calendar', 'calendar'], ['Mark read', 'check'], ['New mail', 'mail'], ['Send', 'send']], 0),
    clip: RINGS_STATIC('Clipboard', [['Paste plain', 'clipboard'], ['UPPER', 'caseUp'], ['Clean URL', 'link'], ['JSON', 'braces'], ['Count', 'hash'], ['Transliterate', 'languages'], ['Base64', 'lock'], ['Slug', 'link']], 2),
    explorer: RINGS_STATIC('Explorer', [['Terminal', 'terminal'], ['Extract', 'archive'], ['Convert', 'convert'], ['Copy path', 'copy'], ['Search', 'search'], ['Git status', 'git'], ['SHA-256', 'hash'], ['Zip', 'archive']], 1),
    nested: RINGS_STATIC('‹ Power', [['Lock', 'lock'], ['Sleep', 'power'], ['Restart', 'convert'], ['Screen off', 'monitor']], 1),
  };
  function RINGS_STATIC(hub, items, hot) { return { hub, hot, slices: items.map(([l, k]) => [l, I[k], '']) }; }
  function sliceAt(el, clientX, clientY, n) {
    const b = el.getBoundingClientRect();
    const dx = clientX - (b.left + b.width / 2), dy = clientY - (b.top + b.height / 2);
    const dist = Math.hypot(dx, dy) / (b.width / 2) * R;
    if (dist < RI * 0.8) return -1;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90; if (deg < 0) deg += 360;
    return Math.floor(((deg + 180 / n) % 360) / (360 / n));
  }

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
      gsap.fromTo(ringSvg.querySelectorAll('.slice'), { opacity: 0, transformOrigin: '160px 160px', scale: .86 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', stagger: .035 });
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

  // ---- Theme picker: the app's built-in themes (slice top/bottom, stroke, hover top/bottom, hub, label, glow)
  const THEMES = [
    ['glass', 'Glass', '#2a2e38', '#14161e', 'rgba(255,255,255,.45)', '#60a5fa', '#2f6fe0', '#101218', '#fff', 'transparent'],
    ['midnight', 'Midnight', '#141b2e', '#0b1020', 'rgba(128,160,255,.35)', '#22d3ee', '#0891b2', '#0a0e1a', '#e6f1ff', 'rgba(34,211,238,.5)'],
    ['neon', 'Neon', '#101014', '#060608', 'rgba(255,43,214,.65)', '#ff2bd6', '#8a2be2', '#050507', '#fff', '#ff2bd6'],
    ['cyberpunk', 'Cyberpunk', '#121216', '#070709', 'rgba(252,238,10,.75)', '#fcee0a', '#e0c800', '#050505', '#0b0b0b', '#00f0ff'],
    ['minecraft', 'Minecraft', '#5a8f3a', '#3f6a2a', '#2e4d1e', '#7db84e', '#5a8f3a', '#6e4b2a', '#fff', 'transparent'],
    ['aero', 'Windows 7 Aero', '#2a6fb8', '#123e7a', 'rgba(220,238,255,.75)', '#4fa8ff', '#166acf', '#102a52', '#fff', 'rgba(144,208,255,.4)'],
    ['paper', 'Paper', '#3b3530', '#2a2520', 'rgba(255,244,224,.4)', '#f59e0b', '#d97706', '#221e1a', '#fff7ed', 'transparent'],
    ['nord', 'Nord', '#3b4252', '#2e3440', '#4c566a', '#88c0d0', '#5e81ac', '#242933', '#eceff4', 'transparent'],
    ['catppuccin-mocha', 'Catppuccin', '#313244', '#1e1e2e', '#45475a', '#cba6f7', '#b4befe', '#181825', '#cdd6f4', 'transparent'],
    ['dracula', 'Dracula', '#44475a', '#282a36', '#6272a4', '#bd93f9', '#ff79c6', '#191a21', '#f8f8f2', 'transparent'],
    ['terminal', 'Terminal', '#0a0f0a', '#050805', 'rgba(51,255,102,.6)', '#33ff66', '#119933', '#030503', '#33ff66', 'rgba(51,255,102,.5)'],
    ['sunset', 'Sunset', '#3a1d3b', '#211126', 'rgba(255,176,138,.4)', '#fb923c', '#e11d48', '#1a0e1f', '#fff1e6', 'rgba(251,146,60,.45)'],
    ['blueprint', 'Blueprint', '#163a7a', '#0f2a5c', 'rgba(191,216,255,.75)', '#ffffff', '#dce8ff', '#0b1f45', '#fff', 'transparent'],
    ['mono', 'Mono', '#1c1c1c', '#0e0e0e', '#fff', '#fff', '#e6e6e6', '#000', '#fff', 'transparent'],
  ];
  const strip = document.getElementById('theme-strip');
  const root = document.documentElement.style;
  function applyTheme(t) {
    root.setProperty('--r-slice-top', t[2]); root.setProperty('--r-slice-bottom', t[3]); root.setProperty('--r-stroke', t[4]);
    root.setProperty('--r-hover-top', t[5]); root.setProperty('--r-hover-bottom', t[6]); root.setProperty('--r-hub', t[7]);
    root.setProperty('--r-label', t[8]); root.setProperty('--r-label-dim', t[8]); root.setProperty('--r-glow', t[9]);
  }
  strip.innerHTML = THEMES.map((t, i) => `<button class="theme${i === 0 ? ' is-active' : ''}" role="listitem" data-i="${i}" aria-pressed="${i === 0}"><img src="assets/themes/${t[0]}-dark.png" alt="" loading="lazy" width="356" height="356"><span>${t[1]}</span><small>dark + light</small></button>`).join('');
  strip.addEventListener('click', e => {
    const b = e.target.closest('.theme'); if (!b) return;
    strip.querySelectorAll('.theme').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
    applyTheme(THEMES[+b.dataset.i]);
    document.getElementById('demo').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

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
    const labels = howRing.querySelectorAll('.ring-label');
    const target = 1; // YouTube, upper right
    if (!hasGsap || reduced) { showStep(0); slices[target].classList.add('is-hot'); return; }
    howTl && howTl.kill();
    howTl = gsap.timeline({ defaults: { ease: 'expo.out' }, repeat: -1, repeatDelay: 1.2 })
      .set(howCursor, { x: 0, y: 0 }).set([slices, labels], { opacity: 0 }).set(slices, { transformOrigin: '160px 160px', scale: .8 })
      .call(() => { showStep(0); howKey.classList.remove('is-down'); slices[target].classList.remove('is-hot'); labels[target].classList.remove('is-hot'); })
      .call(() => howKey.classList.add('is-down'), null, '+=0.5')
      .to(slices, { opacity: 1, scale: 1, duration: .45, stagger: .03 }, '<')
      .to(labels, { opacity: 1, duration: .3 }, '<0.15')
      .call(() => showStep(1), null, '+=0.6')
      .to(howCursor, { x: 92, y: -40, duration: .55, ease: 'power3.out' })
      .call(() => { slices[target].classList.add('is-hot'); labels[target].classList.add('is-hot'); }, null, '-=0.25')
      .call(() => showStep(2), null, '+=0.6')
      .call(() => howKey.classList.remove('is-down'))
      .to(slices[target], { transformOrigin: '160px 160px', scale: 1.06, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' })
      .to([slices, labels], { opacity: 0, duration: .3, ease: 'power2.in' }, '+=0.7')
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
    const APPS = {
      notepad: { hub: 'Notepad', slices: [['Paste plain', I.clipboard, 'Lorem ipsum, plain text.'], ['UPPER', I.caseUp, 'LOREM IPSUM DOLOR SIT AMET.'], ['Date', I.calendar, new Date().toLocaleDateString()], ['Signature', I.mail, 'Best regards,\nStefan'], ['Clean URL', I.link, 'https://example.com/article'], ['Count', I.hash, '4 words, 27 characters']] },
      explorer: { hub: 'Explorer', slices: [['Terminal here', I.terminal, '> wt.exe -d C:\\Projects\\site'], ['Extract here', I.archive, 'report.zip → report\\ (3 files)'], ['Copy path', I.copy, 'C:\\Projects\\site\\report.zip copied'], ['SHA-256', I.hash, '9f86d081…0015ad copied'], ['Zip', I.archive, 'archive.zip created'], ['Git status', I.git, 'On branch main: 2 modified']] },
      outlook: { hub: 'Outlook', slices: [['Reply', I.reply, 'Reply window opened'], ['Reply all', I.replyAll, 'Reply to 4 recipients'], ['Template', I.template, 'Hi,\n\nThanks for your message. I will get back to you by tomorrow.\n\nStefan'], ['Calendar', I.calendar, 'Calendar view'], ['Mark read', I.check, 'Marked as read'], ['Forward', I.forward, 'Forward window opened']] },
    };
    let app = 'notepad', held = false, phot = -1, origin = null;
    function setApp(id) {
      app = id;
      apps.forEach(a => a.setAttribute('aria-selected', a.dataset.app === id ? 'true' : 'false'));
      play.querySelector('.play-title').textContent = { notepad: 'Untitled - Notepad', explorer: 'C:\\Projects\\site', outlook: 'Inbox - Outlook' }[id];
      out.textContent = { notepad: 'Hold the left mouse button (or Space) anywhere in this window, flick toward a slice, release.', explorer: 'report.zip    video.mov    notes.md', outlook: 'From: Maria\nSubject: Offer for Q4\n\nHi Stefan, can you send me the updated offer by Friday?' }[id];
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
      held = true; origin = [x, y];
      const b = stage.getBoundingClientRect();
      const size = pring.offsetWidth;
      pring.style.left = Math.min(Math.max(x - b.left - size / 2, 0), b.width - size) + 'px';
      pring.style.top = Math.min(Math.max(y - b.top - size / 2, 0), b.height - size) + 'px';
      buildRing(psvg, plabels, APPS[app]);
      phub.textContent = APPS[app].hub;
      pring.classList.add('is-open');
      if (hasGsap && !reduced) gsap.fromTo(psvg.querySelectorAll('.slice'), { opacity: 0, transformOrigin: '160px 160px', scale: .8 }, { opacity: 1, scale: 1, duration: .28, ease: 'expo.out', stagger: .02 });
    }
    function release() {
      if (!held) return;
      held = false;
      const i = phot;
      pring.classList.remove('is-open');
      if (i >= 0) {
        const [label, , result] = APPS[app].slices[i];
        if (app === 'notepad') out.textContent += (out.textContent.endsWith('\n') ? '' : '\n\n') + result;
        else if (app === 'outlook' && label === 'Template') out.textContent += '\n\n' + result;
        log.textContent = '✓ ' + label + (app !== 'notepad' && !(app === 'outlook' && label === 'Template') ? ' · ' + result : '');
      } else {
        log.textContent = 'Released in the centre: nothing happened. Flick further next time.';
      }
      pSetHot(-1);
    }
    let lastPos = null;
    stage.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); stage.setPointerCapture(e.pointerId); open(e.clientX, e.clientY); });
    stage.addEventListener('pointermove', e => { lastPos = [e.clientX, e.clientY]; if (held) pSetHot(sliceAt(pring, e.clientX, e.clientY, APPS[app].slices.length)); });
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('mouseenter', () => stage.focus());
    stage.addEventListener('keydown', e => { if (e.code === 'Space' && !held && lastPos) { e.preventDefault(); open(lastPos[0], lastPos[1]); } });
    stage.addEventListener('keyup', e => { if (e.code === 'Space') { e.preventDefault(); release(); } });
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
