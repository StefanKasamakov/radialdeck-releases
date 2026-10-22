/* RadialDeck: the live ring, as play.html draws it (springs, a soft light that glides between slices, the ring
   leaning toward the pointer, icons blooming out of the hub). Factored out for the desktop in site/os; play.html
   keeps its own copy. Draws with ring.js (RDRing), so it is the same ring as everywhere else on the site.

   const ring = RingLive.create(el, { home: () => anchorEl, onHot(slice), onFire(slice), icons?, origin?, room? });
   ring.set(slices, hub)            build at once            slices: [{ label, icon, tint?, say?, run?, children? }]
   ring.swap(slices, hub, at)       close, rebuild, open     at: { x, y } opens under that point, null goes home
   ring.pointer(x, y) / ring.leave()  hover and lean         ring.fire(i), ring.setHot(i), ring.aim(x, y)
   ring.tap(x, y, 'click'|'release')  a click / a let-go: runs what is under it. 'ran', 'stay' (the ring stays:
                                    a nested ring opened, or a bubble whose ring is out), or null (nothing there).
   ring.back()                      up a level after a nested ring opened in place.
   icon is the inside of a 24x24 Lucide <svg>, "img:url", or a name in opts.icons. hub: { title, sub, icon? (url) }.

   Nested rings as bubbles (RadialDeck Pro, next update; src/RadialDeck/Menu/RadialRenderer.Bubbles.cs and
   MenuController.TrackBubbles): a slice with children: [...] (or children: () => [...]) sends them out around the
   ring as glass bubbles while the pointer is on it. A child with children of its own sends a second layer out
   beyond its bubble. Running a parent slice itself (a let-go on it, a click, Enter) opens its ring the old way.
   opts.origin() is where the ring's box starts on screen when it is not position: fixed (default 0, 0);
   opts.room() the rect the bubbles must stay inside (default the viewport): the ring glides over to make room. */
