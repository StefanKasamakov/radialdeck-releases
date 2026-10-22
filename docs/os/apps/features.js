/* Features: an overview page (a ring that is the menu, the demos at a glance, every program's logo with its ring on
   hover, themes, the gallery, Free and Pro) and a page per group in a sidebar like Windows Settings.
   The content is HTML in build/os/apps/features.html (inline in features.html, fetched elsewhere); the logo wall and
   the gallery bars in it are written by build/app-pages.py. The demos are the site's feature scenes (site/features.js),
   drawn with the app's own ring. Everything that moves runs only while it is on screen, and not at all with reduced
   motion. */
(() => {
  const PAGES = [
    ['gesture', 'Gesture', '👋', '#ffd166'], ['context', 'Context', '🎯', '#7cc4ff'], ['actions', 'Actions', '⚡', '#fdba74'],
    ['drop', 'Drop ring', '📄', '#ff7aa8'], ['clipboard', 'Clipboard', '📋', '#a5b4fc'], ['yours', 'Make it yours', '🎨', '#fda4af'],
    ['teams', 'Teams', '👥', '#5eead4'], ['private', 'Private', '🛡', '#6ee7a0'],
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  function show(c, id) {
    const root = c.body.querySelector('.fx-app');
    if (!root) return;
    let page = root.querySelector(`.fx-page#${CSS.escape(id || 'overview')}`) || root.querySelector(`#${CSS.escape(id || '')}`)?.closest('.fx-page');
    page ||= root.querySelector('.fx-page');
    root.querySelectorAll('.fx-page').forEach(p => p.classList.toggle('is-on', p === page));
    root.querySelectorAll('.fx-side a').forEach(a => {
      const on = a.getAttribute('href') === '#' + page.id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    root.querySelector('.fx-main').scrollTop = 0;
    const part = id && root.querySelector(`#${CSS.escape(id)}`);   // a section inside a page (features.html#bubbles)
    if (part && part !== page) requestAnimationFrame(() => OS.reveal(part));
    c.page = page.id;
  }

  // "Nested rings as bubbles" (the Overview's bubbles slot, features.html#bubbles): a live ring in the demo box, with
  // the desktop's ring theme. Apps opens the real apps, Music drives the Music app, Text works on the line under the
  // ring (Case holds a second layer).
  function bubbles(c, body) {
    const box = body.querySelector('.fx-bub-demo');
    if (!box || box.dataset.live || !window.RingLive) return;
    box.dataset.live = '1';
    const out = box.querySelector('.fx-bub-out'), I = OS.icons, ic = (n, d) => I[n] || d;
    const el = Object.assign(document.createElement('div'), { className: 'ring os-ring', tabIndex: 0 });
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'A ring with nested rings as bubbles');
    box.append(el);
    let line = 'please send the offer before friday', ran = 0;
    const say = (t, s) => { out.innerHTML = ''; out.append(Object.assign(document.createElement('b'), { textContent: t }), s ? ' ' + s : ''); };
    const text = (label, fn) => ({ label, icon: { UPPER: 'fluent:E8C8', lower: 'fluent:E8C8', 'Title Case': 'fluent:E8A5' }[label] || 'fluent:E8A5', say: `"${fn(line)}"`, run: () => { line = fn(line); say(label + ':', `"${line}"`); } });
    const title = t => t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
    const app = id => { const a = OS.apps.get(id); return a && { label: a.title, icon: 'img:' + a.icon, say: `Opens ${a.title} on this desktop.`, run: () => OS.open(id) }; };
    const music = () => { const r = OS.apps.get('music')?.ring; return Array.isArray(r) ? [0, 5, 1, 2, 4, 3].map(i => r[i]) : []; };
    const S = (label, icon, say, run, more) => ({ label, icon, say, run, ...more });
    const SLICES = [
      S('Apps', 'fluent:E71D', 'Point at it: the apps come out as bubbles.', null, { tint: '#7cc4ff', children: () => ['outlook', 'excel', 'word', 'explorer', 'teams', 'terminal', 'code', 'photo'].map(app).filter(Boolean) }),
      S('Music', '🎵', 'Point at it: Play/Pause, Next, Volume and Mute.', null, { tint: '#6ee7a0', children: music }),
      S('Text', '🔤', `Point at it, then at Case: a second layer. Works on "${line}".`, null, { tint: '#c4a1ff', children: () => [
        { label: 'Case', icon: 'fluent:E8D2', tint: '#ffd166', say: 'A bubble with a ring of its own.', children: () => [text('UPPER', t => t.toUpperCase()), text('lower', t => t.toLowerCase()), text('Title Case', title)] },
        text('Trim spaces', t => t.replace(/\s+/g, ' ').trim()),
        { label: 'Start over', icon: 'fluent:E777', tint: '#5eead4', say: 'Back to the first line.', run: () => { line = 'please send the offer before friday'; say('Start over:', `"${line}"`); } },
      ] }),
      S('Files', 'fluent:E8B7', 'Opens File Explorer.', () => OS.open('explorer')),
      S('Lock', '🔒', 'Locks this desktop.', () => OS.lock()),
      S('Dark/Light', '🌗', 'Switches the windows between dark and light.', () => OS.setNight()),
      S('Themes', '🎨', 'Opens Themes: the bubbles take the ring theme you pick.', () => OS.open('themes')),
      S('Settings', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 'Opens Settings.', () => OS.open('settings')),
    ];
    const anchor = box.querySelector('.fx-bub-anchor');
    const ring = RingLive.create(el, {
      home: () => anchor, icons: I,
      origin: () => { const r = box.getBoundingClientRect(); return { x: r.left, y: r.top }; },
      room: () => box.getBoundingClientRect(),
      onHot: s => { if (s && performance.now() - ran > 1600) say(s.label + '.', s.say || ''); },   // a result stays a moment
      onFire: s => { ran = performance.now(); try { s.run?.(); } catch (err) { console.error(err); } },
    });
    const dress = () => { const t = OS.ringTheme, th = RDRing.themeById(t.id); if (th) { RDRing.themeRing(el, th[t.variant]); el.classList.toggle('is-themed', t.id !== 'glass' || t.variant !== 'dark'); } };
    dress(); addEventListener('os:ringtheme', dress);
    c.offs.push(() => removeEventListener('os:ringtheme', dress));
    ring.set(SLICES, { title: 'Bubbles', sub: 'Point at Apps' });
    ring.open();
    // Mouse: hover lights, a click runs (the ring's own click). Touch: press, slide, lift.
    let touch = false;
    box.addEventListener('pointermove', e => ring.pointer(e.clientX, e.clientY));
    box.addEventListener('pointerdown', e => { touch = e.pointerType !== 'mouse'; if (touch) { box.setPointerCapture(e.pointerId); ring.pointer(e.clientX, e.clientY); } });
    box.addEventListener('pointerup', e => { if (touch && ring.tap(e.clientX, e.clientY, 'release') !== 'stay') ring.leave(); });
    box.addEventListener('pointercancel', () => ring.leave());
    box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ring.leave(); });
    box.addEventListener('click', e => { if (touch) e.stopPropagation(); }, true);   // a touch was already handled on lift
  }

  // One observer for everything that plays: a callback per element, told when it comes and goes.
  function watcher() {
    const fns = new Map();
    const io = new IntersectionObserver(es => es.forEach(e => fns.get(e.target)?.(e.isIntersecting)), { threshold: .2 });
    return (el, fn) => { fns.set(el, fn); io.observe(el); };
  }

  const theme = () => { const t = OS.ringTheme || {}; const th = RDRing.themeById(t.id || 'glass'); return th[t.variant === 'light' ? 'light' : 'dark'] || th.dark; };

  // ---- The hero: a ring whose slices are the feature groups ----
  function hero(c, root, watch) {
    const fig = root.querySelector('.fx-hero-ring');
    if (!fig) return;
    const ringEl = fig.querySelector('.ring'), svgEl = ringEl.querySelector('.ring-svg'), say = fig.querySelector('.fx-hero-say');
    const sub = id => root.querySelector(`#${id} .fx-sub`)?.textContent.trim() || '';
    const n = PAGES.length, hint = say.textContent;
    let hot = -1, turn = 0, idle = null, hovering = false;
    function build() {
      RDRing.themeRing(ringEl, theme());
      RDRing.buildRing(svgEl, ringEl.querySelector('.ring-labels'), { slices: PAGES.map(([, label, icon]) => [label, OS.icons[icon] || icon]) });
      // The light is one path that turns from slice to slice (a transform, so it glides).
      svgEl.insertAdjacentHTML('beforeend', `<path class="fx-hot ring-glide" d="${RDRing.slicePath(0, n)}"/>`);
      RDRing.paint(ringEl);   // the app's soft light, in the theme's colours
      if (hot >= 0) { const i = hot; hot = -1; light(i); }
    }
    function light(i) {
      if (i === hot) return;
      if (i >= 0) {
        let d = (i - (hot < 0 ? Math.round(turn / (360 / n)) : hot)) % n;
        if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        turn += d * 360 / n;
        svgEl.querySelector('.fx-hot').style.transform = `rotate(${turn}deg)`;
      }
      hot = i;
      ringEl.classList.toggle('has-hot', i >= 0);
      ringEl.querySelectorAll('.ring-label').forEach(l => l.classList.toggle('is-hot', +l.dataset.i === i));
      ringEl.querySelector('.ring-hub span').textContent = i >= 0 ? PAGES[i][1] : 'Features';
      say.textContent = i >= 0 ? sub(PAGES[i][0]) : hint;
    }
    build();
    addEventListener('os:ringtheme', build);
    c.offs.push(() => removeEventListener('os:ringtheme', build));
    const stage = fig.querySelector('.fx-demo');
    stage.addEventListener('pointermove', e => { hovering = true; light(RDRing.sliceAt(ringEl, e.clientX, e.clientY, n)); });
    stage.addEventListener('pointerleave', () => { hovering = false; light(-1); });
    stage.addEventListener('click', e => { const i = RDRing.sliceAt(ringEl, e.clientX, e.clientY, n); if (i >= 0) show(c, PAGES[i][0]); });
    if (reduced) return;
    // Left alone, the light walks round the ring so the slices read as a menu.
    let k = 0;
    watch(fig, on => {
      clearInterval(idle); idle = null;
      if (on) idle = setInterval(() => { if (!hovering) light(k++ % n); }, 1700);
    });
    c.offs.push(() => clearInterval(idle));
  }

  // ---- Clips: load when first seen, play while seen ----
  function clips(root, watch) {
    root.querySelectorAll('video.fx-clip[data-src]').forEach(v => {
      if (reduced) v.controls = true;
      watch(v, on => {
        if (on && !v.src) { v.src = v.dataset.src; v.preload = 'auto'; }
        if (on && !reduced) v.play().catch(() => { v.controls = true; });
        if (!on) v.pause();
      });
    });
  }

  // ---- The logo wall: hover a program to see its ring ----
  function wall(root) {
    const box = root.querySelector('.fx-wall'), peek = root.querySelector('.fx-peek');
    if (!box) return;
    const logos = box.querySelectorAll('.fx-logo');
    // A long wall waits behind a button.
    if (logos.length > 24) {
      box.classList.add('is-short');
      const more = document.createElement('button');
      more.type = 'button'; more.className = 'os-btn fx-more'; more.textContent = `Show all ${logos.length} programs`;
      more.addEventListener('click', () => { box.classList.remove('is-short'); more.remove(); });
      box.after(more);
    }
    if (!peek || !canHover) return;
    const band = box.closest('.fx-band'), ringEl = peek.querySelector('.ring'), hubImg = peek.querySelector('.ring-hub img');
    const [nameEl, countEl] = peek.querySelectorAll('p b, p span');
    let hideT = 0, cur = null;
    function open(a) {
      clearTimeout(hideT);
      if (a === cur) return;
      cur = a;
      const labels = (a.dataset.ring || '').split('|').filter(Boolean);
      if (!labels.length) return close();
      RDRing.themeRing(ringEl, theme());
      RDRing.buildRing(ringEl.querySelector('.ring-svg'), ringEl.querySelector('.ring-labels'), { slices: labels.map(l => [l, '']) });
      hubImg.src = a.querySelector('img').src; hubImg.hidden = false;
      nameEl.textContent = a.querySelector('span').textContent;
      countEl.textContent = `${a.dataset.n} ready-made ${+a.dataset.n === 1 ? 'action' : 'actions'}`;
      const b = band.getBoundingClientRect(), r = a.getBoundingClientRect(), w = peek.offsetWidth, h = peek.offsetHeight;
      const x = Math.max(0, Math.min(b.width - w, r.left - b.left + r.width / 2 - w / 2));
      // Above the logo while that stays inside the window's scroll area, else below it.
      const room = r.top - h - 10 >= band.closest('.fx-main').getBoundingClientRect().top;
      peek.style.transform = `translate(${x}px, ${room ? r.top - b.top - h - 10 : r.bottom - b.top + 10}px)`;
      peek.classList.add('is-on');
    }
    function close() { cur = null; peek.classList.remove('is-on'); }
    box.addEventListener('pointerover', e => { const a = e.target.closest('.fx-logo'); if (a) open(a); });
    box.addEventListener('pointerleave', () => { hideT = setTimeout(close, 120); });
    box.addEventListener('focusin', e => { const a = e.target.closest('.fx-logo'); if (a) open(a); });
    box.addEventListener('focusout', () => { hideT = setTimeout(close, 120); });
  }

  // ---- 38 themes, each a small ring; picking one dresses the desktop's ring ----
  function themes(root, watch) {
    const strip = root.querySelector('.fx-themes');
    if (!strip) return;
    const mark = () => strip.querySelectorAll('.fx-theme').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === (OS.ringTheme?.id || 'glass')));
    watch(strip, on => {
      if (!on || strip.childElementCount) return;
      strip.innerHTML = RDRing.THEMES.map(t => `<button type="button" class="fx-theme" role="listitem" data-id="${t.id}"><span class="ring"><svg class="ring-svg" viewBox="0 0 320 320" aria-hidden="true"></svg></span><span class="fx-theme-name">${t.name}</span></button>`).join('');
      strip.querySelectorAll('.fx-theme').forEach((b, i) => {
        const t = RDRing.THEMES[i], ringEl = b.querySelector('.ring');
        RDRing.themeRing(ringEl, t.dark);
        RDRing.buildRing(ringEl.querySelector('.ring-svg'), null, { slices: Array(8).fill(['', '']) });
        ringEl.querySelector('.slice').classList.add('is-hot');
        b.style.setProperty('--d', `${Math.min(i, 14) * 30}ms`);
      });
      mark();
      strip.classList.add('is-in');
    });
    strip.addEventListener('click', e => {
      const b = e.target.closest('.fx-theme');
      if (!b) return;
      OS.setRingTheme(b.dataset.id);
      mark();
      OS.toast('Ring theme', `${b.querySelector('.fx-theme-name').textContent}. Hold the mouse anywhere to see it.`);
    });
  }

  OS.register({
    id: 'features',
    tint: '#7cc4ff',
    async render(body, c) {
      const root = body.querySelector('.fx-app');
      if (!root) return;
      c.offs = [];
      root.classList.add('is-js');
      const main = root.querySelector('.fx-main');
      main.tabIndex = -1;
      root.querySelectorAll('.fx-side a[data-icon]').forEach(a => a.insertAdjacentHTML('afterbegin', OS.svg(OS.icons[a.dataset.icon] || '')));
      // The sidebar, and links in the pages to another page (#drop), switch pages.
      root.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        const id = a?.getAttribute('href').slice(1);
        if (!id || !root.querySelector(`.fx-page#${CSS.escape(id)}`)) return;
        e.preventDefault();
        show(c, id);
        main.focus({ preventScroll: true });
      });
      show(c, c.args.hash);
      bubbles(c, body);
      await OS.load('features.js');
      window.RDScenes?.mount(body);
      const watch = watcher();
      hero(c, root, watch);
      clips(root, watch);
      wall(root);
      themes(root, watch);
      // The bands with a CSS loop (the app rings) play only while on screen.
      root.querySelectorAll('.fx-band').forEach(b => watch(b, on => b.classList.toggle('is-live', on)));
    },
    onOpen(c, args) { if (args.hash) show(c, args.hash); },
    onClose(c) { c.offs?.forEach(f => f()); c.body.querySelectorAll('video.fx-clip').forEach(v => v.pause()); },
    // The window's ring jumps between the groups.
    ring: c => PAGES.map(([id, label, icon, tint]) => ({ label, icon, tint, say: c.body.querySelector(`#${id} .fx-sub`)?.textContent || '', run: () => show(c, id) })),
  });
})();
