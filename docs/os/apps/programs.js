/* Programs: every program RadialDeck has a ready-made ring for, read from for/index.html (names, icons, how many
   actions), so this window never disagrees with that page. A program opens its /for page, in the Browser window
   when there is one. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  let P = null, data = null;
  async function load() {
    if (data) return data;
    const doc = new DOMParser().parseFromString(await (await fetch('for/index.html')).text(), 'text/html');
    data = [...doc.querySelectorAll('h2')].filter(h => h.nextElementSibling?.matches('.rel-grid')).map(h => ({
      name: h.textContent.trim(),
      apps: [...h.nextElementSibling.children].map(a => {
        const img = a.querySelector('img'), mono = a.querySelector('.app-mono');
        return {
          name: [...a.querySelector('.rel-name').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(), count: a.querySelector('.rel-name + span')?.textContent.trim() || '',
          href: a.getAttribute('href') ? 'for/' + a.getAttribute('href') : null,
          icon: img ? img.getAttribute('src').replace(/^\.\.\//, '') : null, mono: mono ? [mono.textContent.trim(), mono.style.getPropertyValue('--hue') || '210'] : null,
        };
      }),
    }));
    return data;
  }
  function draw() {
    if (!P || !data) return;
    const q = P.q.trim().toLowerCase();
    let n = 0;
    P.list.innerHTML = data.map((g, gi) => {
      const apps = g.apps.filter(a => !q || a.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
      n += apps.length;
      return apps.length ? `<section data-g="${gi}"><h4>${esc(g.name)}</h4><div class="pg-grid">${apps.map(a => {
        const ic = a.icon ? `<img src="${esc(a.icon)}" alt="" width="36" height="36" loading="lazy">` : `<span class="pg-mono" style="--hue:${esc(a.mono?.[1])}">${esc(a.mono?.[0] || a.name[0])}</span>`;
        const inner = `${ic}<span><b>${esc(a.name)}</b><small>${esc(a.count)}</small></span>`;
        return a.href ? `<a class="pg-app" href="${esc(a.href)}" data-href="${esc(a.href)}">${inner}</a>` : `<div class="pg-app is-plain">${inner}</div>`;
      }).join('')}</div></section>` : '';
    }).join('') || '<p class="pg-none">No program by that name. RadialDeck works in every program anyway: the Everyday ring, and a ring you make yourself.</p>';
    P.count.textContent = `${n} ${n === 1 ? 'program' : 'programs'}`;
  }
  function jump(name) {
    if (!P) return;
    P.q = ''; P.find.value = ''; draw();
    const gi = data?.findIndex(g => g.name === name);
    const el = P.list.querySelector(`[data-g="${gi}"]`);
    if (el) OS.reveal ? OS.reveal(el) : el.scrollIntoView({ block: 'start' });
  }

  OS.register({
    id: 'programs',
    tint: '#7cc4ff',
    async render(body, c) {
      P = c; c.q = '';
      body.innerHTML = `<div class="pg"><div class="pg-top"><label class="pg-find">${OS.svg(OS.icons.search)}<input type="search" placeholder="Search programs" aria-label="Search programs" autocomplete="off"></label><span class="pg-count"></span></div>
        <p class="pg-lead">A ready-made ring for each: it appears by itself when the program is in front. Pick one to see its ring.</p><div class="pg-list"><p class="pg-none">Loading…</p></div></div>`;
      c.list = body.querySelector('.pg-list'); c.find = body.querySelector('input'); c.count = body.querySelector('.pg-count');
      c.find.addEventListener('input', () => { c.q = c.find.value; draw(); });
      // A program's page opens in the Browser window once that app exists; until then as a page.
      c.list.addEventListener('click', e => {
        const a = e.target.closest('[data-href]');
        if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (!OS.apps.has('browser')) return;
        e.preventDefault();
        OS.open('browser', { url: a.dataset.href });
      });
      try { await load(); } catch (_) { c.list.innerHTML = '<p class="pg-none">The list could not load. <a href="for/index.html">Open it as a page</a>.</p>'; return; }
      draw();
    },
    onClose() { P = null; },
    ring: [
      { label: 'Search', icon: 'search', tint: '#7cc4ff', say: 'Type a program\'s name.', run: () => P?.find.focus() },
      ...[['Excel & Word', 'file', '#4ade80'], ['Outlook', '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', '#5cb3ff'], ['Browser', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', '#5eead4'],
        ['Calls & chat', 'users', '#a5a8ff'], ['Media', 'playpause', '#6ee7a0'], ['Developer', '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>', '#c4a1ff'], ['Creative & CAD', 'palette', '#ff7aa8']]
        .map(([label, icon, tint]) => ({ label, icon, tint, say: `The ${label} programs.`, run: () => jump(label) })),
    ],
  });
})();
