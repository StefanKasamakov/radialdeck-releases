/* Tricks: shortcuts and recipes most people don't know, each with the usual way, the one-flick way, Free or Pro,
   its reel and its blog post. The cards are real HTML from site/os/apps/tricks.json (build/site-os.py writes them
   into tricks.html); this adds the filters, the search and "Try it", which opens the matching window with its ring
   (RDGuide.tryRing in os/apps/welcome.js). */
(() => {
  const ICON = {
    everyday: 'zap', text: 'clipboard', files: 'file', excel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', cad: '<path d="M3 21h18M5 21V9l7-5 7 5v12"/>',
    windows: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
  };
  const TINT = { everyday: '#ffd166', text: '#a5b4fc', files: '#ff7aa8', excel: '#6ee7a0', mail: '#7cc4ff', cad: '#fca5a5', windows: '#5eead4' };

  function filter(c) {
    const words = c.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    c.cards.forEach(card => {
      const hit = (c.cat === 'all' || card.dataset.cat === c.cat) && words.every(w => card.textContent.toLowerCase().includes(w));
      card.hidden = !hit; shown += hit;
    });
    c.body.querySelector('.tk-none').hidden = shown > 0;
    c.body.querySelectorAll('.tk-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === c.cat)));
  }
  function setCat(c, cat) { c.cat = cat; filter(c); c.body.scrollTop = 0; }
  // A trick by id (t-<id> or <id>): every filter off, the card in view and lit for a moment.
  function show(c, id) {
    const card = id && c.body.querySelector('#' + CSS.escape(id.startsWith('t-') ? id : 't-' + id));
    if (!card) return;
    c.cat = 'all'; c.q = ''; c.body.querySelector('.tk-search input').value = ''; filter(c);
    OS.reveal(card, true);
    card.classList.remove('is-lit'); void card.offsetWidth; card.classList.add('is-lit');
  }

  OS.register({
    id: 'tricks',
    tint: '#f9a8d4',
    render(body, c) {
      const root = body.querySelector('.tk-app');
      if (!root) return;
      c.cards = [...root.querySelectorAll('.tk-card')];
      c.cat = 'all'; c.q = '';
      const tools = root.querySelector('.tk-tools');
      tools.hidden = false;
      const cats = [];
      c.cards.forEach(card => { if (!cats.some(x => x[0] === card.dataset.cat)) cats.push([card.dataset.cat, card.querySelector('.tk-cat').textContent]); });
      c.cats = cats;
      const count = id => c.cards.filter(x => x.dataset.cat === id).length;
      root.querySelector('.tk-chips').innerHTML = `<button class="tk-chip" type="button" data-cat="all">All <small>${c.cards.length}</small></button>`
        + cats.map(([id, name]) => `<button class="tk-chip" type="button" data-cat="${id}">${name} <small>${count(id)}</small></button>`).join('');
      root.querySelector('.tk-chips').addEventListener('click', e => { const b = e.target.closest('.tk-chip'); if (b) setCat(c, b.dataset.cat); });
      // A search looks through every group.
      tools.querySelector('input').addEventListener('input', e => { c.q = e.target.value; if (c.q.trim()) c.cat = 'all'; filter(c); });
      // "Try it": the window it belongs to, with its ring open on the right slice.
      c.cards.forEach(card => {
        if (!card.dataset.try) return;
        const [id, slice] = card.dataset.try.split(':'), app = OS.apps.get(id);
        // With a slice the demo window has that very action; without one it has the program's ring, not this trick.
        const text = id === 'desktop' ? 'Try it on the desktop ring' : slice ? `Try it in ${app?.title || 'its window'}` : `Open the ${app?.title || ''} ring`;
        card.querySelector('.tk-meta').insertAdjacentHTML('afterbegin', `<button class="os-btn tk-try" type="button">${OS.svg(OS.icons.ring)}${text}</button>`);
      });
      root.addEventListener('click', e => {
        const t = e.target.closest('.tk-try');
        if (t) return window.RDGuide?.tryRing(t.closest('.tk-card').dataset.try);
        // The blog opens in the desktop's Browser, like the rest of the site.
        const a = e.target.closest('a[href^="blog/"]');
        if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && OS.apps.get('browser')?.js) { e.preventDefault(); OS.open('browser', { url: a.getAttribute('href') }); }
      });
      filter(c);
    },
    onOpen(c, args) { if (args.hash && args.hash !== 'tricks') requestAnimationFrame(() => show(c, args.hash)); },
    // The window's ring picks a group.
    ring: c => (c.cats || []).slice(0, 7).map(([id, name]) => ({ label: name, icon: ICON[id] || 'zap', tint: TINT[id], say: `Only the ${name} tricks.`, run: () => setCat(c, id) }))
      .concat([{ label: 'All', icon: 'search', tint: '#f9a8d4', say: 'Every trick, filters off.', run: () => { c.q = ''; c.body.querySelector('.tk-search input').value = ''; setCat(c, 'all'); } }]),
    show,
  });
})();
