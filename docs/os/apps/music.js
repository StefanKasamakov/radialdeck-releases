/* Music: a pretend player (made-up tracks, drawn covers, no sound) for the gallery's media recipes: Play/Pause, Next,
   Prev, Vol +, Vol −, Mute, Shuffle, Repeat. Play and Mute are the desktop's own (OS.media), so the Everyday ring,
   the taskbar's "playing" and the tray's speaker agree with this window. */
(() => {
  const TRACKS = [
    { title: 'Lumen Drift', artist: 'Northbound Tapes', len: 214, hue: 210 },
    { title: 'Paper Satellites', artist: 'Velvet Atlas', len: 187, hue: 330 },
    { title: 'Slow Orbit', artist: 'Quiet Harbour Club', len: 242, hue: 265 },
    { title: 'Coastline, 6 AM', artist: 'Oda & the Lamps', len: 198, hue: 190 },
    { title: 'Glass Garden', artist: 'Northbound Tapes', len: 231, hue: 150 },
    { title: 'Night Bus', artist: 'Oda & the Lamps', len: 176, hue: 25 },
    { title: 'Static Bloom', artist: 'Velvet Atlas', len: 205, hue: 290 },
    { title: 'Long Way Home', artist: 'Quiet Harbour Club', len: 263, hue: 45 },
  ];
  const st = { i: 0, pos: 0, vol: 64, shuffle: false, repeat: 'off' };
  let M = null, timer = 0, osd = null, osdT = 0;
  const media = () => OS.media || { playing: false, muted: false, play() { }, mute() { } };
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const P = {
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>', pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor"/>',
    next: '<path d="m5 4 10 8-10 8z" fill="currentColor"/><path d="M19 5v14"/>', prev: '<path d="m19 20-10-8 10-8z" fill="currentColor"/><path d="M5 19V5"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>',
    up: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    down: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  };
  // A cover per track: shapes in the track's colour, no artwork of anyone's.
  function cover(t, big) {
    const h = t.hue, id = big ? 'b' : 's';
    return `<svg viewBox="0 0 100 100" aria-hidden="true" class="mu-cover-${id}"><rect width="100" height="100" fill="hsl(${h} 55% 22%)"/>`
      + `<circle cx="${30 + (h % 40)}" cy="38" r="30" fill="hsl(${h} 80% 62%)" opacity=".85"/><circle cx="72" cy="${62 - (h % 20)}" r="22" fill="hsl(${(h + 50) % 360} 85% 68%)" opacity=".75"/>`
      + `<path d="M0 78c18-10 34-10 50 0s32 10 50 0v22H0z" fill="hsl(${(h + 200) % 360} 50% 14%)" opacity=".8"/></svg>`;
  }
  const cur = () => TRACKS[st.i];

  function tick() {
    clearInterval(timer);
    if (!media().playing) return;
    timer = setInterval(() => { st.pos += 1; if (st.pos >= cur().len) ended(); paint(); }, 1000);
  }
  function ended() {
    if (st.repeat === 'one') { st.pos = 0; return; }
    if (!st.shuffle && st.i === TRACKS.length - 1 && st.repeat === 'off') { st.pos = 0; media().play(); return; }
    step(1, true);
  }
  function step(d, auto) {
    if (d < 0 && st.pos > 3 && !auto) { st.pos = 0; return paint(); }
    st.i = st.shuffle ? (st.i + 1 + Math.floor(Math.random() * (TRACKS.length - 1))) % TRACKS.length : (st.i + d + TRACKS.length) % TRACKS.length;
    st.pos = 0;
    if (!media().playing) media().play(); else paint(true);
  }
  function playTrack(i) { st.i = i; st.pos = 0; if (!media().playing) media().play(); else paint(true); }
  function volume(d) {
    if (media().muted) media().mute();
    st.vol = Math.max(0, Math.min(100, st.vol + d));
    flyout();
    paint();
  }
  // Windows 11's volume flyout, over the taskbar.
  function flyout() {
    if (!osd) { osd = document.createElement('div'); osd.className = 'mu-osd'; osd.setAttribute('aria-hidden', 'true'); document.body.append(osd); }
    const m = media().muted;
    osd.innerHTML = `${OS.svg(m ? OS.icons.mute : st.vol > 50 ? P.up : P.down)}<i style="--v:${m ? 0 : st.vol}%"></i><b>${m ? 0 : st.vol}</b>`;
    osd.classList.add('is-on'); clearTimeout(osdT); osdT = setTimeout(() => osd.classList.remove('is-on'), 1400);
  }
  function tray() {
    const p = document.getElementById('playing');
    const s = p?.querySelector('span');
    if (s) s.textContent = `${cur().title} · ${cur().artist}`;
  }

  function paint(newTrack) {
    tray();
    if (!M) return;
    const t = cur(), on = media().playing, m = media().muted;
    M.root.classList.toggle('is-playing', on);
    if (newTrack || M.shown !== st.i) {
      M.shown = st.i;
      M.art.innerHTML = cover(t, true); M.mini.innerHTML = cover(t);
      M.title.textContent = t.title; M.artist.textContent = t.artist;
      M.bar.querySelector('b').textContent = t.title; M.bar.querySelector('small').textContent = t.artist;
      M.art.animate?.([{ transform: 'scale(.94)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    M.list.querySelectorAll('.mu-row').forEach((r, i) => r.classList.toggle('is-cur', i === st.i));
    M.playBtn.innerHTML = OS.svg(on ? P.pause : P.play); M.playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    M.bigPlay.innerHTML = OS.svg(on ? P.pause : P.play);
    M.shuf.classList.toggle('is-on', st.shuffle); M.shuf.setAttribute('aria-pressed', st.shuffle);
    M.rep.classList.toggle('is-on', st.repeat !== 'off'); M.rep.dataset.one = st.repeat === 'one' ? '1' : ''; M.rep.setAttribute('aria-label', `Repeat: ${st.repeat}`);
    M.pos.textContent = mmss(st.pos); M.len.textContent = mmss(t.len);
    M.seek.style.setProperty('--p', (st.pos / t.len * 100).toFixed(2) + '%');
    M.vol.style.setProperty('--p', (m ? 0 : st.vol) + '%');
    M.volIc.innerHTML = OS.svg(m ? OS.icons.mute : st.vol > 50 ? P.up : P.down);
  }
  addEventListener('os:media', () => { tick(); paint(); });

  // The gallery's media recipes, labels as there.
  const RING = [
    { label: 'Play/Pause', icon: 'playpause', tint: '#6ee7a0', say: 'Plays or pauses whatever is playing.', run: () => media().play() },
    { label: 'Next', icon: P.next, tint: '#7cc4ff', say: 'Next track.', run: () => step(1) },
    { label: 'Vol +', icon: P.up, tint: '#ffd166', say: 'Volume up. Three steps.', run: () => volume(6) },
    { label: 'Mute', icon: 'mute', tint: '#ff6b6b', say: 'Mutes the sound, and unmutes it again.', run: () => { media().mute(); flyout(); } },
    { label: 'Vol −', icon: P.down, tint: '#fdba74', say: 'Volume down. Three steps.', run: () => volume(-6) },
    { label: 'Prev', icon: P.prev, tint: '#a5b4fc', say: 'Previous track (or the start of this one).', run: () => step(-1) },
    { label: 'Shuffle', icon: P.shuffle, tint: '#c4a1ff', say: 'Toggle shuffle.', run: () => { st.shuffle = !st.shuffle; paint(); OS.toast('Shuffle', st.shuffle ? 'On' : 'Off', 'os/icons/music.svg'); } },
    { label: 'Repeat', icon: P.repeat, tint: '#5eead4', say: 'Toggle repeat: all, one, off.', run: () => { st.repeat = { off: 'all', all: 'one', one: 'off' }[st.repeat]; paint(); OS.toast('Repeat', { all: 'The whole playlist', one: 'This song', off: 'Off' }[st.repeat], 'os/icons/music.svg'); } },
  ];
  OS.register({
    id: 'music',
    tint: '#4ade80',
    render(body, c) {
      M = c;
      body.innerHTML = `<div class="mu os-dark">
        <aside class="mu-lib"><b>Your Library</b>
          <button type="button" class="is-on"><span class="mu-pl" style="--h:210"></span><span>Focus mix<small>Playlist · 8 songs</small></span></button>
          <button type="button" disabled><span class="mu-pl" style="--h:25"></span><span>Evening<small>Playlist · 14 songs</small></span></button>
          <button type="button" disabled><span class="mu-pl" style="--h:150"></span><span>Road trip<small>Playlist · 22 songs</small></span></button>
          <p class="mu-note">A pretend player: the songs and covers are made up, and it makes no sound. The ring is the real thing.</p>
        </aside>
        <main class="mu-main">
          <header class="mu-hero"><div class="mu-art"></div><div><small>Playlist</small><h3>Focus mix</h3><p><b class="mu-title"></b> · <span class="mu-artist"></span></p>
            <div class="mu-acts"><button type="button" class="mu-big" aria-label="Play"></button><div class="mu-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div></div></header>
          <div class="mu-list">${TRACKS.map((t, i) => `<div class="mu-row" data-i="${i}" role="button" tabindex="0" aria-label="Play ${t.title}"><span class="mu-no"><em>${i + 1}</em><span class="mu-eq"><i></i><i></i><i></i></span></span>${cover(t)}<span class="mu-tt"><b>${t.title}</b><small>${t.artist}</small></span><span class="mu-len">${mmss(t.len)}</span></div>`).join('')}</div>
        </main>
        <footer class="mu-bar">
          <div class="mu-now"><span class="mu-mini"></span><span><b></b><small></small></span></div>
          <div class="mu-ctl">
            <div class="mu-btns">
              <button type="button" class="mu-shuf" aria-label="Shuffle">${OS.svg(P.shuffle)}</button>
              <button type="button" class="mu-prev" aria-label="Previous">${OS.svg(P.prev)}</button>
              <button type="button" class="mu-play" aria-label="Play"></button>
              <button type="button" class="mu-next" aria-label="Next">${OS.svg(P.next)}</button>
              <button type="button" class="mu-rep" aria-label="Repeat">${OS.svg(P.repeat)}</button>
            </div>
            <div class="mu-seekrow"><small class="mu-pos"></small><div class="mu-seek mu-track" data-no-ring><i></i></div><small class="mu-len2"></small></div>
          </div>
          <div class="mu-volrow"><button type="button" class="mu-volic" aria-label="Mute"></button><div class="mu-vol mu-track" data-no-ring><i></i></div></div>
        </footer>
      </div>`;
      const $ = s => body.querySelector(s);
      Object.assign(c, { root: $('.mu'), art: $('.mu-art'), mini: $('.mu-mini'), title: $('.mu-title'), artist: $('.mu-artist'), bar: $('.mu-now'), list: $('.mu-list'),
        playBtn: $('.mu-play'), bigPlay: $('.mu-big'), shuf: $('.mu-shuf'), rep: $('.mu-rep'), pos: $('.mu-pos'), len: $('.mu-len2'), seek: $('.mu-seek'), vol: $('.mu-vol'), volIc: $('.mu-volic') });
      c.playBtn.onclick = c.bigPlay.onclick = () => media().play();
      $('.mu-next').onclick = () => step(1); $('.mu-prev').onclick = () => step(-1);
      c.shuf.onclick = () => RING[6].run(); c.rep.onclick = () => RING[7].run(); c.volIc.onclick = () => media().mute();
      c.list.addEventListener('click', e => { const r = e.target.closest('.mu-row'); if (r) playTrack(+r.dataset.i); });
      // Rows are not buttons, so a hold on one opens the ring (the shell never starts a hold on a button).
      c.list.addEventListener('keydown', e => { const r = e.target.closest('.mu-row'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playTrack(+r.dataset.i); } });
      const drag = (el, fn) => el.addEventListener('pointerdown', e => {
        const set = ev => { const b = el.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (ev.clientX - b.left) / b.width))); paint(); };
        set(e); el.setPointerCapture(e.pointerId);
        el.onpointermove = ev => ev.buttons && set(ev);
      });
      drag(c.seek, q => { st.pos = Math.round(q * cur().len); });
      drag(c.vol, q => { if (media().muted) media().mute(); st.vol = Math.round(q * 100); });
      paint(true);
    },
    onOpen(c, args) { if (args.track != null) playTrack(args.track); },
    onClose() { M = null; },
    ring: RING,
  });
  tray();
  window.OSMusic = { tracks: TRACKS };
})();
