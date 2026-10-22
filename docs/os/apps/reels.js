/* Reels: RadialDeck's short clips, one at a time in a phone-shaped window. Scroll, swipe, the wheel or the arrow keys
   for the next; muted until you ask for sound; the clip loops. Also drives the desktop's reel player (a phone on the
   right) and the phone home screen's row, both written into the page by build/site-os.py.
   The clips are site/assets/reels/reels.json: append one there (see site/os/README.md) and it shows up everywhere. */
(() => {
  const STORE = 'https://radialdeck.com/store?cid=reels';
  // Reduced motion: nothing starts by itself. Save-Data: the desktop player stays a poster, the app waits for a tap.
  const auto = !RingLive.reduce && !navigator.connection?.saveData;
  let clips = null;
  const list = () => clips ||= fetch('assets/reels/reels.json').then(r => r.json()).catch(() => []);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const I = {
    prev: '<path d="m18 15-6-6-6 6"/>', next: '<path d="m6 9 6 6 6-6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  };

  let R = null;   // the open window: { root, feed, slides, videos, i, muted, ... }
  const cur = () => R?.clips[R.i];
  const vid = () => R?.videos[R.i];

  function slide(c, i, n) {
    return `<section class="rl-slide is-paused" data-i="${i}" aria-label="${esc(c.title)} (${i + 1} of ${n})">
      <div class="rl-stage"><video src="${esc(c.file)}" poster="${esc(c.poster)}" preload="none" muted loop playsinline disablepictureinpicture></video>
        <div class="rl-tap"></div><span class="rl-big" aria-hidden="true">${OS.svg(I.play)}</span></div>
      <i class="rl-bar" aria-hidden="true"><b></b></i>
      <div class="rl-info"><div><h3>${esc(c.title)}</h3><p>${esc(c.caption)}</p></div>
        <div class="rl-acts"><button class="rl-share" type="button" aria-label="Share this clip" title="Share this clip">${OS.svg(I.share)}</button><a class="rl-get" href="${STORE}">Get it</a></div></div>
    </section>`;
  }

  function setCur(i) {
    if (!R || i === R.i && R.started) return;
    R.i = i; R.started = true; R.userPaused = false;
    R.videos.forEach((v, j) => {
      // Only this clip and the next one load; the rest wait with preload="none".
      v.preload = auto && (j === i || j === (i + 1) % R.videos.length) ? 'auto' : 'none';
      if (j !== i && !v.paused) v.pause();
    });
    R.count.textContent = `${i + 1} / ${R.videos.length}`;
    if (auto) play();
  }
  function play() { const v = vid(); if (!v) return; v.muted = R.muted; v.play().catch(() => { }); }
  function togglePlay() { const v = vid(); if (!v) return; if (v.paused) { R.userPaused = false; play(); } else { R.userPaused = true; v.pause(); } }
  function mute(on = !R.muted) {
    R.muted = on;
    R.videos.forEach(v => v.muted = on);
    if (!on && vid()?.paused && !R.userPaused) play();
    R.sound.classList.toggle('is-on', !on);
    R.sound.setAttribute('aria-pressed', String(!on));
    R.sound.innerHTML = `${OS.svg(OS.icons[on ? 'mute' : 'sound'])}<span>${on ? 'Tap for sound' : 'Sound on'}</span>`;
  }
  function to(i, instant) {
    const n = R.videos.length;
    i = (i + n) % n;
    R.feed.scrollTo({ top: i * R.feed.clientHeight, behavior: instant || RingLive.reduce ? 'auto' : 'smooth' });
  }
  const go = d => to(R.i + d);
  function grid(show = R.grid.hidden) {
    R.grid.hidden = !show;
    if (show) { R.grid.querySelectorAll('button').forEach((b, j) => b.classList.toggle('is-cur', j === R.i)); R.grid.querySelector('.is-cur')?.focus({ preventScroll: true }); }
    else R.feed.focus({ preventScroll: true });
  }
  function full() {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (R.root.requestFullscreen) R.root.requestFullscreen().catch(() => { });
    else vid()?.webkitEnterFullscreen?.();
  }
  const share = () => cur() && OS.share(`./?app=reels&clip=${encodeURIComponent(cur().id)}`, `${cur().title} | RadialDeck`);

  async function render(body, ctx) {
    const all = await list();
    W.stop();
    // The page's heading stays, out of sight (screen readers, and search engines after the scripts ran).
    const h1 = body.querySelector('h1');
    body.innerHTML = `<div class="rl os-dark">
      <div class="rl-feed" tabindex="0" aria-label="Reels. Arrow keys or the wheel for the next clip.">${all.map((c, i) => slide(c, i, all.length)).join('')}</div>
      <span class="rl-count" aria-hidden="true"></span>
      <button class="rl-sound" type="button" aria-pressed="false" data-no-ring></button>
      <div class="rl-grid" hidden><header><b>All clips</b><button type="button" class="rl-grid-x" aria-label="Back to the clip">${OS.svg(OS.icons.close)}</button></header>
        <div>${all.map((c, i) => `<button type="button" data-i="${i}"><img src="${esc(c.poster.replace(/[^/]+$/, 'thumb/$&'))}" alt="" width="108" height="192" loading="lazy"><span>${esc(c.title)}</span></button>`).join('')}</div></div>
    </div>`;
    if (h1) { h1.className = 'sr-only'; body.prepend(h1); }
    const $ = s => body.querySelector(s);
    R = { clips: all, root: $('.rl'), feed: $('.rl-feed'), count: $('.rl-count'), sound: $('.rl-sound'), grid: $('.rl-grid'), i: 0, muted: true, started: false, userPaused: false };
    R.slides = [...body.querySelectorAll('.rl-slide')];
    R.videos = R.slides.map(s => s.querySelector('video'));
    mute(true);
    R.videos.forEach((v, j) => {
      const s = R.slides[j], bar = s.querySelector('.rl-bar b');
      v.addEventListener('play', () => s.classList.remove('is-paused'));
      v.addEventListener('pause', () => s.classList.add('is-paused'));
      v.addEventListener('timeupdate', () => { bar.style.transform = `scaleX(${v.duration ? v.currentTime / v.duration : 0})`; });
    });
    // Minimised (or sent home on a phone): the clip pauses, and plays on when the window comes back.
    R.mo = new MutationObserver(() => {
      if (ctx.el.classList.contains('is-min')) vid()?.pause();
      else if (auto && !R.userPaused && vid()?.paused) play();
    });
    R.mo.observe(ctx.el, { attributes: true, attributeFilter: ['class'] });
    // The clip that fills the window is the current one; one scrolled away pauses.
    R.io = new IntersectionObserver(es => es.forEach(e => {
      const i = +e.target.dataset.i;
      if (e.intersectionRatio >= .6) { if (i !== R.i || !R.started) setCur(i); else if (auto && !R.userPaused) play(); }
      else R.videos[i].pause();
    }), { root: R.feed, threshold: [0, .6] });
    R.slides.forEach(s => R.io.observe(s));
    // A new size (resize, maximise, full screen) keeps the same clip in view.
    let lastH = 0;
    R.ro = new ResizeObserver(() => {
      const h = R?.feed.clientHeight;
      if (lastH && h && h !== lastH) R.feed.scrollTo({ top: R.i * h });
      lastH = h;
    });
    R.ro.observe(R.feed);

    // A tap gives sound (or plays a paused clip); a hold is the ring's, so a long press is not a tap.
    let down = 0, finger = false;
    R.feed.addEventListener('pointerdown', e => { down = performance.now(); finger = e.pointerType === 'touch'; });
    R.feed.addEventListener('click', e => {
      if (e.target.closest('.rl-share')) return share();
      if (!e.target.closest('.rl-tap') || performance.now() - down > (finger ? 290 : 125)) return;   // a finger's ring waits 330 ms
      if (vid().paused) { R.userPaused = false; play(); } else mute();
    });
    // One clip per wheel gesture: a notch or a touchpad swipe moves one clip, however long its inertia runs.
    let wheelAt = 0;
    R.feed.addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelAt > 400 && Math.abs(e.deltaY) > 2) go(Math.sign(e.deltaY));
      wheelAt = now;
    }, { passive: false });
    R.sound.addEventListener('click', () => mute());
    R.grid.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      grid(false);
      if (b.dataset.i) to(+b.dataset.i, true);
    });
    ctx.el.addEventListener('keydown', e => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.target.closest('input, textarea')) return;
      const k = e.key, onBtn = e.target.closest('button, a');
      const act = { ArrowDown: () => go(1), PageDown: () => go(1), j: () => go(1), ArrowUp: () => go(-1), PageUp: () => go(-1), k: () => go(-1),
        m: () => mute(), f: () => full(), g: () => grid(), Escape: R.grid.hidden ? null : () => grid(false), ' ': () => !onBtn && togglePlay() }[k];
      if (!act || !R.grid.hidden && k !== 'Escape' && k !== 'g') return;
      if (k === ' ' && onBtn) return;
      e.preventDefault();
      act();
    });
  }

  OS.register({
    id: 'reels',
    tint: '#f472b6',
    render,
    onOpen(ctx, args) {
      W.stop();
      if (!R) return;
      const want = args.params?.clip || (args.hash?.startsWith('clip-') ? args.hash.slice(5) : '');
      const i = R.clips.findIndex(c => c.id === want);
      if (i >= 0) to(i, true);
      if (!R.grid.hidden) grid(false);
      R.feed.focus({ preventScroll: true });
    },
    onClose() {
      if (R) { R.io.disconnect(); R.ro.disconnect(); R.mo.disconnect(); R.videos.forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); }); }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      R = null;
      W.start();
    },
    // Previous up, Next down, as the clips go.
    ring: () => [
      { label: 'Previous', icon: I.prev, tint: '#a5b4fc', say: 'The clip before this one.', run: () => go(-1) },
      { label: R?.muted ? 'Unmute' : 'Mute', icon: R?.muted ? 'sound' : 'mute', tint: '#ff6b6b', say: R?.muted ? 'Turns the sound on.' : 'Turns the sound off.', run: () => mute() },
      { label: 'Share', icon: I.share, tint: '#7cc4ff', say: 'A link to this clip: the share sheet, or copied.', run: share },
      { label: 'Get it', icon: 'download', tint: '#6ee7a0', say: 'RadialDeck in the Microsoft Store. Free for two rings.', run: () => { const pc = document.querySelector('[data-send-pc]'); if (document.documentElement.classList.contains('is-mobile') && pc) pc.click(); else location.href = STORE; } },   // a phone sends the link to a PC (phone.js)
      { label: 'Next', icon: I.next, tint: '#a5b4fc', say: 'The next clip.', run: () => go(1) },
      { label: 'Full screen', icon: I.full, tint: '#ffd166', say: 'The clip fills the screen. Esc comes back.', run: full },
      { label: 'All clips', icon: I.grid, tint: '#c4a1ff', say: 'Every clip at once; pick one.', run: () => grid() },
      { label: vid() && !vid().paused ? 'Pause' : 'Play', icon: 'playpause', tint: '#5eead4', say: 'Plays or pauses this clip.', run: togglePlay },
    ],
  });

  // ---- The desktop's reel player: a phone on the right that plays the clips one after another, muted ----
  const W = (() => {
    const el = document.getElementById('os-reels'), frame = el?.querySelector('.os-reels-frame');
    const desk = matchMedia('(min-width: 1180px) and (min-height: 640px)');
    let v = null, i = 0, all = [];
    function show(n) {
      i = (n + all.length) % all.length;
      const c = all[i];
      v.poster = c.poster; v.src = c.file;
      frame.href = `reels.html?clip=${encodeURIComponent(c.id)}`;
      frame.querySelector('small').textContent = c.title;
      v.play().catch(() => { });
    }
    async function start() {
      if (!frame || !auto || !desk.matches || OS.phone || R || document.hidden) return stop();
      all = await list();
      if (!all.length || R) return;
      if (!v) {
        v = Object.assign(document.createElement('video'), { muted: true, defaultMuted: true, playsInline: true, preload: 'auto', className: 'os-reels-video' });
        v.setAttribute('aria-hidden', 'true');
        v.addEventListener('ended', () => show(i + 1));
        v.addEventListener('playing', () => frame.classList.add('is-playing'));
        frame.prepend(v);
        show(0);
      } else v.play().catch(() => { });
    }
    function stop() { v?.pause(); }
    desk.addEventListener('change', start);
    document.addEventListener('visibilitychange', start);
    // After the page has loaded: the clip never competes with the desktop's first paint.
    if (document.readyState === 'complete') setTimeout(start, 600); else addEventListener('load', () => setTimeout(start, 600), { once: true });
    return { start, stop };
  })();
})();
