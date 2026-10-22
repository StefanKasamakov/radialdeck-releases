/* Rings: rings other people use, each ready to open in RadialDeck (radialdeck://import/..., lands unsaved in
   Settings). Content: build/os/apps/rings.html, written by build/app-pages.py. The window's ring goes to a card. */
(() => {
  const RING = [
    ['excel', 'Excel', 'img:assets/apps/excel.png'], ['outlook', 'Outlook', 'img:assets/apps/outlook.png'],
    ['explorer', 'Explorer', 'img:assets/apps/explorer.png'], ['word', 'Word', 'img:assets/apps/word.png'],
    ['autocad', 'AutoCAD', 'img:assets/apps/autocad.svg'], ['browser', 'Browser', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'],
    ['helpdesk', 'Helpdesk', 'users'],
  ];
  function show(c, slug, scroll = true) {
    const card = c.body.querySelector(`#${CSS.escape(slug.startsWith('ring-') ? slug : 'ring-' + slug)}`);
    if (!card) return;
    c.body.querySelectorAll('.rg-card.is-on').forEach(x => x.classList.remove('is-on'));
    card.classList.add('is-on');
    if (scroll) OS.reveal(card, true);
    c.card = card.id.slice(5);
  }

  OS.register({
    id: 'rings',
    tint: '#99f6e4',
    render(body, c) {
      body.querySelector('.rg-grid')?.addEventListener('click', e => { const k = e.target.closest('.rg-card'); if (k && !e.target.closest('a')) show(c, k.id, false); });
    },
    onOpen(c, args) { if (args.hash) requestAnimationFrame(() => show(c, args.hash)); },
    ring: c => [
      ...RING.map(([slug, name, icon]) => ({ label: name, icon, tint: '#99f6e4',
        say: c.body.querySelector(`#ring-${slug} .rg-meta`)?.textContent || `The ${name} ring.`, run: () => show(c, slug) })),
      { label: 'Copy link', icon: '🔗', tint: '#6ee7a0', say: c.card ? `Copies a link to the ${c.card} ring.` : 'Copies a link to this page.',
        run: () => OS.share('rings.html' + (c.card ? '#ring-' + c.card : ''), 'Shared RadialDeck rings') },
    ],
  });
})();
