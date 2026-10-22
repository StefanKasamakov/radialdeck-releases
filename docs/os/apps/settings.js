/* Settings: the desktop's own look. Dark or light (OS.setNight: the wallpaper by night and dark windows), the accent
   colour (--accent-ui, kept here), and the ring's theme from the app's 38 (OS.setRingTheme), which re-themes the live
   ring everywhere at once. The shell remembers mode and theme; this page remembers the accent. */
(() => {
  const html = document.documentElement, body = document.body;
  const KEY = 'rd-os:settings';
  const S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { } };
  const ACCENTS = [['#4cc2ff', 'Blue'], ['#0099bc', 'Teal'], ['#00cc6a', 'Green'], ['#ffb900', 'Gold'], ['#f7630c', 'Orange'], ['#e74856', 'Red'], ['#e3008c', 'Pink'], ['#8764b8', 'Purple'], ['#b4a0ff', 'Lavender'], ['#7a7574', 'Graphite']];
  const THEMES = window.RD_THEMES || [];
  const themeOf = id => THEMES.find(t => t.id === id) || THEMES[0];
  let C = null;

  const night = () => body.classList.contains('is-night');
  function setNight(on) { OS.setNight(on); paint(); }
  function setAccent(c) { S.accent = c; html.style.setProperty('--accent-ui', c); save(); paint(); }
  const theme = () => OS.ringTheme || { id: 'glass', variant: 'dark' };
  function setTheme(id, variant) { OS.setRingTheme(id, variant); paint(); }
  const step = (list, cur, d) => list[(list.indexOf(cur) + d + list.length) % list.length];

  // The accent as it was left on the last visit (the shell puts mode and theme back itself).
  if (S.accent) html.style.setProperty('--accent-ui', S.accent);
  addEventListener('os:ringtheme', () => paint());

  const PAGES = [['look', 'Personalization', OS.icons.palette], ['ring', 'Ring', OS.icons.ring], ['about', 'About', '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>']];
  function show(id) {
    C.page = id;
    C.root.querySelectorAll('.se-nav button').forEach(b => b.classList.toggle('is-on', b.dataset.page === id));
    C.root.querySelectorAll('.se-page').forEach(p => p.hidden = p.dataset.page !== id);
    if (id === 'ring' && !C.built) buildThemes();
    C.root.querySelector('.se-main').scrollTop = 0;
  }
  function buildThemes() {
    C.built = true;
    const grid = C.root.querySelector('.se-themes');
    grid.innerHTML = THEMES.map(t => `<button type="button" class="se-th" data-theme="${t.id}" aria-pressed="false"><span class="ring se-mini"><svg class="ring-svg" viewBox="0 0 320 320" aria-hidden="true"></svg><span class="se-hub"></span></span><span>${t.name}</span></button>`).join('');
    grid.querySelectorAll('.se-mini').forEach(el => {
      const t = themeOf(el.closest('[data-theme]').dataset.theme);
      RDRing.themeRing(el, t[theme().variant] || t.dark);
      RDRing.buildRing(el.querySelector('.ring-svg'), null, { slices: Array.from({ length: 8 }, () => ['', '']) });
      el.querySelector('.slice')?.classList.add('is-hot');
    });
    paint();
  }
  function paint() {
    if (!C) return;
    const dark = night(), accent = getComputedStyle(html).getPropertyValue('--accent-ui').trim(), t = theme();
    C.root.querySelectorAll('[data-night]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.night === '1') === dark)));
    C.root.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === t.variant)));
    C.root.querySelectorAll('[data-accent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.accent.toLowerCase() === accent.toLowerCase())));
    C.root.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === t.id)));
    C.root.querySelector('.se-prev').className = `se-prev${dark ? ' is-night' : ''}`;
    C.root.querySelector('.se-theme-name').textContent = themeOf(t.id)?.name || 'Glass';
  }

  OS.register({
    id: 'settings',
    tint: '#93c5fd',
    render(body_, c) {
      C = c;
      body_.innerHTML = `<div class="se">
        <nav class="se-nav" aria-label="Settings">
          <div class="se-me"><img src="assets/icon.png" alt="" width="40" height="40"><span><b>You</b><small>Local account</small></span></div>
          ${PAGES.map(([id, label, ic]) => `<button type="button" data-page="${id}">${OS.svg(ic)}<span>${label}</span></button>`).join('')}
        </nav>
        <div class="se-main">
          <section class="se-page" data-page="look">
            <h3>Personalization</h3>
            <div class="se-prev" aria-hidden="true"><i class="se-sky"></i><i class="se-hill"></i><i class="se-win"><i></i><i></i><i></i></i><i class="se-bar"><i></i></i></div>
            <div class="se-card"><div><b>Choose your mode</b><small>Light: the wallpaper by day and light windows. Dark: by night, dark windows. The Everyday ring's Dark/Light does the same.</small></div>
              <div class="se-seg"><button type="button" data-night="0">Light</button><button type="button" data-night="1">Dark</button></div></div>
            <div class="se-card se-col"><div><b>Accent colour</b><small>The taskbar's mark, buttons, selection</small></div>
              <div class="se-sw">${ACCENTS.map(([col, n]) => `<button type="button" data-accent="${col}" style="--c:${col}" aria-label="${n}" title="${n}"></button>`).join('')}</div></div>
          </section>
          <section class="se-page" data-page="ring" hidden>
            <h3>Ring</h3>
            <div class="se-card"><div><b>Theme: <span class="se-theme-name"></span></b><small>The same 38 themes as the app. The ring everywhere on this desktop takes it at once: hold the mouse anywhere to see it.</small></div>
              <div class="se-seg"><button type="button" data-variant="dark">Dark</button><button type="button" data-variant="light">Light</button></div></div>
            <div class="se-themes"></div>
          </section>
          <section class="se-page" data-page="about" hidden>
            <h3>About</h3>
            <div class="se-card se-col"><div><b>This desktop</b><small>radialdeck.com as a Windows desktop: every app here is pretend, and its ring does what RadialDeck's ring does in the real one. Your choices on this page stay in this browser.</small></div></div>
            <div class="se-card se-col"><div><b>RadialDeck</b><small>A radial menu for Windows 10 and 11. Free for two rings.</small></div><a class="os-btn os-btn-primary" href="https://radialdeck.com/store?cid=settings">Get it from the Microsoft Store</a></div>
          </section>
        </div>
      </div>`;
      c.root = body_.querySelector('.se');
      c.root.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.page) show(b.dataset.page);
        else if (b.dataset.night) setNight(b.dataset.night === '1');
        else if (b.dataset.variant) setTheme(theme().id, b.dataset.variant);
        else if (b.dataset.accent) setAccent(b.dataset.accent);
        else if (b.dataset.theme) setTheme(b.dataset.theme);
      });
      // The Everyday ring's Dark/Light changes the background too; this page follows it.
      c.obs = new MutationObserver(paint); c.obs.observe(body, { attributes: true, attributeFilter: ['class'] });
      show(c.args.hash === 'ring' ? 'ring' : 'look');
      paint();
    },
    onOpen(c, args) { if (args.hash) show(args.hash === 'ring' ? 'ring' : 'look'); },
    onClose(c) { c.obs?.disconnect(); C = null; },
    ring: [
      { label: 'Dark/Light', icon: 'theme', tint: '#ffd166', say: 'Switches Windows between dark and light mode.', run: () => setNight(!night()) },
      { label: 'Next theme', icon: '<path d="m9 18 6-6-6-6"/>', tint: '#7cc4ff', say: 'The ring in the next of the 38 themes.', run: () => { setTheme(step(THEMES.map(t => t.id), theme().id, 1)); OS.toast('Ring theme', themeOf(theme().id).name, 'os/icons/settings.svg'); } },
      { label: 'Accent', icon: 'palette', tint: '#ff7aa8', say: 'The next accent colour.', run: () => setAccent(step(ACCENTS.map(a => a[0]), S.accent || '#4cc2ff', 1)) },
      { label: 'Lock', icon: 'lock', tint: '#5eead4', say: 'Locks the PC on the spot.', run: () => OS.lock() },
      { label: 'Ring page', icon: 'ring', tint: '#c4a1ff', say: 'All 38 ring themes.', run: () => show('ring') },
      { label: 'Prev theme', icon: '<path d="m15 18-6-6 6-6"/>', tint: '#a5b4fc', say: 'The ring in the previous theme.', run: () => { setTheme(step(THEMES.map(t => t.id), theme().id, -1)); OS.toast('Ring theme', themeOf(theme().id).name, 'os/icons/settings.svg'); } },
      { label: 'Ring light', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', tint: '#fdba74', say: 'The ring theme in its light or dark colours.', run: () => setTheme(theme().id, theme().variant === 'light' ? 'dark' : 'light') },
    ],
  });
})();
