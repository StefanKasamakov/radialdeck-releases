/* Help: the questions from the landing page, grouped, with a search box that filters them as you type.
   Content: build/os/apps/help.html (inline in index.html, where Google reads it as the FAQ). */
(() => {
  function filter(c, q) {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    c.body.querySelectorAll('.hp-group').forEach(g => {
      let n = 0;
      g.querySelectorAll('details').forEach(d => {
        const hit = words.every(w => d.textContent.toLowerCase().includes(w));
        d.hidden = !hit; d.open = hit && words.length > 0; n += hit;
      });
      g.hidden = !n; shown += n;
    });
    c.body.querySelector('.hp-none').hidden = shown > 0;
  }
  // A group of questions: scrolled to, its first answer open.
  function show(c, id) {
    const g = c.body.querySelector('#' + CSS.escape(id));
    if (!g) return;
    const box = c.body.querySelector('.hp-search input');
    if (box.value) { box.value = ''; filter(c, ''); }
    const first = g.querySelector('details');
    if (first) first.open = true;
    OS.reveal(g);
  }
  function search(c) { const box = c.body.querySelector('.hp-search input'); box.focus(); box.select(); }

  OS.register({
    id: 'help',
    tint: '#93c5fd',
    render(body, c) {
      const wrap = body.querySelector('.hp-search');
      if (!wrap) return;
      wrap.hidden = false;
      wrap.querySelector('input').addEventListener('input', e => filter(c, e.target.value));
    },
    onOpen(c, args) { if (args.hash && args.hash !== 'faq') requestAnimationFrame(() => show(c, args.hash)); },
    ring: [
      { label: 'Search', icon: 'search', tint: '#93c5fd', say: 'Type a word; the questions filter as you go.', run: search },
      { label: 'Install help', icon: 'download', tint: '#4cc2ff', say: 'SmartScreen, admin rights, Store or installer.', run: c => show(c, 'install') },
      { label: 'Pro key help', icon: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>', tint: '#c4b5fd', say: 'Where your key is, and how to turn Pro on.', run: c => show(c, 'key') },
      { label: 'Contact', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', tint: '#5eead4', say: 'Ask a person. The answer comes by e-mail.', run: () => OS.open('contact', { params: { topic: 'support' } }) },
    ],
  });
})();
