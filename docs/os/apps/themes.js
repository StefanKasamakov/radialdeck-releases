/* Themes: the 38 themes as a Settings page. A click puts one on the desktop's live ring (OS.setRingTheme, kept
   across pages); the theme studio (studio.html) opens in the same window. Content: build/os/apps/themes.html,
   its gallery written from themes.js by build/site-os.py. */
(() => {
  const ids = () => RDRing.THEMES.map(t => t.id);
  const SAMPLE = ['theme', 'snip', 'desktop', 'mute', 'lock', 'trash', 'scan', 'playpause'];
  const LABELS = ['Theme', 'Snip', 'Desktop', 'Mute', 'Lock', 'Bin', 'Text', 'Play'];

  function page(c, id) {
    const root = c.body.querySelector('.th-app');
    if (!root) return;
    const p = root.querySelector('#' + id) || root.querySelector('#gallery');
    root.querySelectorAll('.fx-page').forEach(x => x.classList.toggle('is-on', x === p));
    root.querySelectorAll('.fx-side a').forEach(a => { const on = a.getAttribute('href') === '#' + p.id; a.classList.toggle('is-on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    root.querySelector('.fx-main').scrollTop = 0;
    // The studio is a page of its own (studio.js, styles.css); it loads the first time it is asked for.
    const frame = root.querySelector('.th-frame');
    if (p.id === 'studio' && !frame.firstChild) frame.innerHTML = '<iframe src="studio.html" title="Theme studio" loading="lazy"></iframe>';
    c.page = p.id;
  }

  // What the window shows of the ring's theme: the preview, the name, the lit card, the variant.
  function paint(c) {
    const now = OS.ringTheme, t = RDRing.themeById(now.id), root = c.body.querySelector('.th-app');
    if (!root) return;
    RDRing.themeRing(root.querySelector('.th-ring'), t[now.variant]);
    root.querySelector('.th-name').textContent = `${t.name} · ${now.variant}`;
    root.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === now.variant)));
    root.querySelectorAll('.th-card').forEach(k => {
      const on = k.dataset.theme === now.id;
      k.classList.toggle('is-on', on);
      k.setAttribute('aria-pressed', String(on));
      const img = k.querySelector('img'), want = `assets/themes/${k.dataset.theme}-${now.variant}.png`;
      if (img.getAttribute('src') !== want) img.src = want;
    });
  }

  const set = (id, variant) => OS.setRingTheme(id, variant);
  const step = d => { const all = ids(), i = all.indexOf(OS.ringTheme.id); set(all[(i + d + all.length) % all.length]); };
  const random = () => { const all = ids().filter(x => x !== OS.ringTheme.id); set(all[Math.floor(Math.random() * all.length)]); };
  const flip = () => set(OS.ringTheme.id, OS.ringTheme.variant === 'dark' ? 'light' : 'dark');
  const share = () => { const t = RDRing.themeById(OS.ringTheme.id); OS.share(`themes.html#${t.id}`, `${t.name}, a RadialDeck theme`); };

  OS.register({
    id: 'themes',
    tint: '#fda4af',
    render(body, c) {
      const root = body.querySelector('.th-app');
      if (!root) return;
      root.classList.add('is-js');
      root.querySelector('.fx-main').tabIndex = -1;
      root.querySelectorAll('.fx-side a[data-icon]').forEach(a => a.insertAdjacentHTML('afterbegin', OS.svg(OS.icons[a.dataset.icon] || '')));
      root.querySelector('.fx-side').addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (a) { e.preventDefault(); page(c, a.getAttribute('href').slice(1)); }
      });
      const ring = root.querySelector('.th-ring');
      RDRing.buildRing(ring.querySelector('.ring-svg'), ring.querySelector('.ring-labels'), { slices: SAMPLE.map((k, i) => [LABELS[i], OS.icons[k]]) });
      root.querySelector('.th-now').hidden = false;
      root.addEventListener('click', e => {
        const card = e.target.closest('.th-card'), v = e.target.closest('[data-variant]'), act = e.target.closest('[data-act]')?.dataset.act;
        if (card) set(card.dataset.theme);
        if (v) set(OS.ringTheme.id, v.dataset.variant);
        if (act === 'random') random();
        if (act === 'share') share();
      });
      c.onTheme = () => paint(c);
      addEventListener('os:ringtheme', c.onTheme);
      paint(c);
      page(c, 'gallery');
    },
    onOpen(c, args) {
      const h = args.hash;
      if (h === 'studio' || h === 'gallery') page(c, h);
      else if (h && ids().includes(h)) { page(c, 'gallery'); set(h); requestAnimationFrame(() => OS.reveal(c.body.querySelector(`.th-card[data-theme="${h}"]`), true)); }
    },
    onClose(c) { removeEventListener('os:ringtheme', c.onTheme); },
    ring: [
      { label: 'Dark/Light', icon: 'theme', tint: '#ffd166', say: "Switches the theme between its dark and light variant.", run: flip },
      { label: 'Next theme', icon: '<path d="m9 18 6-6-6-6"/>', tint: '#fda4af', say: 'The next of the 38 themes, on the ring at once.', run: () => step(1) },
      { label: 'Share theme', icon: 'link', tint: '#6ee7a0', say: 'Copies a link that opens this theme.', run: share },
      { label: 'Random', icon: '<path d="M2 18h3.5c2 0 3-1 4.5-3l3-6c1-2 2.5-3 4.5-3H22M18 2l4 4-4 4M2 6h3.5c1.4 0 2.3.5 3.2 1.5M22 18h-4.5c-1.4 0-2.3-.5-3.2-1.5M18 22l4-4-4-4"/>', tint: '#ffd166', say: 'Any theme but this one.', run: random },
      { label: 'Open studio', icon: 'palette', tint: '#c4a1ff', say: 'Design your own theme on the real renderer.', run: c => page(c, 'studio') },
      { label: 'Previous theme', icon: '<path d="m15 18-6-6 6-6"/>', tint: '#fda4af', say: 'The theme before this one.', run: () => step(-1) },
    ],
  });
})();
