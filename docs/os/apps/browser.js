/* Browser: the blog and the /for program pages, the real pages (same origin) in an iframe per tab, with tabs, an
   address bar, back / forward / reload and a new-tab page (the blog and every program). Inside the frame a page
   drops its own header and footer (html.rd-embed, styles.css), links to the desktop's apps open those apps, and a
   hold on the page opens this window's ring like anywhere else on the desktop.
   OS.open('browser', { url: 'for/excel.html' }) opens a page in it. */
(() => {
  const ROOT = new URL('./', location.href).href;
  const HOME = 'blog/index.html';
  const P = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    reload: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    fwd: '<path d="m12 5 7 7-7 7M5 12h14"/>',
    private: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  };
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const style = href => document.querySelector(`link[href="${href}"]`) ? Promise.resolve() : new Promise(ok => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = ok; document.head.append(l); });
  const ICON = 'os/icons/browser.svg';

  // ---- Where a link goes: a desktop app, a page for this browser, or the wider web ----
  const rel = u => u.href.startsWith(ROOT) ? u.href.slice(ROOT.length) : null;
  function appFor(u) {
    const p = rel(u);
    if (p === null) return null;
    const path = p.split(/[?#]/)[0], hash = u.hash.slice(1), q = u.searchParams.get('app');
    if (q && OS.apps.has(q)) return { id: q, hash };
    if (/^(blog|for)\//.test(path)) return null;
    if (path === '' || path === 'index.html') return { id: OS.apps.has(hash) ? hash : [...OS.apps.values()].find(a => (a.aliases || []).includes(hash))?.id || null, hash };
    if (/^download(\.html)?$/.test(path) && OS.apps.has('download')) return { id: 'download', hash };
    const a = [...OS.apps.values()].find(a => a.id !== 'browser' && (a.url === path || a.href === path || `${a.id}.html` === path));
    return a ? { id: a.id, hash } : null;
  }
  // What someone typed: a path on radialdeck.com ("blog", "for/excel"), a full URL of it, or words to look for.
  function parse(text) {
    let t = text.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    if (/^radialdeck\.com(\/|$)/i.test(t)) t = t.replace(/^radialdeck\.com\/?/i, '');
    else if (/\s/.test(t) || !/[/.]/.test(t) && !/^(blog|for)$/i.test(t)) return { search: text.trim() };
    else if (/^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(t) && !/\.html?$/i.test(t)) return { search: text.trim(), away: true };
    if (!t || t === 'index.html') return { start: true };
    if (/^(blog|for)\/?$/i.test(t)) t = t.replace(/\/?$/, '/index.html').toLowerCase();
    else if (!/\.[a-z]+($|[?#])/i.test(t.split('/').pop())) t += '.html';
    return { path: t };
  }

  // ---- The new-tab page: every article and every program with a page, from the real index pages ----
  let catalog = null;
  function load() {
    const get = src => fetch(src).then(r => r.ok ? r.text() : '').then(t => new DOMParser().parseFromString(t, 'text/html')).catch(() => null);
    catalog ||= Promise.all([get('blog/index.html'), get('for/index.html')]).then(([b, f]) => ({
      posts: b ? [...b.querySelectorAll('.post-card')].map(a => ({ path: 'blog/' + a.getAttribute('href'), title: a.querySelector('h2')?.textContent.trim() || '', date: a.querySelector('time')?.textContent || '', desc: a.querySelector('p')?.textContent || '' })) : [],
      groups: f ? [...f.querySelectorAll('h2.h3')].map(h => ({
        name: h.textContent,
        progs: [...(h.nextElementSibling?.querySelectorAll('a[href]') || [])].map(a => {
          const img = a.querySelector('img'), mono = a.querySelector('.app-mono');
          return { path: 'for/' + a.getAttribute('href'), name: [...a.querySelector('.rel-name').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(), count: a.lastElementChild.textContent,
            icon: img ? img.getAttribute('src').replace(/^\.\.\//, '') : null, mono: mono ? [mono.textContent, mono.style.getPropertyValue('--hue')] : null };
        }),
      })).filter(g => g.progs.length) : [],
    }));
    return catalog;
  }
  function startPage(c, t) {
    const el = document.createElement('div');
    el.className = 'bs' + (t.private ? ' is-private' : '');
    el.innerHTML = `<div class="bs-in">
      ${t.private ? `<div class="bs-private">${svg(P.private)}<div><b>Private tab</b><span>Pages you open here stay out of Reopen tab. That is all a pretend browser can promise.</span></div></div>` : ''}
      <form class="bs-search" role="search">${svg(P.search)}<input type="search" placeholder="Search the blog and the programs" aria-label="Search the blog and the programs"></form>
      <h3 class="bs-h">From the blog <a href="${HOME}" data-path="${HOME}">All articles</a></h3>
      <div class="bs-posts"><p class="bs-wait">Loading…</p></div>
      <h3 class="bs-h">Programs <a href="for/index.html" data-path="for/index.html">All programs</a></h3>
      <div class="bs-progs"></div>
      <p class="bs-none" hidden>Nothing here matches. Try "excel", "paste" or "autocad".</p>
    </div>`;
    const q = el.querySelector('input'), posts = el.querySelector('.bs-posts'), progs = el.querySelector('.bs-progs');
    load().then(cat => {
      const mono = p => p.icon ? `<img src="${esc(p.icon)}" alt="" width="32" height="32" loading="lazy">` : `<span class="bs-mono" style="--hue:${esc(p.mono?.[1] || 210)}">${esc(p.mono?.[0] || p.name[0])}</span>`;
      const draw = () => {
        const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), hit = s => words.every(w => s.toLowerCase().includes(w));
        const ps = cat.posts.filter(p => hit(`${p.title} ${p.desc}`)).slice(0, words.length ? 12 : 6);
        posts.innerHTML = ps.map(p => `<a class="bs-post" href="${esc(p.path)}" data-path="${esc(p.path)}"><time>${esc(p.date)}</time><b>${esc(p.title)}</b><span>${esc(p.desc)}</span></a>`).join('');
        progs.innerHTML = cat.groups.map(g => {
          const list = g.progs.filter(p => hit(`${p.name} ${g.name}`));
          return list.length ? `<h4>${esc(g.name)}</h4><div class="bs-grid">${list.map(p => `<a class="bs-prog" href="${esc(p.path)}" data-path="${esc(p.path)}">${mono(p)}<span><b>${esc(p.name)}</b><small>${esc(p.count)}</small></span></a>`).join('')}</div>` : '';
        }).join('');
        el.querySelector('.bs-none').hidden = !!(ps.length || progs.innerHTML);
      };
      q.addEventListener('input', draw);
      t.search = v => { q.value = v; draw(); };
      draw();
      if (t.pending) { t.search(t.pending); t.pending = null; }
    });
    el.querySelector('form').addEventListener('submit', e => { e.preventDefault(); el.querySelector('[data-path]:not(.bs-h a)')?.click(); });
    el.addEventListener('click', e => {
      const a = e.target.closest('a[data-path]');
      if (!a || e.button !== 0) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) newTab(c, a.dataset.path, { background: true }); else go(c, t, a.dataset.path);
    });
    return el;
  }

  // ---- Tabs ----
  let seq = 0;
  function newTab(c, path = null, { background = false, private: priv = false } = {}) {
    const t = { id: ++seq, hist: [path], idx: 0, title: 'New tab', private: priv };
    t.view = document.createElement('div');
    t.view.className = 'br-page';
    c.view.append(t.view);
    c.tabs.splice(c.cur ? c.tabs.indexOf(c.cur) + 1 : c.tabs.length, 0, t);
    show(c, t);
    if (!background) select(c, t); else tabs(c);
    return t;
  }
  function select(c, t) {
    c.cur = t;
    c.tabs.forEach(x => x.view.classList.toggle('is-on', x === t));
    tabs(c); bar(c);
  }
  function closeTab(c, t = c.cur) {
    if (!t) return;
    if (!t.private && t.hist[t.idx] !== undefined) c.closed.push({ hist: t.hist.slice(), idx: t.idx });
    const i = c.tabs.indexOf(t);
    c.tabs.splice(i, 1);
    t.view.remove();
    if (!c.tabs.length) return c.close();
    if (c.cur === t) select(c, c.tabs[Math.min(i, c.tabs.length - 1)]); else tabs(c);
  }
  function reopen(c) {
    const last = c.closed.pop();
    if (!last) return OS.toast('Reopen tab', 'No closed tabs yet. Close one with the ring first.', ICON);
    const t = newTab(c, last.hist[last.idx]);
    t.hist = last.hist; t.idx = last.idx; bar(c);
  }
  function tabs(c) {
    c.strip.innerHTML = c.tabs.map(t => `<div class="br-tab${t === c.cur ? ' is-on' : ''}${t.private ? ' is-private' : ''}" role="tab" aria-selected="${t === c.cur}" data-id="${t.id}" title="${esc(t.title)}">`
      + (t.private ? svg(P.private) : `<img src="assets/icon.png" alt="" width="16" height="16">`)
      + `<span>${esc(t.title)}</span>${t.loading ? '<i class="br-spin" aria-hidden="true"></i>' : ''}<button type="button" class="br-x" aria-label="Close tab">${svg(P.close)}</button></div>`).join('')
      + `<button type="button" class="br-new" aria-label="New tab" title="New tab">${svg(P.plus)}</button>`;
  }
  function bar(c) {
    const t = c.cur, path = t.hist[t.idx];
    if (document.activeElement !== c.addr) c.addr.value = path === null ? '' : 'radialdeck.com/' + path.replace(/(^|\/)index\.html/, '$1');
    c.back.disabled = t.idx === 0;
    c.fwd.disabled = t.idx >= t.hist.length - 1;
    c.root.classList.toggle('is-private', !!t.private);
    c.el.querySelector('.win-title').textContent = path === null ? 'Browser' : `${t.title} - Browser`;
  }

  // ---- Showing a page: the new-tab page, or the real page in the tab's frame ----
  function show(c, t) {
    const path = t.hist[t.idx];
    t.view.querySelector('.bs')?.remove();
    if (path === null) {
      t.frame?.remove(); t.frame = null;
      t.title = t.private ? 'Private tab' : 'New tab'; t.loading = false;
      t.view.prepend(startPage(c, t));
    } else {
      if (!t.frame) {
        t.frame = document.createElement('iframe');
        t.frame.title = 'Page';
        t.frame.addEventListener('load', () => loaded(c, t));
        t.view.append(t.frame);
        t.frame.src = ROOT + path;
      } else t.frame.contentWindow.location.replace(ROOT + path);   // replace: the desktop's own history stays as it is
      t.loading = true;
      watch(t);
    }
    if (c.cur === t) bar(c);
    tabs(c);
  }
  function go(c, t, path, push = true) {
    if (push) { t.hist = t.hist.slice(0, t.idx + 1).concat(path); t.idx++; }
    show(c, t);
  }
  function step(c, d) {
    const t = c.cur;
    if (t.idx + d < 0 || t.idx + d >= t.hist.length) return;
    t.idx += d; show(c, t);
  }
  function reload(c) {
    const t = c.cur;
    if (!t.frame) return show(c, t);
    t.loading = true; tabs(c);
    t.frame.contentWindow.location.reload();
    watch(t);
  }
  function open(c, text) {
    const r = parse(text);
    if (r.start) return go(c, c.cur, null);
    if (r.search) {
      if (r.away) OS.toast('radialdeck.com only', 'This browser opens the pages of this site. Here is what it has on that.', ICON);
      if (c.cur.hist[c.cur.idx] !== null) go(c, c.cur, null);
      c.cur.search ? c.cur.search(r.search) : (c.cur.pending = r.search);
      return;
    }
    const app = appFor(new URL(r.path, ROOT));
    if (app?.id) return OS.open(app.id, { hash: app.hash });
    go(c, c.cur, r.path);
  }

  // The page's own header and footer go before it paints: the class is set as soon as the new document exists.
  function watch(t) {
    const before = t.doc;
    const tick = () => {
      const d = t.frame?.contentDocument;
      if (d && d !== before && d.documentElement && d.URL !== 'about:blank') { d.documentElement.classList.add('rd-embed'); if (OS.phone) d.documentElement.classList.add('rd-phone'); }
      if (t.loading && t.frame) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function loaded(c, t) {
    let d;
    try { d = t.frame.contentDocument; } catch (_) { d = null; }
    t.loading = false;
    if (!d || d.URL === 'about:blank') return tabs(c);
    t.doc = d;
    d.documentElement.classList.add('rd-embed');
    // A page may have moved (a redirect, a link we did not catch): the address follows it.
    const now = rel(new URL(d.URL));
    if (now !== null && now.split('#')[0] !== String(t.hist[t.idx]).split('#')[0]) t.hist[t.idx] = now;
    t.title = (d.title || now || 'Page').replace(/\s*\|\s*RadialDeck.*$/, '').replace(/^Radial menu for /, '') || 'RadialDeck';
    hook(c, t, d);
    tabs(c);
    if (c.cur === t) bar(c);
  }

  // ---- Inside the page: links, and the ring (a frame's pointer events never reach the desktop by themselves) ----
  const BUSY = 'a, button, input, select, textarea, label, summary, video, [contenteditable="true"], [data-no-ring]';
  function hook(c, t, d) {
    if (d.rdHooked) return;
    d.rdHooked = true;
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0) return;
      const u = new URL(a.href, d.baseURI);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;   // mailto: and the like
      const here = new URL(d.URL);
      if (u.hash && u.pathname === here.pathname && u.search === here.search) return;   // a jump within the page
      e.preventDefault();
      const app = appFor(u);
      if (app) { if (app.id) OS.open(app.id, { hash: app.hash }); else OS.minimize('browser'); return; }
      const p = rel(u);
      if (p === null || /^store\b/.test(p)) return void window.open(u.href, '_blank', 'noopener');
      if (e.ctrlKey || e.metaKey || e.shiftKey) newTab(c, p, { background: true, private: t.private }); else go(c, t, p);
    });
    // Hold anywhere on the page: the same events, in the desktop's coordinates, on the frame element.
    let press = null, sawRing = false;
    const fwd = e => {
      if (e.type === 'pointerdown') { sawRing = false; OS.focus('browser'); if (e.target.closest?.(BUSY)) return; press = { x: e.clientX, y: e.clientY, at: performance.now(), touch: e.pointerType === 'touch' }; }
      if (OS.ring.held) { sawRing = true; d.getSelection()?.removeAllRanges(); }
      if (!press) return;
      const r = t.frame.getBoundingClientRect();
      const ev = new PointerEvent(e.type, { bubbles: true, cancelable: true, clientX: e.clientX + r.left, clientY: e.clientY + r.top, screenX: e.screenX, screenY: e.screenY,
        button: e.button, buttons: e.buttons, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary });
      t.frame.dispatchEvent(ev);
      if (e.type === 'pointerup' || e.type === 'pointercancel') press = null;
    };
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(type => d.addEventListener(type, fwd, true));
    d.addEventListener('contextmenu', e => { if (sawRing || OS.ring.held) e.preventDefault(); sawRing = false; });
    // A finger held still for the ring must not scroll the page under it once the ring is up.
    d.addEventListener('touchmove', e => { if (press?.touch && (OS.ring.held || performance.now() - press.at > 300 && Math.hypot(e.touches[0].clientX - press.x, e.touches[0].clientY - press.y) < 12)) e.preventDefault(); }, { passive: false });
    d.addEventListener('keydown', e => keys(c, e));
  }
  function keys(c, e) {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey && k === 'l') || e.key === 'F6') { e.preventDefault(); focusAddr(c); }
    else if (e.key === 'F5' || (e.ctrlKey && k === 'r')) { e.preventDefault(); reload(c); }
    else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); step(c, -1); }
    else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); step(c, 1); }
  }
  function focusAddr(c) { c.addr.focus(); c.addr.select(); }
  function capture(c) {
    const f = c.root.querySelector('.br-flash');
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    const t = c.cur;
    OS.toast('Screenshot copied', `${t.hist[t.idx] === null ? 'The new tab page' : t.title}. Paste it into a chat or an e-mail.`, ICON);
  }

  OS.register({
    id: 'browser',
    tint: '#5eead4',
    async render(body, c) {
      await style('os/apps/browser.css');
      body.innerHTML = `<div class="br">
        <div class="br-tabs" role="tablist" aria-label="Tabs"></div>
        <div class="br-bar">
          <button type="button" class="br-btn br-back" aria-label="Back" title="Back (Alt+Left)">${svg(P.back)}</button>
          <button type="button" class="br-btn br-fwd" aria-label="Forward" title="Forward (Alt+Right)">${svg(P.fwd)}</button>
          <button type="button" class="br-btn br-reload" aria-label="Reload" title="Reload (F5)">${svg(P.reload)}</button>
          <form class="br-addr" role="search">${svg(P.lock)}<input type="text" spellcheck="false" autocomplete="off" aria-label="Address" placeholder="Search or type a radialdeck.com address"></form>
          <span class="br-badge">Private</span>
        </div>
        <div class="br-view"><i class="br-flash" aria-hidden="true"></i></div>
      </div>`;
      c.root = body.querySelector('.br');
      c.strip = body.querySelector('.br-tabs');
      c.view = body.querySelector('.br-view');
      c.addr = body.querySelector('.br-addr input');
      c.back = body.querySelector('.br-back');
      c.fwd = body.querySelector('.br-fwd');
      c.tabs = []; c.closed = []; c.cur = null;
      c.back.addEventListener('click', () => step(c, -1));
      c.fwd.addEventListener('click', () => step(c, 1));
      body.querySelector('.br-reload').addEventListener('click', () => reload(c));
      body.querySelector('.br-addr').addEventListener('submit', e => { e.preventDefault(); const v = c.addr.value; c.addr.blur(); open(c, v); });
      c.addr.addEventListener('focus', () => c.addr.select());
      c.addr.addEventListener('blur', () => bar(c));
      c.strip.addEventListener('click', e => {
        if (e.target.closest('.br-new')) return newTab(c);
        const tab = e.target.closest('.br-tab'), t = tab && c.tabs.find(x => x.id === +tab.dataset.id);
        if (!t) return;
        if (e.target.closest('.br-x')) closeTab(c, t); else select(c, t);
      });
      c.strip.addEventListener('auxclick', e => { const tab = e.target.closest('.br-tab'); if (e.button === 1 && tab) closeTab(c, c.tabs.find(x => x.id === +tab.dataset.id)); });
      body.addEventListener('keydown', e => keys(c, e));
      newTab(c, c.args.url || HOME);
    },
    onOpen(c, args) {
      if (!args.url || !c.tabs) return;
      const t = c.cur, path = t.hist[t.idx];
      if (path === null || path === args.url) go(c, t, args.url, path !== args.url); else newTab(c, args.url);
    },
    // The browser ring from the gallery (Edge and Chrome recipes), as this window does them.
    // Up front what is buried or little known; the one-key basics sit in the Tabs bubble.
    ring: [
      { label: 'Screenshot', icon: '📸', tint: '#ff7aa8', say: 'The whole page, not just what fits on screen. In Edge: Ctrl+Shift+S, then Capture full page.', run: c => capture(c) },
      { label: 'Reopen tab', icon: '↩', tint: '#ffd166', say: 'Brings back the tab you closed by mistake, with its history. Ctrl+Shift+T, which few people know.', run: c => reopen(c) },
      { label: 'Private', icon: '🕶', tint: '#c4a1ff', say: 'A new private tab: no history, no cookies kept.', run: c => { newTab(c, null, { private: true }); focusAddr(c); } },
      { label: 'Tabs', icon: '➕', tint: '#7cc4ff', say: 'A nested ring: New tab, Close tab, Back and Reload come out as bubbles (Pro).', children: [
        { label: 'New tab', icon: '➕', tint: '#7cc4ff', say: 'Opens a new tab.', run: c => { newTab(c); focusAddr(c); } },
        { label: 'Close tab', icon: '✖', tint: '#ff6b6b', say: 'Closes the tab you are on.', run: c => closeTab(c) },
        { label: 'Back', icon: 'fluent:E72B', tint: '#fdba74', say: 'Goes back a page.', run: c => c.cur.idx ? step(c, -1) : OS.toast('Back', 'This tab has nowhere to go back to.', ICON) },
        { label: 'Reload', icon: 'fluent:E72C', tint: '#6ee7a0', say: 'Loads the page again.', run: c => reload(c) },
      ] },
    ],
  });

  // For checks and the console: OSBrowser.parse('for/excel') -> { path: 'for/excel.html' }
  window.OSBrowser = { parse, appFor: href => appFor(new URL(href, ROOT)) };
})();
