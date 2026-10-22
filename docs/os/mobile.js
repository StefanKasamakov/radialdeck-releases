/* The phone page (html.os-mobile, set in the page's head; the look is os/mobile.css). RadialDeck runs on Windows, so a
   phone gets an honest page, and the desktop itself runs inside its laptop: this same page with ?frame=laptop, in an
   iframe that loads on the first tap and never moves (so it never reloads). Tapped, the laptop's screen fills the
   phone: Android gets real full screen and landscape; an iPhone (no element full screen) gets the same box fixed over
   the page, turned 90 degrees while the phone is held upright. Back (gesture or button) and the close button leave it.

   The desktop is laid out at a believable size and scaled: 1024 x 640 in the page, 560 tall and as wide as the phone
   in full screen. The scale goes to the desktop as --os-k (os.js keeps a finger's slop in the phone's pixels). */
(() => {
  const html = document.documentElement;
  if (!html.classList.contains('os-mobile')) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#mb-stage'), scr = $('.mb-screen', stage), poster = $('.mb-poster', stage);
  const PAGE = { w: 1024, h: 640 }, FULL_H = 560;   // build/laptop-poster.mjs pictures PAGE
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
  let frame = null, full = false;

  // ---- The live desktop: this page as ?frame=laptop (no phone page, no second visit counted, see build/stats.py) ----
  function urlOf(link) {
    const u = new URL(link || location.href, location.href);
    u.searchParams.set('frame', 'laptop');
    return u.pathname + u.search + u.hash;
  }
  function load(link) {
    if (frame) {
      // Already running: open what the link points at in it.
      const u = link && new URL(link, location.href), os = frame.contentWindow?.OS;
      const app = u && (u.searchParams.get('app') || [...(os?.apps.values() || [])].find(a => a.url && u.pathname.endsWith('/' + a.url))?.id);
      if (app) os.open(app, { hash: u.hash.slice(1), params: Object.fromEntries(u.searchParams) });
      return;
    }
    frame = document.createElement('iframe');
    frame.title = 'The RadialDeck desktop, running in the laptop';
    frame.src = urlOf(link);
    stage.classList.add('is-loading');
    // The picture stays until the desktop has painted (fonts and all), then the live one takes its place.
    frame.addEventListener('load', () => { fit(); setTimeout(() => { stage.classList.remove('is-loading'); poster.hidden = true; }, 250); }, { once: true });
    scr.append(frame);
    fit();
  }

  // ---- Fit: the screen box (turned when needed), the desktop's size and scale ----
  function fit() {
    const bw = stage.clientWidth, bh = stage.clientHeight;
    if (!bw || !bh) return;
    const turn = full && bh > bw;   // full screen held upright: the screen turns, the phone becomes a landscape laptop
    const sw = turn ? bh : bw, sh = turn ? bw : bh;
    Object.assign(scr.style, { width: sw + 'px', height: sh + 'px', transform: turn ? `translate(${bw}px, 0) rotate(90deg)` : '' });
    if (!frame) return;
    const s = full ? sh / FULL_H : sw / PAGE.w, w = full ? Math.round(sw / s) : PAGE.w, h = full ? FULL_H : PAGE.h;
    Object.assign(frame.style, { width: w + 'px', height: h + 'px', transform: `scale(${s})` });
    // On the page the laptop is a picture of the desktop: a finger scrolls the page past it, and a tap opens it.
    frame.style.pointerEvents = full ? '' : 'none';
    try { frame.contentDocument.documentElement.style.setProperty('--os-k', s.toFixed(4)); } catch (_) { }
  }
  new ResizeObserver(fit).observe(stage);
  addEventListener('orientationchange', () => setTimeout(fit, 250));

  // ---- Full screen in, and out by the close button, Back, or the system leaving full screen ----
  async function open(link) {
    if (full) return load(link);
    full = true;
    load(link);
    stage.classList.add('is-full'); html.classList.add('mb-full');
    history.pushState({ mbFull: 1 }, '');
    pauseClips();
    fit();
    try {
      if (stage.requestFullscreen) { await stage.requestFullscreen({ navigationUI: 'hide' }); await screen.orientation?.lock?.('landscape'); }
    } catch (_) { /* iPhone, or no orientation lock: the turned box does it */ }
    fit();
    frame?.focus();
  }
  function close(fromHistory) {
    if (!full) return;
    full = false;
    stage.classList.remove('is-full'); html.classList.remove('mb-full');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    try { screen.orientation?.unlock?.(); } catch (_) { }
    if (!fromHistory && history.state?.mbFull) history.back();
    fit();
  }
  stage.addEventListener('click', e => { if (e.target.closest('.mb-close')) close(false); else if (!full) open(); });
  addEventListener('popstate', () => close(true));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && full) close(false); else fit(); });
  // Links on the page to a part of the desktop (the clips) open it in the laptop.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-mb-app]');
    if (!a || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    open(a.href);
  });

  // ---- "Send the link to my PC": phone.js on a phone; a narrow desktop window copies the link ----
  if (!html.classList.contains('is-mobile')) document.addEventListener('click', async e => {
    const b = e.target.closest('[data-send-pc]');
    if (!b) return;
    try { await navigator.clipboard.writeText('https://radialdeck.com/'); b.textContent = 'Link copied'; } catch (_) { b.textContent = 'radialdeck.com'; }
  });

  // ---- Clips: the posters come only here (not on a desktop), the bubbles clip plays while it is in view ----
  $$('.mb video[data-poster]').forEach(v => { v.poster = v.dataset.poster; });
  const next = $('.mb-next video');
  function pauseClips() { $$('.mb video').forEach(v => v.pause()); }
  if (next && !still) new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !full) { if (!next.src) next.src = next.dataset.src; next.play().catch(() => { }); } else next.pause();
  }, { threshold: .5 }).observe(next);
  // One clip with sound at a time.
  $$('.mb-clips video').forEach(v => v.addEventListener('play', () => $$('.mb video').forEach(o => o !== v && o.pause())));
})();
