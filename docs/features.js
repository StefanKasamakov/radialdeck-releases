/* RadialDeck feature showcase: short looping scenes drawn with the site's own ring (ring.js), plus
   the recorded GIFs. A scene plays only while it is on screen; with reduced motion it shows its
   last frame and stays still. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { I, svg, THEMES, themeRing, buildRing } = window.RDRing;

  // Lucide icons the landing page does not need.
  Object.assign(I, {
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    tabs: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M7 7V4h10v3"/>',
    skip: '<path d="m5 4 10 8-10 8zM19 5v14"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    sum: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    snow: '<path d="M2 12h20M12 2v20m-8-4 16-12M4 6l16 12"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
    pin: '<path d="M12 17v5M9 10.76V6h6v4.76a2 2 0 0 0 1.11 1.79l1.78.9A2 2 0 0 1 19 15.24V17H5v-1.76a2 2 0 0 1 1.11-1.79l1.78-.9A2 2 0 0 0 9 10.76"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>',
    keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-11z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M14.1 14.1a3 3 0 0 1-4.2-4.2"/>',
    gauge: '<path d="m12 14 4-4M3.3 19a10 10 0 1 1 17.4 0"/>',
    window: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  });

  const MAIN = [['Terminal', I.terminal], ['Browser', I.globe], ['Mail', I.mail], ['Notes', I.note],
                ['Snip', I.scissors], ['Calculator', I.calc], ['Music', I.music], ['Files', I.folder]];

  // ---- A stage: one ring plus the bits drawn around it -------------------------------------
  function stage(el, ring, hub) {
    const ringEl = el.querySelector('.ring');
    const labels = ringEl.querySelector('.ring-labels');
    const hubEl = ringEl.querySelector('.ring-hub span');
    const hud = el.querySelector('.stage-hud');
    const toast = el.querySelector('.stage-toast');
    const api = {
      el, ringEl,
      ring(slices, hubText) {
        buildRing(ringEl.querySelector('.ring-svg'), labels, { slices });
        hubEl.textContent = hubText || '';
        return api;
      },
      hot(i) {
        ringEl.querySelectorAll('.is-hot').forEach(n => n.classList.remove('is-hot'));
        if (i >= 0) ringEl.querySelectorAll(`[data-i="${i}"]`).forEach(n => n.classList.add('is-hot'));
      },
      keys(list) { if (hud) hud.innerHTML = list.map(k => `<kbd>${k}</kbd>`).join(''); },
      say(text) {
        if (!toast) return;
        toast.textContent = text || '';
        toast.classList.toggle('is-on', !!text);
      },
      show(on) { ringEl.classList.toggle('is-gone', !on); },
      reset() { api.hot(-1); api.keys([]); api.say(''); api.show(true); el.classList.remove('is-snip', 'is-offer'); },
    };
    return api.ring(ring, hub);
  }

  // Each scene: [build(el) -> stage, steps: [[ms, fn(stage)], …]]. The last step's state is what a
  // reduced-motion visitor sees.
  const SCENES = {
    adjust: [el => stage(el, [['Volume', I.volume], ['Zoom', I.zoom], ['Tabs', I.tabs], ['Track', I.skip],
                              ['Snip', I.scissors], ['Mail', I.mail], ['Notes', I.note], ['Files', I.folder]], 'Media'), [
      [600, s => { s.hot(0); s.keys(['🖱 wheel ▲']); s.say('Volume 40'); }],
      [450, s => s.say('Volume 50')],
      [450, s => s.say('Volume 60')],
      [450, s => s.say('Volume 70')],
      [900, s => { s.hot(1); s.keys(['🖱 wheel ▲']); s.say('Zoom 110 %'); }],
      [500, s => s.say('Zoom 125 %')],
      [900, s => { s.keys(['click']); s.say('Zoom reset to 100 %'); }],
    ]],
    windows: [el => stage(el, [['Budget.xlsx', I.sheet], ['Inbox', I.mail], ['Report.docx', I.doc], ['radialdeck', I.code],
                               ['Downloads', I.folder], ['Spotify', I.music]], 'Windows'), [
      [800, s => s.hot(3)],
      [500, s => s.hot(0)],
      [900, s => { s.show(false); s.say('Excel · Budget.xlsx in front'); }],
    ]],
    history: [el => stage(el, [['Invoice 4471', I.note], ['hello@acme.io', I.mail], ['192.168.1.20', I.server],
                               ['SELECT * FROM…', I.braces], ['Tracking link', I.link], ['Meeting notes', I.note]], 'Copied'), [
      [800, s => s.hot(1)],
      [500, s => s.hot(2)],
      [900, s => { s.show(false); s.say('Pasted 192.168.1.20'); }],
    ]],
    ocr: [el => stage(el, MAIN.map((x, i) => i === 4 ? ['Copy text', I.scan] : x), 'Main'), [
      [800, s => s.hot(4)],
      [700, s => { s.show(false); s.el.classList.add('is-snip'); }],
      [1500, s => s.say('Copied: Order 4471 ships Friday')],
    ]],
    offer: [el => stage(el, [['Sum', I.sum], ['Filter', I.filter], ['Freeze', I.snow], ['Percent', I.percent],
                             ['Chart', I.chart], ['Copy', I.copy], ['Find', I.search], ['Save', I.check]], 'Excel'), [
      [300, s => { s.show(false); s.el.classList.add('is-offer'); }],
      [2200, s => { s.el.classList.remove('is-offer'); s.show(true); }],
      [900, s => s.hot(0)],
      [700, s => s.say('A new Excel ring, only in Excel')],
    ]],
    share: [el => stage(el, [['Terminal', I.terminal], ['Flush DNS', I.wifi], ['RDP', I.monitor], ['Entra', I.globe],
                             ['Intune', I.shield], ['Lock', I.lock]], 'IT admin'), [
      [700, s => { s.keys(['Share']); s.say('Link copied: radialdeck.com/r#H4sIAAAA…'); }],
      [1800, s => { s.keys([]); s.say('Your colleague opens it and presses Save'); }],
    ]],
    themes: [el => {
      const s = stage(el, MAIN, 'Main');
      s.hot(1);
      return s;
    }, THEMES.filter(t => t.dark).slice(0, 25).map(t => [900, s => { themeRing(s.ringEl, t.dark); s.hot(1); s.say(t.name); }])],
  };

  // ---- Player: loops a scene while it is visible -------------------------------------------
  document.querySelectorAll('[data-scene]').forEach(el => {
    const scene = SCENES[el.dataset.scene];
    if (!scene) return;
    const [build, steps] = scene;
    el.insertAdjacentHTML('afterbegin', '<div class="ring" aria-hidden="true"><svg class="ring-svg" viewBox="0 0 320 320"></svg><div class="ring-labels"></div><div class="ring-hub"><span></span></div></div><div class="stage-hud" aria-hidden="true"></div><div class="stage-toast" aria-hidden="true"></div>');
    const s = build(el);
    if (reduced) {
      steps.forEach(([, fn]) => fn(s));
      return;
    }

    let timer = null, i = 0;
    const tick = () => {
      // The result is the point of the scene, so it stays up a while before the loop starts over.
      if (i === steps.length) { i = 0; timer = setTimeout(() => { s.reset(); tick(); }, 2400); return; }
      const [ms, fn] = steps[i++];
      timer = setTimeout(() => { fn(s); tick(); }, ms);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !timer) { i = 0; s.reset(); tick(); }
      if (!en.isIntersecting && timer) { clearTimeout(timer); timer = null; }
    }, { threshold: .35 }).observe(el);
  });

  // ---- Recorded GIFs: the poster turns into the clip when it scrolls into view --------------
  document.querySelectorAll('img[data-gif]').forEach(img => {
    const play = () => { img.src = img.dataset.gif; };
    if (reduced) { img.addEventListener('click', play); return; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); play(); } }, { threshold: .3 });
    io.observe(img);
  });

  // ---- Section chips follow the scroll ----------------------------------------------------
  const chips = [...document.querySelectorAll('.fx-chips a')];
  const byId = new Map(chips.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    chips.forEach(a => a.classList.toggle('is-on', a === byId.get(en.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.fx-section[id]').forEach(sec => spy.observe(sec));

  // Card icons.
  document.querySelectorAll('.fx-icon[data-icon]').forEach(el => { el.innerHTML = svg(I[el.dataset.icon] || I.check); });
})();
