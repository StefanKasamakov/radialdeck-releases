/* What's new: every release, the versions in a sidebar and one version's notes at a time. Content:
   build/os/apps/whatsnew.html, written by build/changelog-page.py from CHANGELOG.md. */
(() => {
  const vers = c => [...c.body.querySelectorAll('.wn-ver')];
  function show(c, id) {
    const root = c.body.querySelector('.wn-app');
    if (!root) return;
    const all = vers(c), page = all.find(v => v.id === id) || all[0];
    all.forEach(v => v.classList.toggle('is-on', v === page));
    root.querySelectorAll('.wn-side a').forEach(a => {
      const on = a.getAttribute('href') === '#' + page.id;
      a.classList.toggle('is-on', on);
      if (on) { a.setAttribute('aria-current', 'page'); const s = a.parentElement; if (a.offsetTop < s.scrollTop || a.offsetTop > s.scrollTop + s.clientHeight - a.offsetHeight) s.scrollTop = a.offsetTop - s.clientHeight / 2; } else a.removeAttribute('aria-current');
    });
    root.querySelector('.fx-main').scrollTop = 0;
    c.ver = page.id;
  }
  // Newer is up the list, older is down it.
  const step = (c, d) => { const all = vers(c), i = all.findIndex(v => v.id === c.ver); show(c, all[Math.max(0, Math.min(all.length - 1, i + d))].id); };

  OS.register({
    id: 'whatsnew',
    tint: '#86efac',
    render(body, c) {
      const root = body.querySelector('.wn-app');
      if (!root) return;
      root.classList.add('is-js');
      root.querySelector('.fx-main').tabIndex = -1;
      root.querySelector('.wn-side').addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        e.preventDefault();
        show(c, a.getAttribute('href').slice(1));
      });
      show(c, c.args.hash);
    },
    onOpen(c, args) { if (args.hash) show(c, args.hash); },
    ring: c => [
      { label: 'Latest', icon: '⭐', tint: '#86efac', say: `RadialDeck ${vers(c)[0]?.id.slice(1) || ''}, the newest release.`, run: () => show(c, vers(c)[0]?.id) },
      { label: 'Next version', icon: 'fluent:E70E', tint: '#7cc4ff', say: 'The release after this one.', run: () => step(c, -1) },
      { label: 'Get the update', icon: '⬇', tint: '#4cc2ff', say: 'The Microsoft Store keeps RadialDeck up to date.', run: () => location.assign('https://radialdeck.com/store?cid=site') },
      { label: 'Previous version', icon: 'fluent:E70D', tint: '#7cc4ff', say: 'The release before this one.', run: () => step(c, 1) },
      { label: 'Copy link', icon: '🔗', tint: '#6ee7a0', say: 'Copies a link to these release notes.', run: () => OS.share('changelog.html#' + c.ver, `RadialDeck ${c.ver.slice(1)}`) },
    ],
  });
})();
