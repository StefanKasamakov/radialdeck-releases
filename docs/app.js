/* RadialDeck landing: interactive ring demo, pinned "how it works", themes, reveals. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';

  // ---- Icons (Lucide, inline) ----------------------------------------------------------
  const I = {
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
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    wifi: '<path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    key: '<path d="m21 2-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15 8m3-3 3 3-3 3-3-3"/>',
    power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  const RINGS = {
    clip: { hub: 'Clipboard', slices: [
      ['Paste plain', I.clipboard, 'Pasted without formatting'], ['UPPER', I.caseUp, 'HELLO FROM RADIALDECK'], ['Clean URL', I.link, 'Tracking parameters removed'],
      ['JSON', I.braces, 'Pretty-printed, 14 lines'], ['Count', I.hash, '12 words, 71 characters'], ['Кирилица', I.languages, 'Zdravey → Здравей'],
      ['Ask AI', I.bot, 'Sent to your assistant'], ['→ Note', I.note, 'New note in Obsidian'] ] },
    explorer: { hub: 'Explorer', slices: [
      ['Terminal here', I.terminal, 'Windows Terminal opened in C:\\Projects\\site'], ['Extract', I.archive, 'report.zip → report\\'], ['Convert', I.convert, 'video.mov → video.mp4 (FFmpeg)'],
      ['Copy path', I.copy, 'Full path copied'], ['Search here', I.search, 'Everything opened in this folder'], ['Git status', I.git, '2 modified, 1 untracked'],
      ['Hash', I.hash, 'SHA-256 copied'], ['Zip', I.archive, '3 files → archive.zip'] ] },
    outlook: { hub: 'Outlook', slices: [
      ['Reply', I.reply, 'Reply opened'], ['Reply all', I.replyAll, 'Reply to 4 recipients'], ['Forward', I.forward, 'Forward opened'],
      ['Template', I.template, 'Pasted your reply template'], ['Calendar', I.calendar, 'Calendar view'], ['Mark read', I.check, '3 messages marked'],
      ['New mail', I.mail, 'New message'], ['Send', I.send, 'Sent'] ] },
    admin: { hub: 'IT admin', slices: [
      ['RDP', I.monitor, 'Connecting to SRV01…'], ['Entra', I.globe, 'Entra admin center opened'], ['Flush DNS', I.wifi, '✓ Flush DNS'],
      ['Intune', I.shield, 'Intune portal opened'], ['AD users', I.users, 'Active Directory Users and Computers'], ['BitLocker', I.key, 'Recovery key lookup'],
      ['Restart svc', I.power, 'Spooler restarted'], ['Terminal', I.terminal, 'PowerShell as admin'] ] },
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
        return `<div class="ring-label" data-i="${i}" style="left:${x / 320 * 100}%;top:${y / 320 * 100}%">${svg(icon)}<span>${label}</span></div>`;
      }).join('');
    }
  }
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
  let current = 'clip', hot = -1, toastTimer;

  function setHot(i) {
    if (i === hot) return;
    ringEl.querySelectorAll('.is-hot').forEach(e => e.classList.remove('is-hot'));
    hot = i;
    if (i >= 0) {
      ringEl.querySelector(`.slice[data-i="${i}"]`).classList.add('is-hot');
      ringEl.querySelector(`.ring-label[data-i="${i}"]`).classList.add('is-hot');
      hubText.textContent = RINGS[current].slices[i][0];
    } else {
      hubText.textContent = RINGS[current].hub;
    }
  }
  function loadRing(id) {
    current = id; hot = -1;
    buildRing(ringSvg, labelsEl, RINGS[id]);
    hubText.textContent = RINGS[id].hub;
    if (hasGsap && !reduced) {
      gsap.fromTo(ringSvg.querySelectorAll('.slice'), { opacity: 0, transformOrigin: '160px 160px', scale: .86 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', stagger: .035 });
      gsap.fromTo(labelsEl.querySelectorAll('.ring-label'), { opacity: 0 }, { opacity: 1, duration: .4, delay: .15, stagger: .03 });
    }
  }
  function fire(i) {
    const [label, , result] = RINGS[current].slices[i];
    toast.innerHTML = `<b>${label}</b> · ${result}`;
    toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
    if (hasGsap && !reduced) {
      const p = ringEl.querySelector(`.slice[data-i="${i}"]`);
      gsap.fromTo(p, { transformOrigin: '160px 160px', scale: 1 }, { scale: 1.06, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  }
  ringEl.addEventListener('pointermove', e => { hint.classList.add('is-hidden'); setHot(sliceAt(ringEl, e.clientX, e.clientY, RINGS[current].slices.length)); });
  ringEl.addEventListener('pointerleave', () => setHot(-1));
  ringEl.addEventListener('click', e => { const i = sliceAt(ringEl, e.clientX, e.clientY, RINGS[current].slices.length); if (i >= 0) fire(i); });
  ringEl.addEventListener('keydown', e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= RINGS[current].slices.length) { setHot(k - 1); fire(k - 1); } });
  ringEl.tabIndex = 0;
  document.querySelectorAll('.demo-switch button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.demo-switch button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    hint.classList.add('is-hidden');
    loadRing(b.dataset.ring);
  }));
  loadRing('clip');

  // ---- Theme picker (mirrors the app's built-in themes) ------------------------------
  const THEMES = [
    ['Glass', '#2a2e38', '#14161e', 'rgba(255,255,255,.45)', '#60a5fa', '#2f6fe0', '#101218', '#fff'],
    ['Midnight', '#141b2e', '#0b1020', 'rgba(128,160,255,.35)', '#22d3ee', '#0891b2', '#0a0e1a', '#e6f1ff'],
    ['Neon', '#101014', '#060608', 'rgba(255,43,214,.6)', '#ff2bd6', '#8a2be2', '#050507', '#fff'],
    ['Paper', '#3b3530', '#2a2520', 'rgba(255,244,224,.4)', '#f59e0b', '#d97706', '#221e1a', '#fff7ed'],
    ['Nord', '#3b4252', '#2e3440', '#4c566a', '#88c0d0', '#5e81ac', '#242933', '#eceff4'],
    ['Catppuccin', '#313244', '#1e1e2e', '#45475a', '#cba6f7', '#b4befe', '#181825', '#cdd6f4'],
    ['Dracula', '#44475a', '#282a36', '#6272a4', '#bd93f9', '#ff79c6', '#191a21', '#f8f8f2'],
    ['Terminal', '#0a0f0a', '#050805', 'rgba(51,255,102,.6)', '#33ff66', '#119933', '#030503', '#33ff66'],
    ['Sunset', '#3a1d3b', '#211126', 'rgba(255,176,138,.4)', '#fb923c', '#e11d48', '#1a0e1f', '#fff1e6'],
    ['Mono', '#1c1c1c', '#0e0e0e', '#fff', '#fff', '#e6e6e6', '#000', '#fff'],
  ];
  const row = document.getElementById('theme-row');
  const root = document.documentElement.style;
  function applyTheme(t) {
    root.setProperty('--r-slice-top', t[1]); root.setProperty('--r-slice-bottom', t[2]); root.setProperty('--r-stroke', t[3]);
    root.setProperty('--r-hover-top', t[4]); root.setProperty('--r-hover-bottom', t[5]); root.setProperty('--r-hub', t[6]); root.setProperty('--r-label', t[7]);
    root.setProperty('--r-label-dim', t[7]);
  }
  row.innerHTML = THEMES.map((t, i) => `<button class="theme${i === 0 ? ' is-active' : ''}" role="listitem" style="--sw-slice:${t[1]};--sw-stroke:${t[3]};--sw-hover:${t[4]};--sw-hub:${t[6]}" data-i="${i}" aria-pressed="${i === 0}"><div class="theme-swatch"></div><span>${t[0]}</span><small>dark + light</small></button>`).join('');
  row.addEventListener('click', e => {
    const b = e.target.closest('.theme'); if (!b) return;
    row.querySelectorAll('.theme').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
    applyTheme(THEMES[+b.dataset.i]);
    document.getElementById('demo').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  // ---- "How it works" ring + choreography ---------------------------------------------
  const howRing = document.getElementById('how-ring');
  const howSvg = howRing.querySelector('.ring-svg');
  buildRing(howSvg, null, RINGS.clip);
  const howCursor = document.getElementById('how-cursor');
  const howKey = document.getElementById('how-key');
  const steps = [...document.querySelectorAll('.step')];
  function showStep(k) { steps.forEach((s, i) => s.classList.toggle('is-active', i === k)); }
  steps.forEach(s => s.addEventListener('click', () => { showStep(+s.dataset.step); playHow(+s.dataset.step); }));

  let howTl;
  function playHow(from = 0) {
    if (!hasGsap || reduced) { howSvg.style.opacity = 1; return; }
    howTl && howTl.kill();
    const slices = howSvg.querySelectorAll('.slice');
    const [tx, ty] = [96, -26]; // toward slice 2 (Upper)
    howTl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      .set(howCursor, { x: 0, y: 0 }).set(slices, { opacity: 0, transformOrigin: '160px 160px', scale: .8 }).set(howKey, { className: 'how-key' })
      .call(() => showStep(0))
      .to(howKey, { duration: .01, className: 'how-key is-down' }, '+=0.3')
      .to(slices, { opacity: 1, scale: 1, duration: .45, stagger: .03 }, '<')
      .call(() => showStep(1), null, '+=0.5')
      .to(howCursor, { x: tx, y: ty, duration: .5, ease: 'power3.out' })
      .call(() => { slices[2].classList.add('is-hot'); }, null, '-=0.2')
      .call(() => showStep(2), null, '+=0.5')
      .to(howKey, { duration: .01, className: 'how-key' })
      .to(slices[2], { transformOrigin: '160px 160px', scale: 1.06, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' }, '<')
      .to(howCursor, { x: 0, y: 0, duration: .6, ease: 'power2.inOut' }, '+=0.8')
      .call(() => { slices[2].classList.remove('is-hot'); showStep(0); });
    if (from) howTl.seek(from === 1 ? 1.1 : 2.3);
  }

  // ---- Motion: Lenis, GSAP reveals, split headlines, counters, magnetic, cursor glow ---
  if (!reduced && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      // Drive Lenis from GSAP's ticker and keep ScrollTrigger in sync with the smoothed scroll.
      lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -70 });
    }));
  }

  document.querySelectorAll('[data-split]').forEach(h => {
    h.innerHTML = h.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
  });

  if (hasGsap && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-split]').forEach(h => {
      gsap.from(h.querySelectorAll('.w'), { opacity: 0, y: 26, rotateX: -30, duration: .8, stagger: .05, ease: 'expo.out',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    gsap.from('.hero-copy > :not(h1)', { opacity: 0, y: 18, duration: .7, stagger: .08, ease: 'power2.out', delay: .25 });
    gsap.from('.demo-stage', { opacity: 0, y: 30, scale: .96, duration: .9, ease: 'expo.out', delay: .2 });
    gsap.to('.orb-a', { yPercent: 25, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.to('.orb-b', { yPercent: -20, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

    ScrollTrigger.batch('.reveal', { start: 'top 88%', once: true,
      onEnter: els => gsap.from(els, { opacity: 0, y: 24, duration: .7, stagger: .08, ease: 'power2.out', overwrite: true }) });

    ScrollTrigger.create({ trigger: '#how', start: 'top 60%', once: true, onEnter: () => playHow(0) });

    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => {
        const o = { v: 0 }; gsap.to(o, { v: target, duration: 1.4, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
      } });
    });

    // Magnetic buttons (pointer devices only)
    if (window.matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.magnetic').forEach(b => {
        b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .28, duration: .35, ease: 'power2.out' }); });
        b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1, .5)' }));
      });
    }
  } else {
    playHow(0);
  }

  window.addEventListener('pointermove', e => { root.setProperty('--mx', e.clientX + 'px'); root.setProperty('--my', e.clientY + 'px'); }, { passive: true });
})();
