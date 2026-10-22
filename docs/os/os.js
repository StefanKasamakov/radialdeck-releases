/* RadialDeck desktop: radialdeck.com as a Windows 11 desktop. Every part of the site is an app in a window,
   and the live ring works everywhere: hold the mouse (or a finger) anywhere, flick, let go. The ring is the
   focused window's; the desktop's own is Everyday. The page is written by build/site-os.py; the app API is in
   site/os/README.md. Needs themes.js, ring.js and os/ring-live.js before it. */
window.OS = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body, html = document.documentElement;
  const { Spring, reduce } = RingLive;
  // A phone gets the laptop page (os/mobile.js, html.os-mobile): the desktop does not start there; the same page in
  // its laptop (?frame=laptop, html.os-laptop) is this desktop, run by a finger. Both are set in the page's head.
  const mobile = html.classList.contains('os-mobile');
  // How much the laptop page shrinks this desktop (it sets --os-k): a finger's slop is in the phone's pixels.
  const scale = () => parseFloat(html.style.getPropertyValue('--os-k')) || 1;
  const TASKBAR = 48;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('rd-os:' + k)); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem('rd-os:' + k, JSON.stringify(v)); } catch (_) { } },
  };

  // ---- Icons (Lucide paths). Apps may name these in their ring slices: { icon: 'copy' }. ----
  const IC = {
    theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    snip: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8h8M7 12h10M7 16h6"/>',
    playpause: '<path d="M4 5v14l9-7z"/><path d="M16 5v14M20 5v14"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    minimize: '<path d="M5 12h14"/>',
    maximize: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    restore: '<rect x="4" y="8" width="12" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/>',
    snapLeft: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16" /><path d="M3 4h9v16H3z" fill="currentColor" fill-opacity=".35"/>',
    snapRight: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><path d="M12 4h9v16h-9z" fill="currentColor" fill-opacity=".35"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    ring: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    caseUp: '<path d="M4 20 10 4l6 16M6 14h8M19 8v12M16 11l3-3 3 3"/>',
    caseDown: '<path d="M4 20 10 4l6 16M6 14h8M19 8v12M16 17l3 3 3-3"/>',
    title: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    spaces: '<path d="M3 12h4M10 12h4M17 12h4M3 6h18M3 18h18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    sort: '<path d="M3 6h12M3 12h8M3 18h4M17 4v16M14 17l3 3 3-3"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-11z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  };
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  // Windows 11's caption buttons are drawn thin, 10 px wide.
  const CAP = {
    min: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5.5h10"/></svg>',
    max: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x=".5" y=".5" width="9" height="9" rx="1.5"/></svg>',
    restore: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x=".5" y="2.5" width="7" height="7" rx="1.2"/><path d="M2.5 2.5V1.8A1.3 1.3 0 0 1 3.8.5h4.4a1.3 1.3 0 0 1 1.3 1.3v4.4a1.3 1.3 0 0 1-1.3 1.3H7.5"/></svg>',
    close: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="m.5.5 9 9M9.5.5l-9 9"/></svg>',
  };

  // ---- The app registry: what build/site-os.py put in the page, plus what each app's script adds ----
  const apps = new Map(JSON.parse($('#os-apps').textContent).map(a => [a.id, a]));
  const aliases = new Map([...apps.values()].flatMap(a => (a.aliases || []).map(x => [x, a.id])));
  function register(def) { apps.set(def.id, Object.assign(apps.get(def.id) || { title: def.id, icon: 'assets/icon.png' }, def, { loaded: true })); }
  // An app's script and style load the first time it opens, with those of the apps it needs (app.needs).
  function need(app) {
    const all = [], walk = a => { if (a && !all.includes(a)) { all.push(a); (a.needs || []).forEach(id => walk(apps.get(id))); } };
    walk(app);
    return Promise.all(all.flatMap(a => [a.css && style(a.css), a.js && !a.loaded && load(a.js)]).filter(Boolean)).catch(err => console.error(err));
  }

  // ---- Windows ----
  const layer = $('#os-windows'), snapEl = $('#os-snap');
  const wins = new Map();   // id -> { id, app, el, body, ctx, g: normal geometry, v: what is painted, max, snap, min }
  let z = 10, focused = null, lastOpened = null;
  const area = () => ({ w: innerWidth, h: innerHeight - TASKBAR });
  function rectOf(w) {
    const a = area();
    if (w.max) return { x: 0, y: 0, w: a.w, h: a.h };
    if (w.snap) { const half = Math.round(a.w / 2); return w.snap === 'left' ? { x: 0, y: 0, w: half, h: a.h } : { x: half, y: 0, w: a.w - half, h: a.h }; }
    return w.g;
  }
  // Only transform and opacity change while a window moves; its size changes on resize, maximise and snap.
  function paint(w) { w.el.style.transform = `translate(${w.v.x.toFixed(1)}px, ${w.v.y.toFixed(1)}px) scale(${w.v.s.toFixed(4)})`; w.el.style.opacity = w.v.o.toFixed(3); }
  function size(w) {
    const r = rectOf(w);
    w.el.style.width = r.w + 'px'; w.el.style.height = r.h + 'px';
    w.el.classList.toggle('is-max', !!w.max);
    w.el.classList.toggle('is-snapped', !!w.snap);
    w.el.querySelector('.win-max').innerHTML = w.max ? CAP.restore : CAP.max;
    w.el.querySelector('.win-max').setAttribute('aria-label', w.max ? 'Restore' : 'Maximize');
    return r;
  }
  function place(w, animate) {
    const r = size(w);
    if (animate && !w.min) { w.v = { x: r.x, y: r.y, s: .975, o: .8 }; paint(w); tween(w, { s: 1, o: 1 }, { response: .26, damping: .9 }); }
    else if (!w.min) { w.v = { x: r.x, y: r.y, s: 1, o: 1 }; paint(w); }
  }

  // Springs drive every window animation: open, minimise, restore, close.
  const tweens = new Set();
  let raf = 0, last = 0;
  function tween(w, to, { response = .3, damping = .82, done } = {}) {
    if (w.tw) tweens.delete(w.tw);
    if (reduce) { Object.assign(w.v, to); paint(w); w.tw = null; done?.(); return; }
    const sp = new Spring(response, damping); sp.target = 1;
    w.tw = { w, from: { ...w.v }, to, sp, done };
    tweens.add(w.tw);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; raf = 0;
    for (const t of tweens) {
      t.sp.step(dt);
      const p = t.sp.value;
      for (const k in t.to) t.w.v[k] = t.from[k] + (t.to[k] - t.from[k]) * p;
      t.w.v.o = clamp(t.w.v.o, 0, 1);
      if (t.sp.rest) { Object.assign(t.w.v, t.to); tweens.delete(t); t.w.tw = null; paint(t.w); t.done?.(); }
      else paint(t.w);
    }
    if (tweens.size) raf = requestAnimationFrame(tick);
  }

  function makeWindow(app) {
    const el = document.createElement('section');
    el.className = 'win';
    el.dataset.app = app.id;
    el.tabIndex = -1;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-labelledby', `win-t-${app.id}`);
    el.innerHTML = `<div class="win-bar">
        <img class="win-ico" src="${esc(app.icon)}" alt="" width="16" height="16">
        <h2 class="win-title" id="win-t-${app.id}">${esc(app.title)}</h2>
        <button class="win-ringbtn" type="button" aria-label="${esc(app.title)}'s ring" title="This window's ring (or hold the mouse anywhere)">${svg(IC.ring)}</button>
        <div class="win-caps">
          <button class="win-min" type="button" aria-label="Minimize" title="Minimize">${CAP.min}</button>
          <button class="win-max" type="button" aria-label="Maximize" title="Maximize">${CAP.max}</button>
          <button class="win-close" type="button" aria-label="Close" title="Close">${CAP.close}</button>
        </div>
      </div>
      <div class="win-body"></div>
      ${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="rz rz-${d}" data-d="${d}" aria-hidden="true"></i>`).join('')}`;
    const w = { id: app.id, app, el, body: el.querySelector('.win-body'), g: null, v: { x: 0, y: 0, s: 1, o: 1 }, max: false, snap: null, min: false };
    const bar = el.querySelector('.win-bar');
    bar.addEventListener('pointerdown', e => drag(w, e));
    bar.addEventListener('dblclick', e => { if (!e.target.closest('button')) toggleMax(w); });
    el.querySelector('.win-min').addEventListener('click', () => minimize(w));
    el.querySelector('.win-max').addEventListener('click', () => toggleMax(w));
    el.querySelector('.win-close').addEventListener('click', () => close(w.id));
    el.querySelector('.win-ringbtn').addEventListener('click', e => { const b = e.currentTarget.getBoundingClientRect(); openRing(w, ringPoint(w, b), 'sticky'); });
    el.querySelectorAll('.rz').forEach(h => h.addEventListener('pointerdown', e => resize(w, e)));
    el.addEventListener('pointerdown', () => focus(w), true);
    el.addEventListener('focusin', () => focus(w));
    return w;
  }

  // Where a window starts: where it was last time, else cascading from the last one opened, else centred.
  function geometry(app) {
    const a = area(), saved = store.get('win:' + app.id), [dw, dh] = app.size || [820, 560];
    const w = Math.round(clamp(saved?.w || dw, 340, a.w - 16)), h = Math.round(clamp(saved?.h || dh, 220, a.h - 16));
    // Coming back, a window is whole on the screen even if it was left half off it.
    if (saved) return { g: { x: clamp(saved.x, 0, a.w - w), y: clamp(saved.y, 0, a.h - h), w, h }, max: !!saved.max };
    const prev = lastOpened && wins.get(lastOpened);
    let x = Math.round((a.w - w) / 2), y = Math.round(Math.max(8, (a.h - h) / 2 - 12));
    if (prev && !prev.min) { x = prev.g.x + 28; y = prev.g.y + 28; if (x + w > a.w - 8 || y + h > a.h - 8) { x = 40; y = 24; } }
    return { g: { x, y, w, h }, max: false };
  }
  function save(w) { if (w.g) store.set('win:' + w.id, { ...w.g, max: w.max }); }

  async function open(id, args = {}) {
    const app = apps.get(id) || apps.get(aliases.get(id));
    if (!app) return null;
    closeStart();
    let w = wins.get(app.id);
    if (w) {
      w.ctx.args = args;
      if (w.min) restore(w); else focus(w);
      app.onOpen?.(w.ctx, args);
      return w.ctx;
    }
    w = makeWindow(app);
    wins.set(app.id, w);
    const geo = geometry(app);
    w.g = geo.g; w.max = geo.max;
    lastOpened = app.id;
    const ctx = w.ctx = { id: app.id, app, el: w.el, body: w.body, args, close: () => close(app.id), focus: () => focus(w) };
    layer.append(w.el);
    const r = size(w);
    w.v = { x: r.x, y: r.y, s: .94, o: 0 };
    paint(w);
    focus(w);
    tween(w, { y: r.y, s: 1, o: 1 }, { response: .32, damping: .8 });

    // Content: inline in this page, or fetched from the page that holds it.
    const inline = $(`.os-src[data-app="${app.id}"]`);
    if (inline) { w.body.append(...inline.childNodes); inline.remove(); }
    else if (app.src) {
      w.body.innerHTML = '<p class="win-loading">Opening…</p>';
      const got = await fetchSource(app);
      if (!wins.has(app.id)) return null;
      w.body.innerHTML = got || `<p class="win-loading">This window could not load. <a href="${esc(app.href || app.src)}">Open it as a page</a>.</p>`;
    }
    await need(app);
    if (!wins.has(app.id)) return null;
    if (app.phase2) {
      w.body.insertAdjacentHTML('afterbegin', `<div class="p2"><img src="${esc(app.icon)}" alt="" width="56" height="56"><div><b>Coming in phase 2</b><p>${esc(app.phase2)}</p>`
        + (app.link ? `<a class="os-btn" href="${esc(app.link[0])}">${esc(app.link[1])} →</a>` : '') + '</div></div>');
    }
    try { await app.render?.(w.body, ctx); } catch (err) { console.error(err); }
    app.onOpen?.(ctx, args);
    // A window's first open, once its content is in (os/apps/welcome.js puts its first-time hint on it).
    dispatchEvent(new CustomEvent('os:open', { detail: ctx }));
    return ctx;
  }

  const sources = new Map();
  function fetchSource(app) {
    if (!sources.has(app.src)) sources.set(app.src, fetch(app.src).then(r => r.ok ? r.text() : '').then(t => new DOMParser().parseFromString(t, 'text/html')).catch(() => null));
    return sources.get(app.src).then(doc => doc?.querySelector(`.os-src[data-app="${app.id}"]`)?.innerHTML || '');
  }

  function close(id) {
    const w = wins.get(id);
    if (!w) return;
    w.app.onClose?.(w.ctx);
    save(w);
    wins.delete(id);
    const hadFocus = w.el.contains(document.activeElement);
    w.el.classList.add('is-closing');
    tween(w, { s: .96, o: 0 }, { response: .18, damping: 1, done: () => w.el.remove() });
    if (focused === w) { focused = null; focusTop(); }
    taskbar();
    // Keyboard focus that was in the window goes to the next window, else to the app's taskbar button or icon.
    if (hadFocus && !focused) ($(`#tb-apps [data-app="${id}"]`) || $(`.os-icon[data-app="${id}"]`) || $('.tb-start', tbApps))?.focus({ preventScroll: true });
  }

  function minimize(w) {
    if (w.min) return;
    w.min = true;
    w.el.classList.add('is-min');
    const r = rectOf(w), b = $(`#tb-apps [data-app="${w.id}"]`)?.getBoundingClientRect();
    const to = b ? { x: b.left + b.width / 2 - r.w / 2, y: b.top + b.height / 2 - r.h / 2, s: .1, o: 0 } : { y: r.y + 30, s: .94, o: 0 };
    tween(w, to, { response: .3, damping: 1, done: () => { if (w.min) w.el.hidden = true; } });
    if (focused === w) { focused = null; w.el.classList.remove('is-focused'); focusTop(); }
    taskbar();
  }
  function restore(w) {
    w.min = false;
    w.el.hidden = false;
    w.el.classList.remove('is-min');
    const r = size(w);
    focus(w);
    tween(w, { x: r.x, y: r.y, s: 1, o: 1 }, { response: .32, damping: .84 });
  }
  function toggleMax(w) { w.max = !w.max; w.snap = null; place(w, true); save(w); }

  function focus(w) {
    if (!w || w.min || !wins.has(w.id)) return;
    if (focused !== w) {
      focused?.el.classList.remove('is-focused');
      focused = w;
      w.el.style.zIndex = ++z;
      w.el.classList.add('is-focused');
      setUrl(w.app);
      taskbar();
    }
    if (!w.el.contains(document.activeElement)) w.el.focus({ preventScroll: true });
  }
  function focusTop() {
    const top = [...wins.values()].filter(w => !w.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    if (top) focus(top); else { setUrl(null); taskbar(); }
  }
  function blurAll() { if (!focused) return; focused.el.classList.remove('is-focused'); focused = null; setUrl(null); taskbar(); }

  // ---- Drag by the title bar, snap to an edge, resize from edges and corners ----
  function showSnap(to) {
    snapEl.className = 'os-snap' + (to ? ' is-on is-' + to : '');
  }
  function drag(w, e) {
    if (e.button !== 0 || e.target.closest('button')) return;
    const bar = e.currentTarget, sx = e.clientX, sy = e.clientY;
    let r0 = { ...rectOf(w) }, moved = false, snapTo = null;
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved) {
        if (Math.hypot(dx, dy) < 4) return;
        moved = true;
        w.el.classList.add('is-dragging');
        // A maximised or snapped window comes off the edge at its own size, still under the pointer.
        if (w.max || w.snap) {
          const rel = (sx - r0.x) / r0.w;
          w.max = false; w.snap = null;
          w.g.x = Math.round(sx - rel * w.g.w); w.g.y = 0;
          size(w); r0 = { ...w.g };
        }
      }
      w.g.x = Math.round(r0.x + dx);
      w.g.y = Math.round(clamp(r0.y + dy, 0, area().h - 40));
      w.v.x = w.g.x; w.v.y = w.g.y; paint(w);
      const next = ev.clientX <= 2 ? 'left' : ev.clientX >= innerWidth - 3 ? 'right' : ev.clientY <= 2 ? 'max' : null;
      if (next !== snapTo) {
        snapTo = next;
        // The outline shows behind the window being dragged, in front of the rest.
        if (snapTo) { snapEl.style.zIndex = ++z; w.el.style.zIndex = ++z; }
        showSnap(snapTo);
      }
    };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      w.el.classList.remove('is-dragging');
      showSnap(null);
      if (snapTo === 'max') { w.max = true; place(w, true); }
      else if (snapTo) { w.snap = snapTo; place(w, true); }
      if (moved) save(w);
    };
    // Listened to on the window, not captured: the pointer may leave the bar and the page.
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }
  function resize(w, e) {
    if (w.max || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    focus(w);
    const h = e.currentTarget, d = h.dataset.d, sx = e.clientX, sy = e.clientY;
    if (w.snap) { w.g = { ...rectOf(w) }; w.snap = null; }
    const g0 = { ...w.g };
    w.el.classList.add('is-resizing');
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let { x, y, w: ww, h: hh } = g0;
      if (d.includes('e')) ww = Math.max(340, g0.w + dx);
      if (d.includes('s')) hh = Math.max(220, g0.h + dy);
      if (d.includes('w')) { ww = Math.max(340, g0.w - dx); x = g0.x + g0.w - ww; }
      if (d.includes('n')) { hh = Math.max(220, g0.h - dy); y = g0.y + g0.h - hh; if (y < 0) { hh += y; y = 0; } }
      w.g = { x, y, w: ww, h: hh };
      size(w); w.v.x = x; w.v.y = y; paint(w);
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); w.el.classList.remove('is-resizing'); save(w); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }

  // ---- The address bar follows the window in front: features.html, ?app=notepad, or the plain desktop ----
  const baseTitle = document.title, layoutAsked = new URLSearchParams(location.search).get('layout') === html.dataset.layout && html.dataset.layout;
  function setUrl(app) {
    const want = new URL(app ? (app.url || `./?app=${app.id}`) : './', location.href);
    if (location.pathname.endsWith('/index.html') && want.pathname.endsWith('/')) want.pathname += 'index.html';
    if (html.classList.contains('os-laptop')) want.searchParams.set('frame', 'laptop');   // stays the laptop on a reload
    if (layoutAsked) want.searchParams.set('layout', layoutAsked);                        // and the icons' layout asked for
    if (want.pathname + want.search !== location.pathname + location.search) {
      try { history.replaceState(history.state, '', want.pathname + want.search); } catch (_) { }
    }
    // The page's own app keeps the page's title (what search engines read after the scripts ran).
    document.title = app && app.id !== body.dataset.open ? `${app.title} | RadialDeck` : baseTitle;
  }

  // ---- Taskbar ----
  const START = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4cc2ff" d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z"/></svg>';
  const tbApps = $('#tb-apps');
  const pinned = [...apps.values()].filter(a => a.pinned).map(a => a.id);
  function taskbar() {
    const ids = [...pinned, ...[...wins.keys()].filter(id => !pinned.includes(id))];
    if (tbApps.dataset.ids !== ids.join()) {
      tbApps.dataset.ids = ids.join();
      tbApps.innerHTML = `<button class="tb-start" type="button" aria-label="Start" aria-expanded="false">${START}</button>`
        + `<button class="tb-search" type="button" aria-label="Search">${svg(IC.search)}</button>`
        + ids.map(id => { const a = apps.get(id); return `<button type="button" data-app="${id}" aria-label="${esc(a.title)}" title="${esc(a.title)}"><img src="${esc(a.icon)}" alt=""></button>`; }).join('');
    }
    $$('button[data-app]', tbApps).forEach(b => {
      const w = wins.get(b.dataset.app);
      b.classList.toggle('is-open', !!w);
      b.classList.toggle('is-active', !!w && w === focused);
      b.setAttribute('aria-pressed', String(!!w && w === focused));
    });
    $('.tb-start', tbApps).setAttribute('aria-expanded', String(startOpen));
  }
  tbApps.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('tb-start')) return toggleStart();
    if (b.classList.contains('tb-search')) return toggleStart(true);
    const w = wins.get(b.dataset.app);
    if (!w) open(b.dataset.app);
    else if (w.min) restore(w);
    else if (w === focused) minimize(w);
    else focus(w);
  });

  // ---- Start menu: every app, a search across apps, what is inside them, and the site's pages ----
  const startEl = $('#start'), startQ = $('#start-q'), results = $('#start-results');
  let startOpen = false;
  function toggleStart(search) {
    if (startOpen && !search) return closeStart();
    startOpen = true;
    startEl.classList.add('is-open');
    taskbar();
    startQ.value = ''; find('');
    requestAnimationFrame(() => startQ.focus());
  }
  function closeStart() {
    if (!startOpen) return;
    startOpen = false;
    startEl.classList.remove('is-open');
    taskbar();
  }
  const pages = $$('.start-page', startEl).map(a => ({ href: a.getAttribute('href'), label: a.querySelector('b').textContent, sub: a.querySelector('small').textContent }));
  function find(q) {
    q = q.trim().toLowerCase();
    startEl.classList.toggle('is-searching', !!q);
    results.hidden = !q;
    if (!q) return;
    const words = q.split(/\s+/), hit = text => words.every(x => text.toLowerCase().includes(x));
    let out = [];
    for (const a of apps.values()) if (hit(`${a.title} ${a.keywords || ''}`)) out.push({ app: a.id, label: a.title, sub: 'App', icon: a.icon });
    for (const a of apps.values()) for (const [label, hash] of a.search || []) if (hit(label)) out.push({ app: a.id, hash, label, sub: `In ${a.title}`, icon: a.icon });
    for (const p of pages) if (hit(`${p.label} ${p.sub}`)) out.push({ href: p.href, label: p.label, sub: p.sub });
    // A name that starts with what was typed comes first, whatever kind it is.
    out = [...out.filter(r => r.label.toLowerCase().startsWith(q)), ...out.filter(r => !r.label.toLowerCase().startsWith(q))];
    results.innerHTML = out.slice(0, 9).map(r => r.href
      ? `<a class="start-hit" role="option" href="${esc(r.href)}">${svg(IC.file)}<span><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></span></a>`
      : `<button class="start-hit" role="option" type="button" data-app="${r.app}" data-hash="${esc(r.hash || '')}"><img src="${esc(r.icon)}" alt=""><span><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></span></button>`
    ).join('') || '<p class="start-none">Nothing found. Try "drop", "pricing" or "Excel".</p>';
  }
  startQ.addEventListener('input', () => find(startQ.value));
  startQ.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const first = $('.start-hit', results); if (first) { e.preventDefault(); first.click(); } }
    if (e.key === 'ArrowDown') { $('.start-hit', results)?.focus(); e.preventDefault(); }
  });
  results.addEventListener('keydown', e => {
    const hits = $$('.start-hit', results), i = hits.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { hits[Math.min(hits.length - 1, i + 1)]?.focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { (i <= 0 ? startQ : hits[i - 1]).focus(); e.preventDefault(); }
  });
  startEl.addEventListener('click', e => {
    const t = e.target.closest('[data-app], [data-act]');
    if (!t || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    if (t.dataset.act === 'lock') { closeStart(); return lock(); }
    open(t.dataset.app, { hash: t.dataset.hash || '' });
  });

  // ---- Desktop icons: one click opens (Windows' "single-click to open" setting: on a web page nobody double-clicks) ----
  // They come in groups (build/site-os.py GROUPS), laid out by the page's ?layout= (os.css): fences, clean, folders.
  const iconsEl = $('#os-icons');
  function select(ic) { $$('.os-icon.is-selected', iconsEl).forEach(x => x !== ic && x.classList.remove('is-selected')); ic?.classList.add('is-selected'); }
  function activate(ic) {
    folder(null);
    if (ic.dataset.more !== undefined) return toggleStart();
    if (ic.dataset.bin !== undefined) return apps.has('bin') ? open('bin') : binInfo();
    open(ic.dataset.app);
  }
  // Folders: a group's tile opens it beside the tile; a click elsewhere, Esc or an app opening closes it.
  function folder(fence, on = !fence?.classList.contains('is-open')) {
    $$('.os-fence.is-open', iconsEl).forEach(f => { if (f !== fence || !on) { f.classList.remove('is-open'); $('.os-fence-open', f).setAttribute('aria-expanded', 'false'); } });
    if (fence && on) { fence.classList.add('is-open'); $('.os-fence-open', fence).setAttribute('aria-expanded', 'true'); }
  }
  const tile = t => t.closest('.os-icon, .os-fence-open');
  iconsEl.addEventListener('click', e => {
    const ic = tile(e.target);
    if (!ic || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (ic.classList.contains('os-fence-open')) return folder(ic.parentElement);
    select(ic);
    activate(ic);
  });
  // Arrows go to the nearest icon that way, whatever the layout.
  function toward(from, [dx, dy]) {
    const a = from.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, score = Infinity;
    for (const b of $$('.os-icon, .os-fence-open', iconsEl)) {
      const r = b.getBoundingClientRect();
      if (b === from || !r.width) continue;
      const x = r.left + r.width / 2 - ax, y = r.top + r.height / 2 - ay, along = x * dx + y * dy, across = Math.abs(x * dy - y * dx);
      if (along > 4 && along + across * 2 < score) { score = along + across * 2; best = b; }
    }
    return best;
  }
  iconsEl.addEventListener('keydown', e => {
    const ic = tile(e.target);
    if (!ic) return;
    if (e.key === 'Escape' && ic.closest('.os-fence.is-open')) { e.preventDefault(); e.stopPropagation(); const f = ic.closest('.os-fence'); folder(null); $('.os-fence-open', f).focus(); return; }
    if (e.key === 'Enter' && ic.classList.contains('os-icon')) { e.preventDefault(); activate(ic); return; }
    const d = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowLeft: [-1, 0] }[e.key];
    const n = d && toward(ic, d);
    if (d) e.preventDefault();
    if (n) { n.focus(); select(n.classList.contains('os-icon') ? n : null); }
  });
  iconsEl.addEventListener('focusin', e => { const ic = e.target.closest('.os-icon'); if (ic) select(ic); });

  // Links anywhere that lead to an app open it here instead of loading a page.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0 || a.target) return;
    const id = a.dataset.openApp || appOfHref(a);
    if (!id) return;
    e.preventDefault();
    const u = new URL(a.href, location.href);
    open(id, { hash: u.hash.slice(1), params: Object.fromEntries(u.searchParams) });
  });
  function appOfHref(a) {
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || a.closest('.os-icons, .start')) return null;
    const file = u.pathname.split('/').pop();
    const q = u.searchParams.get('app');
    if (q && apps.has(q)) return q;
    const byUrl = [...apps.values()].find(x => x.url && x.url === file);
    if (byUrl) return byUrl.id;
    if ((file === '' || file === 'index.html') && aliases.has(u.hash.slice(1))) return aliases.get(u.hash.slice(1));
    return null;
  }

  // ---- The ring ----
  const caption = $('#caption'), sayEl = $('#ring-say');
  const S_ = (label, icon, say, run) => ({ label, icon: IC[icon] || icon, say, run });
  // Labels and descriptions are the gallery's own (src/RadialDeck/Settings/Gallery/recipes.json).
  // Apps, Music and Text hold nested rings: pointed at, their slices come out as bubbles (Pro, next update).
  const DESK_APPS = ['outlook', 'excel', 'word', 'explorer', 'terminal', 'code', 'cad', 'photo', 'music', 'teams'];
  const appBubbles = () => DESK_APPS.map(id => apps.get(id)).filter(Boolean)
    .map(a => ({ label: a.title, icon: 'img:' + a.icon, tint: a.tint, say: `Opens ${a.title}.`, run: () => open(a.id) }));
  // The Music app's own slices (os/apps/music.js, loaded with every page): Play/Pause, Prev, Next, Vol +, Vol −, Mute.
  const musicBubbles = () => { const r = apps.get('music')?.ring; return Array.isArray(r) ? [0, 5, 1, 2, 4, 3].map(i => r[i]) : [S_('Play/Pause', '⏯', 'Plays or pauses whatever is playing.', () => play()), S_('Mute', '🔇', 'Mutes the sound, and unmutes it again.', () => mute())]; };
  // Text works on Notepad's note (or what is selected in it), with Notepad's own slices.
  const inNotepad = label => async () => { const c = await open('notepad'); apps.get('notepad')?.ring?.find(s => s.label === label)?.run(c); };
  const T_ = (label, icon, tint, say) => ({ label, icon, tint, say: `In Notepad: ${say}`, run: inNotepad(label) });
  const TEXT = [
    { label: 'Case', icon: 'fluent:E8D2', tint: '#ffd166', say: 'A bubble with a ring of its own: UPPER, lower and Title Case come out beyond it.', children: [
      T_('UPPER', 'fluent:E8C8', '#ffd166', 'the note, or what you selected, in capitals.'),
      T_('lower', 'fluent:E8C8', '#ff7aa8', 'the note, or what you selected, in small letters.'),
      T_('Title Case', 'fluent:E8A5', '#fdba74', 'First Letter Of Every Word.'),
    ] },
    T_('Trim spaces', 'fluent:E8A5', '#5eead4', 'collapses whitespace into single spaces.'),
    T_('Clean link', '🔗', '#7cc4ff', 'removes utm_, fbclid, gclid… from the links.'),
    T_('Count', '🔢', '#c4a1ff', 'words, characters and lines in a balloon.'),
    S_('Screen text', 'fluent:E722', 'Mark an area of the screen; the text in it is copied. Uses the OCR built into Windows.', () => snip('Text copied', '"Your workday. In one gesture."')),
  ];
  const EVERYDAY = [
    { ...S_('Apps', 'fluent:E71D', 'Point at it: your programs come out as bubbles. Pick one to open it.'), children: appBubbles },
    S_('Dark/Light', '🌗', 'Switches Windows between dark and light mode.', () => setNight()),
    { ...S_('Text', '🔤', 'Point at it: the text tricks come out as bubbles, and Case holds a second layer.'), children: TEXT },
    S_('Snip', '✂', 'Mark any part of the screen. It lands on the clipboard.', () => snip('Snip copied', 'Paste it into a chat or an e-mail.')),
    S_('Lock', '🔒', 'Locks the PC on the spot.', () => lock()),
    S_('Empty bin', '🗑', 'Empties the Recycle Bin without opening it.', () => emptyBin()),
    { ...S_('Music', '🎵', 'Point at it: Play/Pause, Next, Volume and Mute come out as bubbles.'), children: musicBubbles },
    S_('Show desktop', 'fluent:E8B7', 'Minimises every window. Pick it again to bring them back.', () => showDesktop()),
  ];
  const TINT = { Apps: '#7cc4ff', 'Dark/Light': '#ffd166', Text: '#c4a1ff', Snip: '#ff7aa8', Lock: '#5eead4', 'Empty bin': '#ff6b6b', Music: '#6ee7a0', 'Show desktop': '#7cc4ff' };
  EVERYDAY.forEach(s => s.tint = TINT[s.label]);
  const DESK_HUB = { title: 'Everyday', sub: '8 actions' };
  // A window without a ring of its own gets this one.
  const WINDOW_RING = [
    S_('Minimize', 'fluent:E921', 'Sends the window to the taskbar.', c => minimize(wins.get(c.id))),
    S_('Maximize', '⬜', 'Fills the screen, or puts the window back.', c => toggleMax(wins.get(c.id))),
    S_('Snap right', '◨', 'The right half of the screen.', c => snapTo(c.id, 'right')),
    S_('Close', '✖', 'Closes the window.', c => close(c.id)),
    S_('Show desktop', 'fluent:E8B7', 'Minimises every window. Pick it again to bring them back.', () => showDesktop()),
    S_('Dark/Light', '🌗', 'Switches Windows between dark and light mode.', () => setNight()),
    S_('Snap left', '◧', 'The left half of the screen.', c => snapTo(c.id, 'left')),
    S_('Lock', '🔒', 'Locks the PC on the spot.', () => lock()),
  ];
  function snapTo(id, side) { const w = wins.get(id); if (!w) return; w.max = false; w.snap = side; place(w, true); }

  const ring = RingLive.create($('#ring'), {
    home: () => $('#anchor'),
    icons: IC,
    room: () => ({ left: 0, top: 0, right: innerWidth, bottom: innerHeight - TASKBAR }),
    onHot: s => {
      // Bubbles out: the hint above the ring has done its job.
      if (!peeking && ring.bubbles.parent >= 0) $('#coach').classList.add('is-done');
      if (mode) {
        sayEl.textContent = s ? `${s.label}. ${s.say || ''}` : ''; sayEl.classList.toggle('is-on', !!s);
        return;
      }
      caption.innerHTML = s ? `<b>${esc(s.label)}.</b> ${esc(s.say || '')}` : DEFAULT_CAPTION;
    },
    onFire: s => {
      const c = target;
      try { s.run ? s.run(c?.ctx || null) : toast(s.label, s.say || '', c?.app?.icon); } catch (err) { console.error(err); }
      if (mode === 'sticky') home();
    },
  });
  const DEFAULT_CAPTION = caption.innerHTML;
  let mode = null, target = null, press = null, holdTimer = 0, shift = { x: 0, y: 0 }, peeking = false;

  function ringFor(w) {
    if (!w) return [EVERYDAY, DESK_HUB];
    const a = w.app;
    const list = (typeof a.ring === 'function' ? a.ring(w.ctx) : a.ring) || WINDOW_RING;
    return [list.slice(0, 8).map(s => ({ ...s, icon: IC[s.icon] || s.icon || IC.ring })), { title: a.title, sub: 'Flick, let go', icon: a.icon, tint: a.tint }];
  }
  function ringPoint(w, b) {
    const r = w.el.getBoundingClientRect(), half = 170;
    return { x: clamp(b ? b.left + b.width / 2 : r.left + r.width / 2, half, innerWidth - half), y: clamp(b ? b.bottom + half : r.top + r.height / 2, half, innerHeight - half) };
  }
  // mode 'hold': follows the pointer until it is let go. 'sticky': opened by a button or the keyboard, waits for a click.
  function openRing(w, at, how) {
    clearTimeout(holdTimer);
    if (w) focus(w);
    mode = how;
    target = w ? { app: w.app, ctx: w.ctx } : null;
    const [slices, hub] = ringFor(w);
    shift = { x: 0, y: 0 };
    // Under a finger the whole ring stays on the screen (above the taskbar): the finger steers it from where it
    // pressed, so a press near an edge still starts on the hub. A mouse keeps the ring right under the pointer.
    if (press?.touch && at) {
      const s = Math.min($('#anchor').offsetWidth || 340, innerWidth * .9, innerHeight * .8), m = 6;
      const c = { x: clamp(at.x, s / 2 + m, innerWidth - s / 2 - m), y: clamp(at.y, s / 2 + m, Math.max(s / 2 + m, innerHeight - TASKBAR - s / 2 - m)) };
      shift = { x: at.x - c.x, y: at.y - c.y };
      at = c;
    }
    ring.swap(slices, hub, at);
    $('#coach').classList.add('is-done');
    if (how === 'sticky') setTimeout(() => ring.el.focus({ preventScroll: true }), 60);
    if (press?.touch) {
      html.classList.add('os-ringing');   // no text selection under a held finger
      getSelection()?.removeAllRanges();
      // Chrome refuses vibrate (and says so in the console) until the page has had a tap.
      if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(8);
    }
  }
  function home() {
    const back = mode === 'sticky' && target ? wins.get(target.ctx.id) : null;
    mode = null; target = null; press = null; shift = { x: 0, y: 0 };
    html.classList.remove('os-ringing');
    sayEl.classList.remove('is-on');
    ring.swap(EVERYDAY, DESK_HUB, null);
    back?.el.focus({ preventScroll: true });
  }

  // ---- A finger and text fields: no keyboard until a tap on the field says "type here" ----
  // A finger on a field does not focus it (pointerdown's default is prevented): held still it is the ring, as
  // everywhere; moved it scrolls; a quick tap focuses it with the caret where it tapped (the keyboard comes up);
  // a second quick tap selects the word. A field an app focuses by itself after a finger (Start's search, a window
  // that opens with its text focused, a slice that edits the text) gets the focus without the keyboard
  // (inputmode="none", until the field is tapped). A key or a double click (Excel's cell) still focuses as usual.
  const FIELD = 'textarea, input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number]';
  function fieldOf(t) {
    if (t?.isContentEditable) { while (t.parentElement?.isContentEditable) t = t.parentElement; return t; }
    const f = t?.closest?.(FIELD);
    return f && !f.readOnly && !f.disabled ? f : null;
  }
  let finger = false, intent = false, fieldTouch = false, lastTap = null;
  const quiet = f => { if (!f.hasAttribute('inputmode')) { f.setAttribute('inputmode', 'none'); f.dataset.osQuiet = ''; } };
  const loud = f => { if (f.dataset.osQuiet === undefined) return false; f.removeAttribute('inputmode'); delete f.dataset.osQuiet; return true; };
  document.addEventListener('focusin', e => { const f = fieldOf(e.target); if (f && finger && !intent) quiet(f); }, true);
  document.addEventListener('focusout', e => { const f = fieldOf(e.target); if (f) loud(f); }, true);
  ['keydown', 'dblclick'].forEach(type => addEventListener(type, () => { intent = true; setTimeout(() => { intent = false; }); }, true));
  // No click (and so no focus or selection of the browser's own) after a finger on a field: the tap is handled here.
  document.addEventListener('touchend', e => { if (fieldTouch && e.cancelable) e.preventDefault(); fieldTouch = false; }, { capture: true, passive: false });
  function typeIn(f, x, y) {
    const now = performance.now(), again = lastTap?.f === f && now - lastTap.t < 400 && Math.hypot(x - lastTap.x, y - lastTap.y) < 24 / scale();
    lastTap = again ? null : { f, t: now, x, y };
    // Focused quietly: focus it again from this tap, so the keyboard comes up.
    if (loud(f) && document.activeElement === f) f.blur();
    intent = true;
    try { f.focus({ preventScroll: true }); } finally { intent = false; }
    const p = document.caretPositionFromPoint?.(x, y), word = /[\p{L}\p{N}_]/u;
    if (f.setSelectionRange) {
      if (p?.offsetNode !== f) return;
      let s = p.offset, end = s;
      if (again) { const v = f.value; while (s > 0 && word.test(v[s - 1])) s--; while (end < v.length && word.test(v[end])) end++; }
      try { f.setSelectionRange(s, end); } catch (_) { }   // email and number fields have no selection
      return;
    }
    const r = p ? document.createRange() : document.caretRangeFromPoint?.(x, y);
    if (p) r.setStart(p.offsetNode, p.offset);
    if (!r || !f.contains(r.startContainer)) return;
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    if (again) { sel.modify('move', 'backward', 'word'); sel.modify('extend', 'forward', 'word'); }
  }

  // Hold anywhere (about 130 ms, no movement needed), flick, let go. In text, a hold waits longer and a drag
  // stays a text selection; the right button held works too, and a quick right click is still a right click.
  const busy = t => t.closest('a, button, input, select, label, summary, video, .win-bar, .rz, .taskbar, .start, .toast, .lock, .os-ring, .os-icon, .p2, [data-no-ring]');
  let eatMenu = false, touchDown = false;
  addEventListener('pointerdown', e => {
    // A finger's long press is the ring's or nothing, never the browser's link or image menu or text selection.
    touchDown = finger = e.pointerType === 'touch';
    const field = finger && fieldOf(e.target);
    fieldTouch = !!field;
    if (field) e.preventDefault();
    // A ring opened by a button or the keyboard waits for one click: on a slice it runs it, anywhere else it closes.
    if (mode === 'sticky') {
      e.preventDefault(); e.stopPropagation();
      addEventListener('pointerup', ev => {
        // The click that follows must not reach whatever is under the ring.
        const eat = c => { c.preventDefault(); c.stopPropagation(); };
        addEventListener('click', eat, { capture: true, once: true });
        setTimeout(() => removeEventListener('click', eat, true), 0);
        if (!ring.tap(ev.clientX, ev.clientY)) home();
      }, { capture: true, once: true });
      return;
    }
    if (startOpen && !e.target.closest('.start, .tb-start, .tb-search')) closeStart();
    if (!e.target.closest('.os-fence.is-open')) folder(null);
    if (!e.target.closest('.win, .taskbar, .start, .os-icon')) { blurAll(); select(null); }
    if (mode || $('#lock').classList.contains('is-on')) return;
    const t = e.target, right = e.button === 2, touch = e.pointerType === 'touch';
    // A finger on a text field: the ring as anywhere (even where a mouse would not get it), or a tap to type.
    if ((e.button !== 0 && !right) || (!field && busy(t))) return;
    // A press on a scrollbar is a scroll.
    if (t.clientWidth && (e.offsetX > t.clientWidth || e.offsetY > t.clientHeight)) return;
    const editable = t.closest('textarea, [contenteditable="true"]');
    const winEl = t.closest('.win');
    press = { x: e.clientX, y: e.clientY, w: winEl ? wins.get(winEl.dataset.app) : null, touch, right, field, strict: !!winEl || touch };
    // A finger opens it before the phone's own long press (text selection, the link menu) at about 500 ms.
    holdTimer = setTimeout(() => { if (press) { if (right) eatMenu = true; openRing(press.w, { x: press.x, y: press.y }, 'hold'); } }, touch ? 330 : editable && !right ? 350 : 130);
  }, true);
  // Anything that scrolls while a finger waits is a scroll, not a hold.
  addEventListener('scroll', () => { if (press && !mode) { clearTimeout(holdTimer); press = null; } }, true);
  addEventListener('pointermove', e => {
    if (press && !mode && press.strict && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8 / scale()) { clearTimeout(holdTimer); press = null; }
    if (mode) return ring.pointer(e.clientX - shift.x, e.clientY - shift.y);
    if (e.buttons || e.target.closest('.win, .start, .taskbar, .os-icons')) ring.leave();
    else ring.pointer(e.clientX, e.clientY);
  });
  const release = e => {
    clearTimeout(holdTimer);
    if (mode !== 'hold') {
      // A finger let go of a field before the ring and without moving: it wants to type there.
      if (press?.field && e.type === 'pointerup') typeIn(press.field, e.clientX, e.clientY);
      press = null; return;
    }
    const x = e.clientX - shift.x, y = e.clientY - shift.y;
    const stay = () => { mode = 'sticky'; press = null; shift = { x: 0, y: 0 }; html.classList.remove('os-ringing'); setTimeout(() => ring.el.focus({ preventScroll: true }), 60); };
    // Let go before the ring got there: it simply goes home. A cancelled touch (the browser took it for a scroll or
    // a gesture of its own) never runs a slice. On a parent slice (or a bubble whose ring is out) the ring stays for
    // a click, as the app does.
    if (ring.held && e.type === 'pointerup' && ring.tap(x, y, 'release') === 'stay') return stay();
    home();
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('contextmenu', e => { if (eatMenu || mode || touchDown) { e.preventDefault(); eatMenu = false; } });
  document.addEventListener('mouseleave', () => { if (!mode) ring.leave(); });
  // While the ring is held a finger must not scroll the page under it (nor pull to refresh).
  document.addEventListener('touchmove', e => { if (mode === 'hold' && e.cancelable) e.preventDefault(); }, { passive: false });

  addEventListener('keydown', e => {
    if ($('#lock').classList.contains('is-on')) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') unlock(); return; }
    // Ctrl+Shift+Space, RadialDeck's own default: the ring of the window in front; arrows pick, Enter runs.
    if (e.code === 'Space' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (mode) return home();
      const w = focused;
      return openRing(w, w ? ringPoint(w) : { x: innerWidth / 2, y: (innerHeight - TASKBAR) / 2 }, 'sticky');
    }
    if (e.key === 'Escape') {
      if (mode) { e.preventDefault(); return home(); }
      if (startOpen) { closeStart(); $('.tb-start', tbApps).focus(); return; }
      // Esc closes the window in front, as a dialog does: not from a text field (what was typed would go) and not
      // when the app used the key itself (apps stop or prevent it).
      const a = document.activeElement;
      if (focused && !e.defaultPrevented && focused.el.contains(a) && !a.closest('input, textarea, select, [contenteditable="true"]')) { e.preventDefault(); close(focused.id); }
    }
  });

  // ---- Dark/Light (wallpaper and windows, remembered) and the ring's theme ----
  function setNight(on = !body.classList.contains('is-night')) { body.classList.toggle('is-night', on); store.set('night', on); }
  // The live ring's look: any theme in themes.js, dark or light variant. Remembered across pages.
  let ringTheme = { id: 'glass', variant: 'dark' };
  function setRingTheme(id, variant = ringTheme.variant) {
    const t = RDRing.THEMES.find(x => x.id === id);
    if (!t) return ringTheme;
    ringTheme = { id: t.id, variant: variant === 'light' ? 'light' : 'dark' };
    RDRing.themeRing(ring.el, t[ringTheme.variant]);
    ring.el.classList.toggle('is-themed', t.id !== 'glass' || ringTheme.variant !== 'dark');
    store.set('ringTheme', ringTheme);
    dispatchEvent(new CustomEvent('os:ringtheme', { detail: ringTheme }));
    return ringTheme;
  }
  // Scroll an element into view inside its window only (scrollIntoView would also move the fixed desktop).
  function reveal(el, center) {
    let p = el?.parentElement;
    while (p && !(p.scrollHeight > p.clientHeight && /auto|scroll/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
    if (!p || p === document.body || p === html) return;
    const off = el.getBoundingClientRect().top - p.getBoundingClientRect().top;
    p.scrollTo({ top: p.scrollTop + off - (center ? (p.clientHeight - el.offsetHeight) / 2 : 12), behavior: reduce ? 'auto' : 'smooth' });
  }
  // Share a link: a phone's share sheet (this desktop in the laptop on a phone), else the clipboard and a toast.
  async function share(url, title = document.title) {
    url = new URL(url, location.href).href;
    if (html.classList.contains('os-laptop') && navigator.share) { try { await navigator.share({ title, url }); return; } catch (_) { return; } }
    try { await navigator.clipboard.writeText(url); toast('Link copied', url); } catch (_) { toast('Copy this link', url); }
  }

  // ---- What the Everyday ring does to this desktop ----
  let toastTimer = 0;
  function toast(head, text = '', icon = 'assets/icon.png') {
    const t = $('#toast');
    t.querySelector('img').src = icon || 'assets/icon.png'; t.querySelector('b').textContent = head; t.querySelector('span').textContent = text;
    t.classList.add('is-on'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
  }
  function snip(head, text) {
    const s = $('#snip'), box = s.querySelector('i');
    const r = (focused ? focused.el.querySelector('.win-body') : $('#title')).getBoundingClientRect();
    Object.assign(box.style, { left: r.left + 10 + 'px', top: r.top + 8 + 'px', width: '0px', height: '0px' });
    s.classList.add('is-on');
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(box.style, { width: Math.min(r.width - 20, 420) + 'px', height: Math.min(r.height - 16, 160) + 'px' })));
    setTimeout(() => { const f = $('#flash'); f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on'); s.classList.remove('is-on'); toast(head, text); }, 700);
  }
  let hidden = [];
  function showDesktop() {
    const open = [...wins.values()].filter(w => !w.min);
    if (open.length) { hidden = open; open.forEach(minimize); }
    else { hidden.filter(w => wins.has(w.id)).forEach(restore); hidden = []; }
  }
  let muted = false;
  function mute() { muted = !muted; speaker(); toast(muted ? 'Muted' : 'Sound on', muted ? 'Pick Mute again to bring the sound back.' : 'Volume 64%'); media(); }
  function speaker() { $('#speaker').innerHTML = svg(muted ? IC.mute : IC.sound); }
  function lock() {
    const now = new Date(), l = $('#lock');
    $('#lock-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    $('#lock-date').textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    l.classList.remove('is-leaving'); l.classList.add('is-on'); l.setAttribute('aria-hidden', 'false');
    l.tabIndex = 0; setTimeout(() => l.focus(), 50);
  }
  function unlock() { const l = $('#lock'); l.classList.add('is-leaving'); l.setAttribute('aria-hidden', 'true'); setTimeout(() => l.classList.remove('is-on', 'is-leaving'), 550); }
  $('#lock').addEventListener('click', unlock);
  async function emptyBin() {
    const app = apps.get('bin');
    if (app) await need(app);
    if (app?.empty) return app.empty();   // the Recycle Bin app (os/apps/bin.js) knows what is in it
    const b = $('#bin');
    if (b.classList.contains('is-empty')) return toast('Recycle Bin', 'It is already empty.');
    b.classList.add('is-empty', 'is-shake'); setTimeout(() => b.classList.remove('is-shake'), 520);
    toast('Recycle Bin emptied', '214 items, 1.2 GB freed.');
  }
  function binInfo() { toast('Recycle Bin', $('#bin').classList.contains('is-empty') ? 'Empty.' : '214 items. Hold the mouse anywhere and flick to Empty bin.'); }
  let playing = false;
  function play() { playing = !playing; $('#playing').classList.toggle('is-on', playing); media(); }
  // Play and Mute are the desktop's: an app that plays (os/apps/music.js) calls OS.media and listens for os:media.
  const media = () => dispatchEvent(new CustomEvent('os:media', { detail: { playing, muted } }));

  function clock() {
    const now = new Date(), t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    $('#clock').textContent = t;
    $('#date').textContent = now.toLocaleDateString();
  }
  function stars() {
    const c = $('.stars'), d = devicePixelRatio || 1, w = innerWidth, h = innerHeight;
    c.width = w * d; c.height = h * d;
    const g = c.getContext('2d'); g.scale(d, d);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < Math.round(w * h / 4200); i++) {
      g.globalAlpha = .25 + rnd() * .75; g.fillStyle = '#fff';
      g.beginPath(); g.arc(rnd() * w, rnd() * h * .7, .3 + rnd() * 1.1, 0, 7); g.fill();
    }
  }

  // ---- A new screen size: windows stay reachable ----
  function layout() {
    for (const w of wins.values()) {
      if (w.g) { const a = area(); w.g.x = clamp(w.g.x, -w.g.w + 120, a.w - 120); w.g.y = clamp(w.g.y, 0, a.h - 48); }
      place(w);
    }
    ring.wake();
  }
  let resizeRaf = 0;
  addEventListener('resize', () => { if (!mobile && !resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; layout(); stars(); }); });

  // Scripts an app needs only once it opens (features.js for the Features demos), and the apps' own scripts and styles.
  const loaded = new Map();
  function load(src) {
    if (!loaded.has(src)) loaded.set(src, new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.append(s); }));
    return loaded.get(src);
  }
  function style(href) {
    if (!loaded.has(href)) loaded.set(href, $(`link[href="${href}"]`) ? Promise.resolve()
      : new Promise(ok => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href, onload: ok, onerror: ok }))));
    return loaded.get(href);
  }

  function start() {
    if (mobile) return;   // a phone: the laptop page (os/mobile.js) runs this desktop in its laptop instead
    layout();
    if (store.get('night')) body.classList.add('is-night');
    const rt = store.get('ringTheme');
    if (rt?.id) setRingTheme(rt.id, rt.variant);
    ring.set(EVERYDAY, DESK_HUB);
    taskbar(); speaker(); clock(); setInterval(clock, 15000); stars();
    setTimeout(() => ring.open(), 250);
    // A first visit: once the ring is home, Apps lights by itself for a moment and its bubbles come out and go home,
    // so the new trick shows itself. Not over a window, not while the mouse is already on the ring, not with less motion.
    if (!store.get('bubblesSeen') && !reduce) setTimeout(() => {
      const a = $('#anchor').getBoundingClientRect();
      if (mode || ring.hot >= 0 || !a.width || [...wins.values()].some(w => !w.min)) return;
      store.set('bubblesSeen', true);
      peeking = true;
      ring.pointer(a.left + a.width / 2, a.top + a.height * .17);
      setTimeout(() => { if (!mode && ring.hot === 0 && ring.bubbles.hot < 0) ring.leave(); peeking = false; }, 1900);
    }, 1500);
    // Deep links: the page's own app (features.html), ?app=notepad, or #pricing / #faq from the old landing page.
    const q = new URLSearchParams(location.search).get('app'), hash = location.hash.slice(1);
    const first = body.dataset.open || (apps.has(q) ? q : aliases.get(hash));
    if (first) open(first, { hash, params: Object.fromEntries(new URLSearchParams(location.search)) });
  }

  return {
    register, open, close, load, toast, lock, svg, icons: IC, start, setNight, setRingTheme, share, reveal,
    get ringTheme() { return { ...ringTheme }; },
    focus: id => focus(wins.get(id)), minimize: id => minimize(wins.get(id)),
    // phone: this is the phone page (os/mobile.js), where the desktop does not run: apps leave their first-visit
    // windows, cards and players to the desktop in its laptop.
    get focused() { return focused?.ctx || null; }, phone: mobile,
    apps, ring,
    media: { play, mute, get playing() { return playing; }, get muted() { return muted; } },
  };
})();