window.RingLive = (() => {
  // ---- Springs: the SwiftUI model (response = period in seconds, damping = fraction of critical) ----
  class Spring {
    constructor(response, damping, value = 0) { this.tune(response, damping); this.value = this.target = value; this.vel = 0; }
    tune(response, damping) { const w = 2 * Math.PI / response; this.k = w * w; this.c = 2 * damping * w; return this; }
    step(dt) {
      const n = Math.max(4, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n; i++) { this.vel += (-this.k * (this.value - this.target) - this.c * this.vel) * h; this.value += this.vel * h; }
    }
    get rest() { return Math.abs(this.vel) < .0015 && Math.abs(this.value - this.target) < .0015; }
    snap(v = this.target) { this.value = this.target = v; this.vel = 0; }
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Tuned like Opie's "rise": a short spring with a whisper of overshoot, never a timed ease.
  const ENTER = { response: .34, damping: .78, fromScale: .9, rise: 18 };

  // ---- Bubbles: the app's geometry in its DIPs (OuterRadius 140), turned into pixels by the ring's size ----
  const B = { OUTER: 140, BAND: 186, RAD: 25, MAX: 10, MAX_SUB: 6, HALF: 55, REACH: 70, SLACK: 25 };
  B.SPACING = 2 * B.RAD * 1.12 + 6;
  const O = { x: 0, y: 0 };
  const kidsOf = s => { const k = typeof s?.children === 'function' ? s.children() : s?.children; const r = k ? k.filter(Boolean) : []; return r.length ? r : null; };
  const polarD = (p, r, deg) => { const a = deg * Math.PI / 180; return { x: p.x + r * Math.sin(a), y: p.y - r * Math.cos(a) }; };   // 0 = up, clockwise
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // A second layer's spots: a fan round the line hub -> bubble, at REACH when it fits within HALF, else further out,
  // then pushed out until none is closer than SPACING to the ring or to the first layer (RadialRenderer.FanFrom).
  function fanFrom(hub, parent, count, avoid) {
    const axis = Math.atan2(parent.x - hub.x, hub.y - parent.y) * 180 / Math.PI;
    let reach = B.REACH, step = count > 1 ? 2 * Math.asin(Math.min(1, B.SPACING / (2 * reach))) * 180 / Math.PI : 0;
    if (count > 1 && (count - 1) * step > 2 * B.HALF) { step = 2 * B.HALF / (count - 1); reach = B.SPACING / (2 * Math.sin(step / 2 * Math.PI / 180)); }
    const place = () => Array.from({ length: count }, (_, k) => polarD(parent, reach, axis + (k - (count - 1) / 2) * step));
    let spots = place();
    while (reach < 400 && spots.some(s => dist(s, hub) < B.OUTER + B.SPACING / 2 || avoid.some(a => dist(s, a) < B.SPACING))) { reach += 4; spots = place(); }
    return { spots, axis, half: (count - 1) * step / 2, reach };
  }
  // On the way from a bubble to its fan: on the bubble, or within the fan's width (and some slack) and reach.
  function inCorridor(f, p) {
    const d = dist(f.from, p);
    if (d <= B.RAD * 1.5) return true;
    if (d > f.reach + B.RAD * 1.5) return false;
    const deg = Math.atan2(p.x - f.from.x, f.from.y - p.y) * 180 / Math.PI;
    return Math.abs(((deg - f.axis) % 360 + 540) % 360 - 180) <= f.half + B.SLACK;
  }

  let styled = false;
  function style() {
    if (styled) return; styled = true;
    const k = 'var(--k, 1)';
    document.head.insertAdjacentHTML('beforeend', `<style>
.rl-bubs { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; z-index: 3; }
.rl-bub { position: absolute; left: 0; top: 0; width: calc(56.9px * ${k}); height: calc(56.9px * ${k}); margin: calc(-28.45px * ${k}) 0 0 calc(-28.45px * ${k});
  border-radius: 50%; display: grid; place-items: center; pointer-events: auto; cursor: pointer; visibility: hidden; will-change: transform, opacity;
  color: var(--r-label-dim, rgba(255,255,255,.82)); border: calc(var(--r-stroke-w, 1) * 1px) solid var(--r-stroke, rgba(255,255,255,.44));
  box-shadow: 0 calc(5px * ${k}) calc(13px * ${k}) var(--r-shadow, rgba(0,0,0,.4)); }
.rl-bub::before, .rl-bub::after { content: ''; position: absolute; inset: 0; border-radius: 50%; }
.rl-bub::before { background: linear-gradient(var(--b-top), var(--b-bot)); }
.rl-bub::after { opacity: 0; transition: opacity .12s; background: radial-gradient(circle at 50% 12%, var(--b-hot-top) 0, color-mix(in srgb, var(--b-hot-bot) 55%, transparent) 55%, transparent 100%); }
.rl-bub.is-hot { color: var(--r-label, #fff); border-color: var(--r-hover-stroke, #fff); }
.rl-bub.is-hot::after { opacity: 1; }
.rl-bub .ring-ico { position: relative; z-index: 1; margin: 0 !important; }
.rl-bub.is-hot .ring-ico.is-bare { color: var(--ink-lit); }

.ring-svg .rl-more { fill: var(--r-label-dim, rgba(255,255,255,.8)); pointer-events: none; }
</style>`);
  }

  function create(el, opts = {}) {
    const { slicePath, polar, R, RI } = RDRing;
    style();
    if (!el.querySelector('.ring-svg')) {
      el.innerHTML = '<div class="ring-glass"></div><svg class="ring-svg" viewBox="0 0 320 320" aria-hidden="true"></svg>'
        + '<div class="ring-labels"></div><div class="ring-hub"><img class="hub-ico" alt="" hidden><b class="hub-t"></b><span class="hub-s"></span></div>';
    }
    const svgEl = el.querySelector('.ring-svg'), labelsEl = el.querySelector('.ring-labels');
    const lightEl = el.querySelector('.ring-light') || svgEl.insertAdjacentElement('afterend', document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    lightEl.setAttribute('class', 'ring-light'); lightEl.setAttribute('viewBox', '0 0 320 320'); lightEl.setAttribute('aria-hidden', 'true');
    lightEl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;transform-origin:50% 50%;will-change:transform,opacity;opacity:0';
    const paintLight = () => RDRing.paint(el);
    const hubIco = el.querySelector('.hub-ico'), hubT = el.querySelector('.hub-t'), hubS = el.querySelector('.hub-s');
    const hubBack = el.querySelector('.hub-back') || hubT.insertAdjacentElement('beforebegin', Object.assign(document.createElement('span'), { className: 'hub-back', hidden: true }));
    const bubsEl = el.querySelector('.rl-bubs') || el.appendChild(Object.assign(document.createElement('div'), { className: 'rl-bubs' }));
    bubsEl.setAttribute('aria-hidden', 'true');
    RDRing.themeRing(el, RDRing.themeById('glass').dark);
    const ico = name => opts.icons?.[name] || name || '';
    // A bubble's icon as the app draws it: IconArt in the ring's icon pack.
    const icoHtml = (name, k = 0, label = '') => RDRing.icon(el, ico(name), k, label)?.html || '';

    const presence = new Spring(ENTER.response, ENTER.damping);
    const angle = new Spring(.14, 1), glow = new Spring(.12, 1), kick = new Spring(.3, .55);
    const driftX = new Spring(.35, .85), driftY = new Spring(.35, .85);
    const dimS = new Spring(.2, 1), shiftX = new Spring(.35, .85), shiftY = new Spring(.35, .85);
    let labels = [], slices = [], hubInfo = {}, n = 8, hot = -1, hotPath = null, deep = false, stack = [], lastHot;
    let closing = false, afterClose = null, at = null, pointer = null;

    function build(list, hub = {}) {
      clearBubbles();
      slices = list; hubInfo = hub; n = slices.length;
      deep = slices.some(s => s?.children);
      RDRing.buildRing(svgEl, labelsEl, { slices: slices.map(s => [s.label, s.icon]) });
      // A slice that holds a ring wears three dots at its rim, as in the app (9 DIPs in from the edge, 4 degrees apart).
      const K = RDRing.K, more = slices.map((s, i) => s.children ? [-4, 0, 4].map(d => { const [x, y] = polar(R - 9 * K, i * 360 / n + d); return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(2 * K).toFixed(2)}"/>`; }).join('') : '').join('');
      if (more) svgEl.insertAdjacentHTML('beforeend', `<g class="rl-more">${more}</g>`);
      // The light: one wedge in a layer of its own that turns from slice to slice, as the app's glide does. Turning a
      // layer is a transform, so the slices, their patterns and the shadow are never painted again while it moves.
      lightEl.innerHTML = `<path d="${slicePath(0, n)}"/>`;
      paintLight();
      hotPath = lightEl;
      labels = [...labelsEl.children].map((l, i) => {
        l.style.setProperty('--tint', slices[i].tint || hub.tint || '#fff');
        return { el: l, ux: +l.dataset.x / 320 - .5, uy: +l.dataset.y / 320 - .5, bloom: new Spring(.38, .8), at: 0 };
      });
      hot = -1; lastHot = undefined; labels.forEach(l => l.el.classList.remove('is-hot'));
      showHub(true);
      wake();
    }

    // What the pointer is on: a second-layer bubble, a first-layer one, or a slice.
    const hotSlice = () => subHot >= 0 ? subKids[subHot] : bHot >= 0 ? bKids[bHot] : slices[hot];
    function report() {
      const s = hotSlice() || null;
      if (s === lastHot) return;
      lastHot = s;
      opts.onHot?.(s);
      showHub();
    }
    // The hub as RadialRenderer.ApplyHub: the back arrow inside a nested ring, and under it the whole of a label the
    // ring had to cut short (or the lit bubble's), else the ring's name. No picture: the app draws none there.
    function showHub(force) {
      const s = hotSlice();
      hubIco.hidden = true;
      const full = subHot >= 0 || bHot >= 0 ? s?.label : hot >= 0 ? labels[hot]?.el.dataset.full : null;
      let t = full ?? hubInfo.title ?? '';
      if (full == null && el._theme?.labelUppercase) t = t.toUpperCase();
      const back = stack.length > 0;
      if (hubBack.hidden === back) {
        hubBack.hidden = !back;
        const ic = window.RD_ICONS?.['fluent:E72B'];   // Segoe Fluent "back", 20 DIPs
        if (back && ic) hubBack.innerHTML = `<svg viewBox="${ic[0]}" aria-hidden="true" style="display:block;width:${RDRing.dip(20)};height:${RDRing.dip(20)};margin:0 auto;fill:currentColor;stroke:none">${ic[1]}</svg>`;
      }
      if (!force && hubT.textContent === t) return;
      hubT.textContent = t;
      hubS.textContent = '';
      // The new name fades in where the old one was, instead of jumping.
      [hubT, hubS].forEach(h => { h.classList.remove('is-swap'); void h.offsetWidth; h.classList.add('is-swap'); });
    }
    function hubText(title, sub) { hubT.textContent = title; hubS.textContent = sub; }

    function open() {
      closing = false;
      presence.tune(ENTER.response, ENTER.damping);
      presence.value = 0; presence.vel = 0; presence.target = 1;
      const t0 = performance.now();
      labels.forEach((l, i) => { l.bloom.snap(0); l.at = t0 + 40 + i * 24; });
      glow.snap(0); setHot(-1);
      if (reduce) { presence.snap(1); labels.forEach(l => { l.bloom.snap(1); l.at = 0; }); }
      wake();
    }
    function close(then) {
      closing = true; afterClose = then;
      hideBubbles();
      presence.tune(.2, 1); presence.target = 0;
      if (reduce) presence.snap(0);
      wake();
    }
    // The ring leaves its place and opens somewhere else (under the pointer, or back home) with new slices.
    function swap(list, hub, where = null) {
      stack = [];
      close(() => { at = where; el.classList.toggle('is-held', !!at); build(list, hub); open(); });
    }
    // A slice's ring opened the old way, in place of this one; the hub (or running a slice at home) comes back.
    function descend(s, kids) {
      stack.push([slices, hubInfo]);
      close(() => { build(kids.map(k => ({ ...k, icon: ico(k.icon) })), { title: s.label, sub: 'Hub: back', icon: hubInfo.icon, tint: s.tint || hubInfo.tint }); open(); });
      return 'stay';
    }
    function back() {
      const prev = stack.pop();
      if (prev) close(() => { build(...prev); open(); });
    }

    function setHot(i) {
      if (i === hot) return;
      hot = i;
      labels.forEach((l, j) => l.el.classList.toggle('is-hot', j === i));
      if (i >= 0) {
        // Glide along the shorter way round; arriving from nothing, appear in place instead of sweeping.
        const to = i * 360 / n, from = angle.target, d = ((to - from) % 360 + 540) % 360 - 180;
        if (glow.value < .05) angle.snap(to); else angle.target = from + d;
        glow.target = 1;
      } else glow.target = 0;
      report(); wake();
    }

    function fire(i) {
      const s = slices[i];
      if (!s) return null;
      const kids = kidsOf(s);
      if (kids && !s.run) return descend(s, kids);
      kick.value = -1; kick.vel = 0; kick.target = 0;
      hotPath.classList.remove('is-fire'); void hotPath.getBBox(); hotPath.classList.add('is-fire');
      opts.onFire?.(s);
      if (!at && stack.length) back();
      wake();
      return 'ran';
    }

    // ---- Bubbles ----
    let bubs = [], pool = [], clock = 0, fan = null;
    let bParent = -1, bKids = null, bChecked = -1, bHot = -1, subB = -1, subKids = null, subHot = -1;
    const dip = () => size() * R / (320 * B.OUTER);
    function local(x, y) { const c = centre(), d = dip() || 1; return { x: (x - c.x) / d, y: (y - c.y) / d }; }

    function addBubble(layer, child, s, from, to, offMiddle) {
      const e = pool.pop() || bubsEl.appendChild(Object.assign(document.createElement('div'), { className: 'rl-bub' }));
      e.innerHTML = icoHtml(s.icon, child, s.label);
      e.style.setProperty('--tint', s.tint || '#fff');
      e.style.setProperty('--ink-lit', RDRing.css(RDRing.readableOn(RDRing.litColour(el._theme), RDRing.tintOf(s.label || '', child))));
      e.style.zIndex = layer === 1 ? 2 : 1;   // a second layer leaves from inside its bubble, not over it
      e.classList.remove('is-hot');
      const b = { layer, child, s, el: e, from, to, start: clock + .02 + offMiddle * .025, heading: Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI,
        flight: new Spring(.32, .82), wobble: new Spring(.22, .3), hot: new Spring(.16, .7), leaving: false, landed: false, dim: false, lit: false };
      if (reduce) { b.flight.snap(1); b.landed = true; }
      bubs.push(b);
      place(b, dip());
      e.style.visibility = 'visible';
    }
    function drop(b) { b.el.style.visibility = 'hidden'; b.el.classList.remove('is-hot'); pool.push(b.el); bubs.splice(bubs.indexOf(b), 1); }
    function retract(which) {
      bubs.filter(b => !b.leaving && which(b)).forEach(b => { b.leaving = true; b.flight.target = 0; });
      if (reduce) bubs.filter(b => b.leaving).forEach(drop);
    }
    function theme() {
      const v = el._theme;
      if (!v) return;
      const st = bubsEl.style;
      st.setProperty('--b-top', v.sliceTop); st.setProperty('--b-bot', v.sliceBottom);
      st.setProperty('--b-hot-top', v.hoverTop); st.setProperty('--b-hot-bot', v.hoverBottom);
    }
    function showBubbles(parent, kids) {
      if (parent === bParent) return;
      hideBubbles();
      bParent = parent; bKids = kids;
      theme();
      const dir = parent * 360 / n, step = kids.length > 1 ? clamp(160 / (kids.length - 1), 21, 34) : 0, from = polarD(O, B.OUTER - 20, dir);
      kids.forEach((s, k) => { const spread = k - (kids.length - 1) / 2; addBubble(1, k, s, from, polarD(O, B.BAND, dir + spread * step), Math.abs(spread)); });
      dimS.target = 1;
      refit();
    }
    function showSub(bi, kids) {
      hideSubLayer();
      const host = bubs.find(b => b.layer === 1 && !b.leaving && b.child === bi);
      if (!host) return;
      const others = bubs.filter(b => b.layer === 1 && !b.leaving && b !== host);
      const f = fanFrom(O, host.to, kids.length, others.map(b => b.to));
      fan = { from: host.to, axis: f.axis, half: f.half, reach: f.reach };
      kids.forEach((s, k) => addBubble(2, k, s, host.to, f.spots[k], Math.abs(k - (kids.length - 1) / 2)));
      others.forEach(b => b.dim = true);
      refit();
    }
    function hideSubLayer() {
      retract(b => b.layer === 2);
      bubs.forEach(b => b.dim = false);
      fan = null;
      refit();
    }
    function openSub(bi) {
      const kids = kidsOf(bKids[bi]);
      subB = bi; subHot = -1;
      if (kids && kids.length <= B.MAX_SUB) { subKids = kids; showSub(bi, kids); }
      else if (subKids) { subKids = null; hideSubLayer(); }
    }
    function closeSub() { const was = !!subKids; subB = -1; subKids = null; subHot = -1; if (was) hideSubLayer(); }
    function hideBubbles() {
      if (bParent < 0 && !bubs.length) return;
      closeSub();
      retract(() => true);
      bParent = -1; bKids = null; bHot = -1; bChecked = -1;
      dimS.target = 0;
      light(); refit();
    }
    function clearBubbles() {
      [...bubs].forEach(drop);
      bParent = -1; bKids = null; bHot = -1; bChecked = -1; subB = -1; subKids = null; subHot = -1; fan = null;
      dimS.snap(0); shiftX.snap(0); shiftY.snap(0);
    }
    function bubbleAt(p, layer) {
      let best = -1, near = B.RAD * 1.5;
      for (const b of bubs) {
        if (b.layer !== layer || b.leaving || b.flight.value < .6) continue;
        const d = dist(b.to, p);
        if (d <= near) { near = d; best = b.child; }
      }
      return best;
    }
    function light() {
      for (const b of bubs) {
        const on = !b.leaving && b.child === (b.layer === 1 ? bHot : subHot);
        b.hot.target = on ? 1 : 0;
        if (on !== b.lit) { b.lit = on; b.el.classList.toggle('is-hot', on); }
      }
      report(); wake();
    }
    // Bubbles out past the edge of the screen (or opts.room): the ring glides over until they fit.
    function refit() {
      let ox = 0, oy = 0;
      const live = bubs.filter(b => !b.leaving);
      if (live.length) {
        const c = baseCentre(), d = dip(), m = B.RAD * 1.3 * d + 8, r = opts.room?.() || { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
        const xs = live.map(b => c.x + b.to.x * d), ys = live.map(b => c.y + b.to.y * d);
        const fit = (lo, hi, a, b) => lo - m < a ? a - (lo - m) : hi + m > b ? b - (hi + m) : 0;
        ox = fit(Math.min(...xs), Math.max(...xs), r.left, r.right);
        oy = fit(Math.min(...ys), Math.max(...ys), r.top, r.bottom);
      }
      shiftX.target = ox; shiftY.target = oy;
      if (reduce) { shiftX.snap(); shiftY.snap(); }
      wake();
    }

    // The app's MenuController.TrackBubbles: inside the ring the slice under the pointer decides which nested ring is
    // out; past the edge the bubbles stay and any of them can be lit. Returns the slice to light.
    function track(x, y) {
      const slice = aim(x, y), p = local(x, y), d = Math.hypot(p.x, p.y);
      if (d <= B.OUTER) {
        if (subB >= 0) closeSub();   // back in the ring: the second layer goes home
        if (slice !== bChecked) {
          const kids = slice >= 0 ? kidsOf(slices[slice]) : null;
          if (kids && kids.length <= B.MAX) showBubbles(slice, kids);
          else if (bParent >= 0) hideBubbles();
          bChecked = slice;
        }
      } else if (!at && bParent >= 0 && d > Math.max(...bubs.filter(b => !b.leaving).map(b => Math.hypot(b.to.x, b.to.y))) + B.RAD * 2.5) {
        hideBubbles();   // the ring at home: well away from it, the bubbles go home too
      }
      // The second layer first; on the way out to it (the corridor) the bubble it belongs to stays lit.
      subHot = subKids ? bubbleAt(p, 2) : -1;
      if (subHot >= 0 || (subKids && fan && inCorridor(fan, p))) bHot = subB;
      else {
        bHot = bKids ? bubbleAt(p, 1) : -1;
        if (bHot >= 0 && bHot !== subB) openSub(bHot);
      }
      light();
      return bParent >= 0 && d > B.OUTER ? bParent : slice;
    }
    function fireBubble(layer, i) {
      const s = layer === 2 ? subKids[i] : bKids[i], kids = kidsOf(s);
      if (kids && !s.run) return descend(s, kids);   // a bubble whose ring is too big for a layer opens as a ring
      const b = bubs.find(x => x.layer === layer && x.child === i && !x.leaving);
      if (b && !reduce) b.wobble.vel += 2.4;
      opts.onFire?.(s);
      if (!at) { setTimeout(hideBubbles, 140); if (stack.length) back(); }
      wake();
      return 'ran';
    }
    function tap(x, y, how = 'click') {
      if (closing) return null;
      setHot(track(x, y));
      if (subHot >= 0) return fireBubble(2, subHot);
      if (bHot >= 0) return subKids && bHot === subB ? 'stay' : fireBubble(1, bHot);
      const p = local(x, y), d = Math.hypot(p.x, p.y);
      // Past the edge with bubbles out: a let-go opens the slice's ring the old way, a click there is nowhere.
      if (bParent >= 0 && d > B.OUTER) return how === 'release' ? fire(bParent) : null;
      if (stack.length && d < B.OUTER * RI / R) { back(); return 'stay'; }
      return hot >= 0 ? fire(hot) : null;
    }

    function place(b, d) {
      const f = clamp(b.flight.value, 0, 1.2), stretch = Math.min(.24, Math.abs(b.flight.vel) * .045);
      const sz = (.3 + .7 * f) * (1 + .12 * b.hot.value), w = b.wobble.value;
      const x = (b.to.x + (b.from.x - b.to.x) * (1 - f)) * d, y = (b.to.y + (b.from.y - b.to.y) * (1 - f)) * d, h = b.heading.toFixed(1);
      // Squash along the flight: turn to its direction, stretch, turn back.
      b.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${h}deg) scale(${(sz * (1 + stretch + w)).toFixed(4)}, ${(sz * (1 - stretch * .55 - w)).toFixed(4)}) rotate(${-h}deg)`;
      b.el.style.opacity = (clamp(f * 2, 0, 1) * (b.dim ? .4 : 1)).toFixed(3);
    }

    // ---- Geometry ----
    function homeRect() { const a = opts.home?.(); return a ? a.getBoundingClientRect() : null; }
    let heldSize = 340;
    function size() {
      const b = homeRect();
      if (b && b.width) heldSize = b.width;
      // Held on a narrow screen, a ring with bubbles stays small enough for them to fit beside it.
      return at ? Math.min(heldSize, innerWidth * .9, innerHeight * .8, deep ? Math.min(innerWidth, innerHeight) / 1.5 : 1e9) : b ? b.width : 0;
    }
    function baseCentre() {
      if (at) return at;
      const b = homeRect();
      return b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
    }
    function centre() { const c = baseCentre(); return { x: c.x + shiftX.value, y: c.y + shiftY.value }; }
    function aim(x, y) {
      const c = centre(), w = size(), dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy);
      const inner = w * RI / 320, outer = w * R / 320;
      const live = at ? d > inner * .55 : d > inner * .9 && d < outer * 1.12;
      if (!live || !w) return -1;
      const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      return Math.floor(((deg + 180 / n) % 360) / (360 / n));
    }

    // ---- The frame loop: runs only while something moves ----
    let raf = 0, last = 0;
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const w = size(), c = centre(), k = w / 340, d = w * R / (320 * B.OUTER);

      // The ring leans a few pixels toward the pointer (the lit icon's lift is the ring's own, see ring.js).
      let tx = 0, ty = 0;
      if (pointer && !closing) {
        const dx = pointer.x - c.x, dy = pointer.y - c.y, dd = Math.hypot(dx, dy);
        if (dd > 1 && dd < w * 1.3) { const m = Math.min(10 * k, dd * .04); tx = dx / dd * m; ty = dy / dd * m; }
      }
      driftX.target = tx; driftY.target = ty;
      labels.forEach(l => { if (l.at && now >= l.at) { l.bloom.target = 1; l.at = 0; } });

      const springs = [presence, angle, glow, kick, driftX, driftY, dimS, shiftX, shiftY, ...labels.map(l => l.bloom)];
      springs.forEach(s => s.step(dt));

      const p = presence.value, o = opts.origin?.() || O;
      const scale = (closing ? 1 + (1 - p) * .08 : ENTER.fromScale + (1 - ENTER.fromScale) * p) * (1 + kick.value * .035);
      const rise = closing ? 0 : ENTER.rise * k * (1 - p);
      el.style.width = el.style.height = w + 'px';
      el.style.setProperty('--k', k.toFixed(3));
      el.style.transform = `translate(${(c.x - o.x - w / 2 + driftX.value).toFixed(2)}px, ${(c.y - o.y - w / 2 + driftY.value + rise).toFixed(2)}px) scale(${scale.toFixed(4)})`;
      el.style.opacity = w ? Math.max(0, Math.min(1, p * (closing ? 1.2 : 1.6))).toFixed(3) : 0;
      el.style.visibility = w && p > .01 ? '' : 'hidden';
      if (hotPath) { hotPath.style.transform = `rotate(${angle.value.toFixed(2)}deg)`; hotPath.style.opacity = glow.value.toFixed(3); }
      const dim = 1 - .6 * dimS.value;
      labels.forEach((l, i) => {
        // Icons bloom outward from the hub one after another, and settle on their own spring.
        const b = l.bloom.value, f = .55 + .45 * b;
        const ox = l.ux * w * (f - 1), oy = l.uy * w * (f - 1);
        l.el.style.transform = `translate(-50%, -50%) translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${(.6 + .4 * b).toFixed(4)})`;
        // While bubbles are out the rest of the ring steps back, so the eye goes to them.
        l.el.style.opacity = (Math.max(0, Math.min(1, b * 1.3)) * (i === bParent ? 1 : dim)).toFixed(3);
      });

      // Bubbles: each leaves the slice's rim, stretches along its flight like a drop and lands with a jelly wobble.
      clock += dt;
      let moving = false;
      for (let i = bubs.length - 1; i >= 0; i--) {
        const b = bubs[i];
        if (!b.leaving && clock >= b.start) b.flight.target = 1;
        b.flight.step(dt); b.wobble.step(dt); b.hot.step(dt);
        if (!b.landed && !b.leaving && b.flight.value > .96) { b.landed = true; b.wobble.vel += 2.4; }
        place(b, d);
        if (b.leaving && b.flight.value < .04) { drop(b); continue; }
        moving ||= !(b.flight.rest && b.wobble.rest && b.hot.rest) || (!b.leaving && clock < b.start);
      }

      if (closing && p < .04 && afterClose) { const then = afterClose; afterClose = null; then(); }
      const pending = labels.some(l => l.at);
      if (springs.every(s => s.rest) && !pending && !afterClose && !moving) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    }

    // ---- Input the ring handles itself: a click on a slice or a bubble, arrow keys while it has focus ----
    el.addEventListener('click', e => { if (at || closing) return; tap(e.clientX, e.clientY); });
    el.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { setHot((hot + 1 + n) % n); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { setHot((hot - 1 + n) % n); e.preventDefault(); }
      if ((e.key === 'Enter' || e.key === ' ') && hot >= 0) { fire(hot); e.preventDefault(); }
    });
    el.addEventListener('blur', () => { if (!pointer && !at) setHot(-1); });
    addEventListener('resize', wake);

    return {
      el, open, close, fire, setHot, aim, wake, hubText, tap, back,
      set(list, hub) { stack = []; build(list, hub); },
      swap,
      pointer(x, y) { pointer = { x, y }; if (!closing) setHot(track(x, y)); wake(); },
      leave() { pointer = null; if (!at) { hideBubbles(); setHot(-1); } wake(); },
      get held() { return !!at; },
      get closing() { return closing; },
      get hot() { return hot; },
      get slices() { return slices; },
      get bubbles() { return { parent: bParent, hot: bHot, sub: subKids ? subB : -1, subHot, count: bubs.filter(b => !b.leaving).length }; },
    };
  }

  return { Spring, create, reduce };
})();
