/* RadialDeck: the ring itself.
   Shared by every ring on the site and deliberately the only implementation: a port of what RadialDeck draws on
   Windows (src/RadialDeck/Menu/RadialRenderer.cs, LabelFit.cs, IconArt.cs, Theme/RingTheme.cs), in the app's own
   units. The app draws a 140 DIP ring on a 308 DIP canvas; here the ring is 150 units in a 320 box, so one DIP is
   K units and every number below is the app's, times K. Colours come from themes.js (generated from the app's theme
   and icon pack files), icons from ring-icons.js (the open drawings of the app's Segoe glyphs). */
window.RDRing = (() => {
  // ---- Legacy line icons (Lucide, inline), still used by pages that draw their own small icons ----
  const I = {
    google: '<circle cx="12" cy="12" r="10"/><path d="M12 8a4 4 0 1 0 3.5 6H12"/>',
    youtube: '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49 49 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49 49 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
    map: '<path d="M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2 6.9-3V3z"/><path d="M9.9 4v13M14.1 6v13"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    caseUp: '<path d="M4 20 10 4l6 16M6 14h8M19 8v12M16 11l3-3 3 3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    bot: '<path d="M12 8V4H8M4 8h16v12H4zM2 14h2M20 14h2M15 13v2M9 13v2"/>',
    note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    convert: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    git: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9M6 9v3a3 3 0 0 0 3 3h3"/>',
    reply: '<path d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4"/>',
    replyAll: '<path d="M7 17 2 12l5-5M12 17l-5-5 5-5M22 18v-2a4 4 0 0 0-4-4H7"/>',
    forward: '<path d="m15 17 5-5-5-5M4 18v-2a4 4 0 0 1 4-4h12"/>',
    template: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    wifi: '<path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    key: '<path d="m21 2-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15 8m3-3 3 3-3 3-3-3"/>',
    power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  // ---- Geometry: the app's (RadialRenderer: OuterRadius 140, InnerRadius 46, a 1.2 degree gap each side) ----
  const R = 150, K = R / 140, RI = 46 * K, C = 160, GAP = 1.2, HUB = 42 * K;
  const DIP = `${(K * 100 / 320).toFixed(6)}cqw`;   // one app DIP, in units of the ring's width
  const dip = v => `calc(${DIP} * ${+v.toFixed(3)})`;
  const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  function slicePath(i, n) {
    const sweep = n === 1 ? 359.99 : 360 / n, gap = n === 1 ? 0 : GAP;
    const start = -sweep / 2 + i * sweep + gap, end = start + sweep - 2 * gap;
    const [x1, y1] = polar(R, start), [x2, y2] = polar(R, end), [x3, y3] = polar(RI, end), [x4, y4] = polar(RI, start);
    const large = end - start > 180 ? 1 : 0;
    return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${RI} ${RI} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  // ---- Colours ----
  const THEMES = window.RD_THEMES || [];
  const ICONS = window.RD_ICONS || {};
  const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];
  const col = s => {
    s = String(s || '').trim();
    let m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    m = s.replace(/^#/, '').match(/^([0-9a-f]{6}|[0-9a-f]{8})$/i);   // the app's #RRGGBB / #AARRGGBB
    if (m) { const h = m[1], o = h.length === 8 ? 2 : 0; return { r: parseInt(h.substr(o, 2), 16), g: parseInt(h.substr(o + 2, 2), 16), b: parseInt(h.substr(o + 4, 2), 16), a: o ? parseInt(h.substr(0, 2), 16) / 255 : 1 }; }
    return { r: 255, g: 0, b: 255, a: 1 };   // magenta, as the app shows a bad value
  };
  const css = c => `rgba(${c.r},${c.g},${c.b},${+c.a.toFixed(4)})`;
  const BLACK = { r: 0, g: 0, b: 0, a: 1 }, WHITE = { r: 255, g: 255, b: 255, a: 1 }, GRAY = { r: 128, g: 128, b: 128, a: 1 };
  const lum = c => { const ch = v => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // RadialRenderer.ReadableOn: the preferred colour where it reads (3:1), else black or white, whichever reads better.
  const readableOn = (bg, want, min = 3) => contrast(want, bg) >= min ? want : contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
  const shade = (c, k) => ({ r: Math.floor(c.r * k), g: Math.floor(c.g * k), b: Math.floor(c.b * k), a: c.a });
  const blend = (c, w, k) => ({ r: Math.floor(c.r + (w.r - c.r) * k), g: Math.floor(c.g + (w.g - c.g) * k), b: Math.floor(c.b + (w.b - c.b) * k), a: c.a });
  const isThin = v => /light|thin/i.test(v.font || '');
  // What the eye sees behind a lit label: the slice (its gradient's average) with the light's middle over it.
  const LIGHT_EDGE = 215 / 255, LIGHT_MID = 92 / 255;
  function litColour(v) {
    const t = col(v.sliceTop), b = col(v.sliceBottom), l = col(v.hoverBottom);
    const main = { r: Math.floor((t.r + b.r) / 2), g: Math.floor((t.g + b.g) / 2), b: Math.floor((t.b + b.b) / 2) };
    const mix = (u, o) => Math.round(u * (1 - LIGHT_MID) + o * LIGHT_MID);
    return { r: mix(main.r, l.r), g: mix(main.g, l.g), b: mix(main.b, l.b), a: 1 };
  }
  // RadialRenderer.ReadableLabel: the theme's label colour on a background unless it would vanish there.
  const readableLabel = (v, bg) => { const lab = col(v.label), r = readableOn(bg, lab, isThin(v) ? 4.5 : 3); return r === lab ? lab : r; };

  // ---- Fonts: Segoe UI semibold, or the theme's face, as the app sets its labels ----
  function face(v) {
    const f = (v && v.font || '').replace(/[^a-z0-9 -]/gi, '');
    const generic = /consolas|mono|courier/i.test(f) ? "ui-monospace, Menlo, monospace" : /georgia|cambria|times|serif/i.test(f) ? "Georgia, serif" : "system-ui, -apple-system, 'Helvetica Neue', sans-serif";
    const family = (f ? `'${f}', ` : '') + `'Segoe UI', ${generic}`;   // single quotes: it goes into style attributes
    const weight = /semilight/i.test(f) ? 350 : /light|thin/i.test(f) ? 300 : /black|heavy/i.test(f) ? 900 : 600;
    return { family, weight };
  }
  const GLYPH_FONT = "'Segoe UI Emoji', 'Segoe UI Symbol', 'Segoe UI', system-ui, sans-serif";
  let ctx2d = null;
  const measurer = (fc) => (s, size) => {
    ctx2d ||= document.createElement('canvas').getContext('2d');
    ctx2d.font = `${fc.weight} ${size}px ${fc.family}`;
    // Chrome measures a few thousandths of a pixel under WPF's FormattedText; a label right at the edge then fit here
    // and not in the app (the Excel ring in Segoe UI Black). With this every label of the 380 test rings matches.
    return ctx2d.measureText(s).width * 1.0002;
  };

  // ---- LabelFit: the largest size, line width and distance from the hub at which a label fits its wedge ----
  const MARGIN = 3, MIN_SIZE = 8, MAX_W = 92, CEN = 154, R_IN = 46, R_OUT = 140;
  const dpolar = (r, deg) => { const a = deg * Math.PI / 180; return [CEN + r * Math.sin(a), CEN - r * Math.cos(a)]; };
  function insideWedge(px, py, start, sweep, pad) {
    const dx = px - CEN, dy = py - CEN, r = Math.hypot(dx, dy);
    if (r < R_IN + pad || r > R_OUT - pad) return false;
    if (sweep >= 360) return true;
    const deg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360, into = (deg - start + 360) % 360;
    if (into > sweep) return false;
    return r * Math.sin(Math.min(into, 90) * Math.PI / 180) >= pad && r * Math.sin(Math.min(sweep - into, 90) * Math.PI / 180) >= pad;
  }
  function wrap(text, width, measure) {
    const lines = []; let line = '';
    for (const word of text.split(' ').filter(Boolean)) {
      if (measure(word) > width) return null;
      const cand = line ? line + ' ' + word : word;
      if (measure(cand) <= width) { line = cand; continue; }
      lines.push(line); line = word;
    }
    if (line || !lines.length) lines.push(line);
    return lines;
  }
  const radii = () => { const mid = (R_IN + R_OUT) / 2; return [mid, mid + 8, mid + 16, mid - 6]; };
  function boxEdge(x, y, w, h) { const pts = []; for (let i = 0; i <= 4; i++) { const fx = x + w * i / 4, fy = y + h * i / 4; pts.push([fx, y], [fx, y + h], [x, fy], [x + w, fy]); } return pts; }
  function tryFit(slot, size, radius, maxLines, measure) {
    const cache = new Map(), m = s => cache.has(s) ? cache.get(s) : (cache.set(s, measure(s, size)), cache.get(s));
    const lh = size * 1.2, [ax, ay] = dpolar(radius, slot.angle);
    const fits = (x, y, w, h) => boxEdge(x, y, w, h).every(([px, py]) => insideWedge(px, py, slot.start, slot.sweep, MARGIN));
    for (let width = MAX_W; width >= 30; width -= 4) {
      const lines = wrap(slot.text, width, m);
      if (!lines || lines.length > maxLines) return null;
      const tw = Math.max(...lines.map(m)), th = lines.length * lh, top = ay - (slot.art.h + th) / 2;
      if (fits(ax - tw / 2, top + slot.art.h, tw, th) && (slot.art.w <= 0 || fits(ax - slot.art.w / 2, top, slot.art.w, slot.art.h)))
        return { size, textWidth: tw, lines, anchor: [ax, ay], trimmed: false };
    }
    return null;
  }
  function chooseAt(slot, radius, max, maxLines, measure) {
    for (let s = max; s >= MIN_SIZE - 0.01; s -= 0.5) { const f = tryFit(slot, s, radius, maxLines, measure); if (f) return f; }
    return null;
  }
  function choose(slot, maxLines, measure) {
    for (let s = slot.base; s >= MIN_SIZE - 0.01; s -= 0.5) for (const r of radii()) { const f = tryFit(slot, s, r, maxLines, measure); if (f) return f; }
    return fallback(slot, (R_IN + R_OUT) / 2, maxLines, measure);
  }
  function hRoom(px, py, start, sweep) {
    const inside = x => { const dx = x - CEN, dy = py - CEN, r = Math.hypot(dx, dy), deg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360; return r >= R_IN && r <= R_OUT && ((deg - start + 360) % 360) <= sweep; };
    if (!inside(px)) return 0;
    let l = 0, r = 0;
    while (l < 200 && inside(px - l - 1)) l++;
    while (r < 200 && inside(px + r + 1)) r++;
    return 2 * Math.min(l, r);
  }
  function shorten(text, width, maxLines, m) {
    const cut = s => { if (m(s) <= width) return s; let k = s.replace(/…+$/, ''); while (k.length > 1 && m(k + '…') > width) k = k.slice(0, -1); return k + '…'; };
    const words = text.split(' ').filter(Boolean).map(cut);
    let lines = wrap(words.join(' '), width, m) || [cut(text)];
    if (lines.length > maxLines) lines = [...lines.slice(0, maxLines - 1), cut(lines[maxLines - 1] + '…')];
    return lines;
  }
  function fallback(slot, radius, maxLines, measure) {
    const [ax, ay] = dpolar(radius, slot.angle);
    const room = hRoom(ax, ay, slot.start + 1.2, slot.sweep - 2.4);
    const w = Math.min(MAX_W, Math.max(30, room - 2 * MARGIN)), m = s => measure(s, MIN_SIZE);
    const lines = shorten(slot.text, w, maxLines, m);
    return { size: MIN_SIZE, textWidth: Math.max(...lines.map(m)), lines, anchor: [ax, ay], trimmed: true };
  }
  // LabelFit.ChooseRing: one distance and (within two points of the normal size) one size for the whole ring.
  function chooseRing(slots, maxLines, measure) {
    let bestR = (R_IN + R_OUT) / 2, best = slots.map(() => null), score = [-1, 0];
    for (const r of radii()) {
      const at = slots.map(s => chooseAt(s, r, s.base, maxLines, measure));
      const fitted = at.filter(Boolean).length, smallest = at.filter(Boolean).reduce((a, f) => Math.min(a, f.size), Infinity);
      const sm = fitted ? smallest : 0;
      if (fitted > score[0] || (fitted === score[0] && sm > score[1] + 0.01)) { score = [fitted, sm]; bestR = r; best = at; }
    }
    return slots.map((s, i) => {
      const own = best[i], shared = Math.max(score[1], s.base - 2);
      if (!own) { const e = choose(s, maxLines, measure); return e.trimmed ? fallback(s, bestR, maxLines, measure) : e; }
      return own.size <= shared + 0.01 ? own : chooseAt(s, bestR, shared, maxLines, measure) || own;
    });
  }

  // ---- Icons: what IconArt draws for a slice, in the theme's icon pack ----
  const ORIGINAL = { frame: 'none', colors: [], gradient: true, glyph: 'label', images: 'original', scale: 0.6, outline: false, shadow: false, pixelated: false, glow: false };
  const TILE = 34;
  const TINTS = ['#FFD166', '#FF7AA8', '#7CC4FF', '#FF6B6B', '#5EEAD4', '#C4A1FF', '#6EE7A0', '#FDBA74'].map(col);
  // Each label keeps the same colour under the light: RadialRenderer's hash of its text and place.
  const tintOf = (label, i) => { let h = i | 0; for (let k = 0; k < label.length; k++) h = (Math.imul(h, 31) + label.charCodeAt(k)) | 0; return TINTS[(h >>> 0) % TINTS.length]; };
  const stripVs = s => s.replace(/[︎️]/g, '');
  // What kind of mark a slice's icon is: a Segoe Fluent symbol, emoji, short text set in the glyph font, a picture, or a
  // legacy line drawing (the inside of a 24x24 Lucide svg).
  function kindOf(icon) {
    if (!icon) return null;
    if (icon.startsWith('img:')) return { kind: 'image', src: icon.slice(4) };
    if (/^fluent:[0-9a-f]{4}$/i.test(icon)) return { kind: 'symbol', key: 'fluent:' + icon.slice(7).toUpperCase(), text: String.fromCharCode(parseInt(icon.slice(7), 16)) };
    if (icon.trim().startsWith('<')) return { kind: 'line', body: icon };
    const plain = stripVs(icon), chars = [...plain];
    if (chars.length && chars.every(ch => ICONS[ch])) return { kind: 'emoji', chars };
    return { kind: 'text', text: plain };
  }
  // Size of a glyph line in the glyph font: Segoe UI's line (1.33 em), an emoji 1.373 em wide.
  const EMOJI_W = 1.3733, LINE = 1.33, ASCENT = 1.0791;
  function markBox(k, fs) {
    if (k.kind === 'symbol' || k.kind === 'line') return { w: fs, h: fs };
    if (k.kind === 'emoji') return { w: EMOJI_W * fs * k.chars.length, h: LINE * fs };
    if (k.kind === 'text') return { w: measurer({ family: GLYPH_FONT, weight: 400 })(k.text, fs), h: LINE * fs };
    return { w: fs, h: fs };
  }
  // Where the emoji drawing sits in its line, measured on the app's renders: a little larger than the em, its middle at 0.715 em.
  const EM_SIZE = 1.15, EM_Y = 0.715;
  function markSvg(k, x, y, fs) {
    const box = markBox(k, fs);
    if (k.kind === 'symbol') {
      const ic = ICONS[k.key];
      if (ic) return `<svg x="${x}" y="${y}" width="${fs}" height="${fs}" viewBox="${ic[0]}" overflow="visible">${ic[1]}</svg>`;
      return `<text x="${x + fs / 2}" y="${y + fs * 0.86}" font-size="${fs * 0.9}" text-anchor="middle" font-family="Segoe Fluent Icons, Segoe MDL2 Assets" fill="currentColor">${esc(k.text)}</text>`;
    }
    if (k.kind === 'line') return `<svg x="${x}" y="${y}" width="${fs}" height="${fs}" viewBox="0 0 24 24" overflow="visible" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${k.body}</svg>`;
    if (k.kind === 'emoji') {
      const e = EM_SIZE * fs, w = EMOJI_W * fs;
      return k.chars.map((ch, j) => `<svg x="${x + j * w + (w - e) / 2}" y="${y + EM_Y * fs - e / 2}" width="${e}" height="${e}" viewBox="${ICONS[ch][0]}" overflow="visible">${ICONS[ch][1]}</svg>`).join('');
    }
    if (k.kind === 'text') return `<text x="${x + box.w / 2}" y="${y + ASCENT * fs}" font-size="${fs}" text-anchor="middle" font-family="${GLYPH_FONT}" fill="currentColor">${esc(k.text)}</text>`;
    return '';
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // IconArt.Pixelate: the mark drawn on an 11 x 11 grid and blown back up without smoothing.
  const pixCache = new Map();
  function pixelated(k, size, ink) {
    const key = [k.kind, k.key || k.text || k.body || (k.chars || []).join(''), size, css(ink)].join('|');
    if (!pixCache.has(key)) pixCache.set(key, drawPixelated(k, size, ink));
    return pixCache.get(key);
  }
  function drawPixelated(k, size, ink) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 11;
    const g = cv.getContext('2d'), sc = 11 / size;
    g.scale(sc, sc); g.fillStyle = css(ink); g.strokeStyle = css(ink);
    const fs = k.kind === 'symbol' ? size : size * 0.9, box = markBox(k, fs), x = (size - box.w) / 2, y = (size - box.h) / 2;
    const drawIcon = (ic, ox, oy, w) => {
      const [vx, vy, vw] = ic[0].split(' ').map(Number);
      g.save(); g.translate(ox, oy); g.scale(w / vw, w / vw); g.translate(-vx, -vy);
      for (const m of ic[1].matchAll(/<path([^>]*?)d="([^"]+)"([^>]*)>/g)) g.fill(new Path2D(m[2]), /evenodd/.test(m[1] + m[3]) ? 'evenodd' : 'nonzero');
      g.restore();
    };
    if (k.kind === 'symbol' && ICONS[k.key]) drawIcon(ICONS[k.key], x, y, fs);
    else if (k.kind === 'emoji') k.chars.forEach((ch, j) => { const e = EM_SIZE * fs, w = EMOJI_W * fs; drawIcon(ICONS[ch], x + j * w + (w - e) / 2, y + EM_Y * fs - e / 2, e); });
    else if (k.kind === 'line') { g.save(); g.translate(x, y); g.scale(fs / 24, fs / 24); g.lineWidth = 1.8; for (const m of k.body.matchAll(/d="([^"]+)"/g)) g.stroke(new Path2D(m[1])); g.restore(); }
    else { g.font = `400 ${fs}px ${GLYPH_FONT}`; g.textAlign = 'center'; g.fillText(k.kind === 'symbol' ? k.text : k.text || '', x + box.w / 2, y + ASCENT * fs); }
    return `<image href="${cv.toDataURL()}" x="0" y="0" width="${size}" height="${size}" style="image-rendering:pixelated" preserveAspectRatio="none"/>`;
  }
  // A program's picture in a one-colour pack (IconArt.ToneMask) or blown up from 11 x 11 pixels: both need the picture
  // loaded, so the first drawing shows the plain picture and every copy of it is swapped once it has loaded.
  const derived = new Map();   // 'mono|src' / 'pix|src' -> data URL
  const loading = new Set();
  function picture(kind, src) {
    const key = kind + '|' + src;
    if (derived.has(key)) return derived.get(key);
    if (!loading.has(src)) {
      loading.add(src);
      const im = new Image();
      im.onload = () => {
        derived.set('mono|' + src, toneMask(im));
        const cv = document.createElement('canvas'); cv.width = cv.height = 11;
        cv.getContext('2d').drawImage(im, 0, 0, 11, 11);
        derived.set('pix|' + src, cv.toDataURL());
        document.querySelectorAll('[data-rd-mono]').forEach(e => { if (e.dataset.rdMono === src) e.style.setProperty('--mask', `url("${derived.get('mono|' + src)}")`); });
        document.querySelectorAll('[data-rd-pix]').forEach(e => { if (e.dataset.rdPix === src) e.setAttribute('href', derived.get('pix|' + src)); });
      };
      im.src = src;
    }
    return null;
  }
  // IconArt.ToneMask: a picture that fills a square or a disc shows its light and dark as the mark (the minority tone in
  // full ink, the plate at 0.3); one with a shape of its own keeps its outline.
  function toneMask(im) {
    const W = 64, cv = document.createElement('canvas'); cv.width = cv.height = W;
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0, W, W);
    const d = g.getImageData(0, 0, W, W), p = d.data, n = W * W, luma = new Float64Array(n), hist = new Array(256).fill(0);
    let solid = 0, l = W, t = W, r = -1, b = -1;
    for (let i = 0; i < n; i++) {
      const a = p[i * 4 + 3]; if (!a) continue;
      luma[i] = 0.114 * p[i * 4 + 2] + 0.587 * p[i * 4 + 1] + 0.299 * p[i * 4];
      if (a < 128) continue;
      hist[Math.min(255, Math.max(0, luma[i] | 0))]++; solid++;
      const x = i % W, y = (i / W) | 0; l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
    }
    const out = new Uint8ClampedArray(p.length);
    const pct = share => { let seen = 0; for (let v = 0; v < 256; v++) { seen += hist[v]; if (seen >= share * solid) return v; } return 255; };
    const lo = pct(0.05), hi = pct(0.95), shaped = !solid || solid < 0.6 * (r - l + 1) * (b - t + 1) || hi - lo < 32;
    let sum = 0;
    if (!shaped) for (let i = 0; i < n; i++) if (p[i * 4 + 3] >= 128) sum += Math.min(1, Math.max(0, (luma[i] - lo) / (hi - lo)));
    const flip = sum / solid > 0.5;
    for (let i = 0; i < n; i++) {
      const a = p[i * 4 + 3], tone = shaped ? 1 : Math.min(1, Math.max(0, (luma[i] - lo) / (hi - lo)));
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255;
      out[i * 4 + 3] = shaped ? a : Math.round(a * (0.3 + 0.7 * (flip ? 1 - tone : tone)));
    }
    g.putImageData(new ImageData(out, W, W), 0, 0);
    return cv.toDataURL();
  }
  function monoSpan(src) {
    const m = picture('mono', src) || src;
    return `<span data-rd-mono="${esc(src)}" style="display:block;width:100%;height:100%;background:currentColor;--mask:url('${esc(m)}');-webkit-mask:var(--mask) center/contain no-repeat;mask:var(--mask) center/contain no-repeat"></span>`;
  }
  const packOf = (ringEl) => (ringEl && ringEl._pack) || ORIGINAL;
  // IconArt.TileBrush: the pack's colours taken in turn round the ring; "theme" is the ring's highlight.
  function tileOf(pack, i) {
    const list = pack.colors.length ? pack.colors : ['theme'];
    const spec = list[((i % list.length) + list.length) % list.length];
    if (/^theme$/i.test(spec)) return { kind: 'hover' };
    const c = col(spec.startsWith('#') ? spec : '#' + spec);
    return pack.gradient ? { kind: 'grad', c, c2: shade(c, 0.72) } : { kind: 'solid', c };
  }
  // IconArt.ReadableAccent: the highlight's edge colour, unless it is lost on what the icon sits on.
  function accentInk(pack, v, i) {
    const accent = col(v.hoverStroke), tile = tileOf(pack, i);
    const base = tile.kind === 'hover' ? col(v.hoverTop) : tile.c;
    const onTile = pack.frame !== 'none' && base.a >= 128 / 255;
    const behind = onTile ? base : col(v.sliceTop);
    if (contrast(accent, behind) >= 3) return accent;
    return onTile ? (lum(behind) > 0.35 ? BLACK : WHITE) : col(v.label);
  }
  function inkOf(pack, v, i) {
    const g = pack.glyph.toLowerCase();
    return g === 'label' ? col(v.label) : g === 'accent' ? accentInk(pack, v, i) : col(pack.glyph.startsWith('#') ? pack.glyph : '#' + pack.glyph);
  }
  let artSeq = 0;
  // A slice's icon as IconArt.Create draws it: { html, w, h (DIPs, margins included), bare (the light repaints it) }.
  function art(icon, v, pack, i, label, opts = {}) {
    const k = kindOf(icon);
    if (!k) return null;
    const framed = pack.frame !== 'none', ink = inkOf(pack, v, i), uid = `ra${++artSeq}`;
    // ---- no frame: the bare mark (Original and Mono packs), a picture as it is ----
    if (!framed) {
      if (k.kind === 'image') {
        const s = 28;
        const mono = pack.images === 'mono';
        const inner = mono ? monoSpan(k.src) : `<img src="${esc(k.src)}" alt="" style="display:block;width:100%;height:100%;object-fit:contain">`;
        return { w: s, h: s + 2, bare: mono, ink, html: `<span class="ring-ico${mono ? ' is-bare' : ''}" style="display:block;margin:0 auto ${dip(2)};width:${dip(s)};height:${dip(s)};--ink:${css(ink)}">${inner}</span>` };
      }
      const fs = k.kind === 'symbol' || k.kind === 'line' ? 24 : 22, box = markBox(k, fs);
      const glow = pack.glow ? `<defs>${glowDefs(uid, ink, 10, 0.9)}</defs>` : '';
      const body = `<g${pack.glow ? ` filter="url(#${uid}g)"` : ''}>${markSvg(k, 0, 0, fs)}</g>`;
      return { w: box.w, h: box.h + 2, bare: true, ink,
        html: `<span class="ring-ico is-bare" style="display:block;margin:0 auto ${dip(2)};width:${dip(box.w)};height:${dip(box.h)};--ink:${css(ink)}"><svg viewBox="0 0 ${box.w} ${box.h}" style="display:block;width:100%;height:100%;overflow:visible;fill:currentColor;stroke:none" aria-hidden="true">${glow}${body}</svg></span>` };
    }
    // ---- a tile: the pack's frame in its colour, the mark on it ----
    const t = TILE, tile = tileOf(pack, i);
    const paint = tile.kind === 'hover' ? `url(#hoverfill-${opts.uid})` : tile.kind === 'grad' ? `url(#${uid}t)` : css(tile.c);
    const colour = tile.kind === 'solid' || tile.kind === 'grad' ? tile.c : (opts.patterned ? GRAY : col(v.hoverTop));
    const solid = tile.kind !== 'solid' || (tile.c.a > 0x60 / 255);
    const edge = pack.outline ? 'currentColor' : null;
    const defs = [tile.kind === 'grad' ? `<linearGradient id="${uid}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${css(tile.c)}"/><stop offset="1" stop-color="${css(tile.c2)}"/></linearGradient>` : ''];
    const P = pts => pts.map(p => p.join(',')).join(' ');
    const stepped = (s, o) => { const q = 2, a = o, b = o + s; return [[a + 2 * q, a], [b - 2 * q, a], [b - 2 * q, a + q], [b - q, a + q], [b - q, a + 2 * q], [b, a + 2 * q], [b, b - 2 * q], [b - q, b - 2 * q], [b - q, b - q], [b - 2 * q, b - q], [b - 2 * q, b], [a + 2 * q, b], [a + 2 * q, b - q], [a + q, b - q], [a + q, b - 2 * q], [a, b - 2 * q], [a, a + 2 * q], [a + q, a + 2 * q], [a + q, a + q], [a + 2 * q, a + q]]; };
    const st = (w = 1.5) => edge ? ` stroke="${edge}" stroke-width="${w}"` : '';
    const ins = edge ? 0.75 : 0;
    let frame = '';
    switch (pack.frame) {
      case 'circle': frame = `<circle cx="${t / 2}" cy="${t / 2}" r="${t / 2 - ins}" fill="${paint}"${st()}/>`; break;
      case 'rounded': case 'squircle': { const r = t * (pack.frame === 'squircle' ? 0.34 : 0.22); frame = `<rect x="${ins}" y="${ins}" width="${t - 2 * ins}" height="${t - 2 * ins}" rx="${r}" fill="${paint}"${st()}/>`; break; }
      case 'slot':
        frame = `<rect width="${t}" height="${t}" fill="${paint}"/><polygon points="${P([[0, 0], [t, 0], [t - 3, 3], [3, 3], [3, t - 3], [0, t]])}" fill="${css(shade(colour, 0.38))}"/><polygon points="${P([[t, t], [0, t], [3, t - 3], [t - 3, t - 3], [t - 3, 3], [t, 0]])}" fill="${css(blend(colour, WHITE, 0.55))}"/>`
          + (edge ? `<rect x=".5" y=".5" width="${t - 1}" height="${t - 1}" fill="none" stroke="${edge}" stroke-width="1"/>` : '');
        break;
      case 'pixel':
        frame = `<polygon points="${P(stepped(t, 0))}" fill="${css(shade(colour, 0.45))}"/><polygon points="${P(stepped(t - 4, 2))}" fill="${paint}"/><rect x="6" y="4" width="${t - 12}" height="2" fill="${css(blend(colour, WHITE, 0.45))}"/>`;
        break;
      case 'hexagon': frame = `<polygon points="${P([[t / 2, 0.5], [t - 2, t * 0.25], [t - 2, t * 0.75], [t / 2, t - 0.5], [2, t * 0.75], [2, t * 0.25]])}" fill="${paint}"${st()} stroke-linejoin="round"/>`; break;
      case 'diamond': frame = `<polygon points="${P([[t / 2, 0.5], [t - 0.5, t / 2], [t / 2, t - 0.5], [0.5, t / 2]])}" fill="${paint}"${st()} stroke-linejoin="round"/>`; break;
      case 'bubble':
        defs.push(`<linearGradient id="${uid}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,${(150 / 255).toFixed(3)})"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient>`);
        frame = `<circle cx="${t / 2}" cy="${t / 2}" r="${t / 2 - 0.5}" fill="${paint}" stroke="${edge || css(blend(colour, WHITE, 0.5))}" stroke-width="1"/><ellipse cx="${t / 2}" cy="${2 + t * 0.21}" rx="${t * 0.36}" ry="${t * 0.21}" fill="url(#${uid}h)"/>`;
        break;
      case 'sticker': frame = `<circle cx="${t / 2}" cy="${t / 2}" r="${t / 2}" fill="#fff"/><circle cx="${t / 2}" cy="${t / 2}" r="${t / 2 - 2.5 - (edge ? 0.5 : 0)}" fill="${paint}"${st(1)}/>`; break;
    }
    // The light repaints an icon with nothing solid behind it (an outline or a clear tile), as RadialRenderer.BareInk.
    const bare = !solid && !pack.pixelated && (k.kind !== 'image' || pack.images === 'mono');
    const ms = t * pack.scale;
    let mark;
    if (k.kind === 'image') {
      const mono = pack.images === 'mono';
      const at = `x="${(t - ms) / 2}" y="${(t - ms) / 2}" width="${ms}" height="${ms}"`;
      mark = mono ? `<foreignObject ${at}>${monoSpan(k.src).replace('<span ', '<span xmlns="http://www.w3.org/1999/xhtml" ')}</foreignObject>`
        : pack.pixelated ? `<image data-rd-pix="${esc(k.src)}" href="${esc(picture('pix', k.src) || k.src)}" ${at} preserveAspectRatio="none" style="image-rendering:pixelated"/>`
        : `<image href="${esc(k.src)}" ${at}/>`;
    } else if (pack.pixelated) {
      mark = `<g transform="translate(${(t - ms) / 2} ${(t - ms) / 2})">${pixelated(k, ms, ink)}</g>`;
    } else {
      const fs = k.kind === 'symbol' || k.kind === 'line' ? ms : ms * 0.9, box = markBox(k, fs);
      mark = markSvg(k, (t - box.w) / 2, (t - box.h) / 2, fs);
    }
    if (pack.glow) defs.push(glowDefs(uid, ink, 10, 0.9));
    else if (pack.shadow) defs.push(`<filter id="${uid}g" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="1.06" dy="1.06" stdDeviation="${(6 / 3).toFixed(2)}" flood-color="#000" flood-opacity=".35"/></filter>`);
    const fx = pack.glow || pack.shadow ? ` filter="url(#${uid}g)"` : '';
    return { w: t, h: t + 3, bare, ink,
      html: `<span class="ring-ico${bare ? ' is-bare' : ''}" style="display:block;margin:0 auto ${dip(3)};width:${dip(t)};height:${dip(t)};--ink:${css(ink)}"><svg viewBox="0 0 ${t} ${t}" style="display:block;width:100%;height:100%;overflow:visible;fill:currentColor;stroke:none" aria-hidden="true"><defs>${defs.join('')}</defs><g${fx}>${frame}${mark}</g></svg></span>` };
  }
  // A WPF DropShadowEffect with no depth: a blur of the shape in one colour, under it.
  function glowDefs(id, c, radius, opacity) {
    return `<filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="${(radius / 3).toFixed(2)}" result="b"/><feFlood flood-color="${css({ ...c, a: 1 })}" flood-opacity="${opacity}"/><feComposite in2="b" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  // ---- Patterns: the app's DrawingBrush overlays, drawn in a 280 x 280 box stretched over each slice ----
  // System.Random(7), as .NET draws it (the Knuth subtractive generator), so Minecraft's blocks fall where the app's do.
  function netRandom(seed) {
    const MBIG = 2147483647, a = new Array(56).fill(0);
    let mj = 161803398 - Math.abs(seed), mk = 1; a[55] = mj;
    for (let i = 1; i < 55; i++) { const ii = (21 * i) % 55; a[ii] = mk; mk = mj - mk; if (mk < 0) mk += MBIG; mj = a[ii]; }
    for (let k = 1; k < 5; k++) for (let i = 1; i < 56; i++) { a[i] -= a[1 + (i + 30) % 55]; if (a[i] < 0) a[i] += MBIG; }
    let inext = 0, inextp = 21;
    return n => { if (++inext >= 56) inext = 1; if (++inextp >= 56) inextp = 1; let r = a[inext] - a[inextp]; if (r === MBIG) r--; if (r < 0) r += MBIG; a[inext] = r; return Math.floor(r * (1 / MBIG) * n); };
  }
  const pixelCache = new Map();
  function patternBody(kind, color, uid) {
    const c = col(color), A = Math.round(c.a * 255), at = al => css({ ...c, a: Math.min(255, al) / 255 });
    let out = '';
    if (kind === 'pixels') {
      if (pixelCache.has(color)) return pixelCache.get(color);   // 1,200 blocks: drawn once per colour
      const rnd = netRandom(7), shades = [at(A), at(Math.floor(A / 2)), at(Math.floor(A * 3 / 2))];
      for (let y = 0; y < 280; y += 8) for (let x = 0; x < 280; x += 8) { const sh = shades[rnd(3)]; if (rnd(3) !== 0) out += `<rect x="${x}" y="${y}" width="8" height="8" fill="${sh}"/>`; }
      pixelCache.set(color, out);
    } else if (kind === 'gloss') {
      out += `<linearGradient id="gl-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${at(A)}"/><stop offset="1" stop-color="${at(0)}"/></linearGradient><linearGradient id="gs-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${at(0)}"/><stop offset="1" stop-color="${at(Math.floor(A / 3))}"/></linearGradient>`
        + `<rect x="0" y="0" width="280" height="135" fill="url(#gl-${uid})"/><rect x="0" y="200" width="280" height="80" fill="url(#gs-${uid})"/>`;
    } else if (kind === 'stripes') {
      for (let d = -280; d < 560; d += 14) out += `<line x1="${d}" y1="0" x2="${d + 280}" y2="280" stroke="${at(A)}" stroke-width="3"/>`;
    } else if (kind === 'dots') {
      for (let y = 6; y < 280; y += 12) for (let x = 6; x < 280; x += 12) out += `<circle cx="${x}" cy="${y}" r="1.6" fill="${at(A)}"/>`;
    } else if (kind === 'scanlines') {
      for (let y = 0; y < 280; y += 4) out += `<rect x="0" y="${y}" width="280" height="1.2" fill="${at(A)}"/>`;
    } else if (kind === 'grid') {
      for (let q = 0; q <= 280; q += 20) out += `<line x1="${q}" y1="0" x2="${q}" y2="280" stroke="${at(A)}" stroke-width="1"/><line x1="0" y1="${q}" x2="280" y2="${q}" stroke="${at(A)}" stroke-width="1"/>`;
    }
    return out;
  }
  const PATTERNED = k => ['pixels', 'gloss', 'stripes', 'dots', 'scanlines', 'grid'].includes(String(k || '').toLowerCase());
  // RingThemeCatalog.Compose: a vertical gradient, with the pattern drawn over it, stretched over the shape's box.
  function fillDefs(id, top, bottom, v) {
    const grad = g => `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
    if (!PATTERNED(v.pattern)) return grad(id);
    return `${grad(id + '-g')}<pattern id="${id}" patternUnits="objectBoundingBox" width="1" height="1" viewBox="0 0 280 280" preserveAspectRatio="none"><rect width="280" height="280" fill="url(#${id}-g)"/>${patternBody(v.pattern.toLowerCase(), v.patternColor, id)}</pattern>`;
  }
  function defsFor(uid, v) {
    const e = col(v.hoverTop), m = col(v.hoverBottom), stroke = col(v.hoverStroke), sh = col(v.shadow);
    const shadowAt = share => css({ ...sh, a: Math.round(v.shadowOpacity * 255 * share) / 255 });
    const outer = 140 + 22;
    // WPF's DropShadowEffect draws its colour at the effect's opacity (0.95); the colour's own alpha does not count.
    const glow = v.glow && v.glowRadius > 0 ? (() => { const g = col(v.glow); return `<filter id="glow-${uid}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${(v.glowRadius * K / 3).toFixed(2)}" result="b"/><feFlood flood-color="${css({ ...g, a: 1 })}" flood-opacity="0.95"/><feComposite in2="b" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`; })() : '';
    return `<defs>
      ${fillDefs(`slicefill-${uid}`, v.sliceTop, v.sliceBottom, v)}
      ${fillDefs(`hoverfill-${uid}`, v.hoverTop, v.hoverBottom, v)}
      <radialGradient id="shadow-${uid}" cx=".5" cy=".5" r=".5"><stop offset="${((140 - 10) / outer).toFixed(4)}" stop-color="${shadowAt(1)}"/><stop offset="${(140 / outer).toFixed(4)}" stop-color="${shadowAt(0.62)}"/><stop offset="${(148 / outer).toFixed(4)}" stop-color="${shadowAt(0.22)}"/><stop offset="1" stop-color="${shadowAt(0)}"/></radialGradient>
      <radialGradient id="light-${uid}" cx=".5" cy="0" r="1.05" fx=".5" fy="0"><stop offset="0" stop-color="${css({ ...e, a: LIGHT_EDGE })}"/><stop offset=".5" stop-color="${css({ ...m, a: LIGHT_MID })}"/><stop offset="1" stop-color="${css({ ...m, a: 0 })}"/></radialGradient>
      ${glow}</defs>`;
  }

  // ---- The renderer's own rules: what every page's ring must look like, whatever its stylesheet says ----
  let styled = false;
  function style() {
    if (styled) return; styled = true;
    document.head.insertAdjacentHTML('beforeend', `<style id="rd-ring-css">
.ring, .how-ring { container-type: inline-size; }
.ring-svg { overflow: visible; }
.ring-svg .slice { fill: var(--r-fill) !important; stroke: var(--r-stroke) !important; stroke-width: var(--r-stroke-w, 1) !important; fill-opacity: var(--r-slice-op, 1) !important; stroke-opacity: 1 !important; filter: none !important; }
.ring-svg .slice-lit { opacity: 0; pointer-events: none; transition: opacity .12s; }
.ring-svg .slice.is-hot + .slice-lit { opacity: 1; }
.ring-svg .ring-hubdisc { pointer-events: none; }
.ring > .ring-svg, .how-ring > .ring-svg { filter: none !important; }
.ring-hub { background: none !important; border-color: transparent !important; }
.ring-ico { color: var(--ink); }
.ring-label .ring-ico { transition: transform .28s cubic-bezier(.3,1.35,.55,1); }
.ring-label.is-hot .ring-ico.is-bare { color: var(--ink-lit); }
.ring-label.is-hot .ring-ico { transform: translate(var(--lift-x, 0), var(--lift-y, 0)) scale(1.08); }
.ring-label.is-hot { color: var(--r-label-lit) !important; }
.ring-label .ring-txt { display: block; white-space: pre; position: relative; letter-spacing: 0 !important; text-transform: none !important; }
@media (prefers-reduced-motion: reduce) { .ring-label .ring-ico { transition: none; } }
</style>`);
  }

  // ---- Theme a ring: colours as CSS variables, the gradients and pattern in the SVG's defs, the labels re-fitted ----
  let uidSeq = 0;
  function themeRing(ringEl, v) {
    style();
    if (!ringEl.dataset.uid) ringEl.dataset.uid = 'r' + (++uidSeq);
    const uid = ringEl.dataset.uid;
    const prev = ringEl._theme;
    ringEl._theme = v;
    const t = THEMES.find(x => x.dark === v || x.light === v);
    ringEl._pack = (t && t.pack) || ORIGINAL;
    const st = ringEl.style;
    st.setProperty('--r-fill', `url(#slicefill-${uid})`); st.setProperty('--r-fill-hot', `url(#hoverfill-${uid})`);
    st.setProperty('--r-pat', 'none');
    st.setProperty('--r-stroke', v.sliceStroke); st.setProperty('--r-hover-stroke', v.hoverStroke); st.setProperty('--r-stroke-w', (v.strokeWidth * K).toFixed(3));
    st.setProperty('--r-hub', v.hub); st.setProperty('--r-label', v.label); st.setProperty('--r-label-dim', v.labelDim);
    st.setProperty('--r-label-lit', css(readableLabel(v, litColour(v))));
    st.setProperty('--r-hub-label', css(readableLabel(v, col(v.hub))));
    st.setProperty('--r-glow', v.glow || 'transparent'); st.setProperty('--r-glow-r', (v.glow ? Math.round(v.glowRadius * 0.55) : 0) + 'px');
    const sh = col(v.shadow);
    st.setProperty('--r-shadow', css({ ...sh, a: v.shadowOpacity * 0.9 }));
    const fc = face(v);
    st.setProperty('--r-font', fc.family); st.setProperty('--r-weight', fc.weight);
    st.setProperty('--r-label-size', (v.labelSize || 12) * K + 'px');
    ringEl.classList.toggle('is-upper', !!v.labelUppercase);
    const svgEl = ringEl.querySelector('.ring-svg');
    if (svgEl) {
      svgEl.querySelector('defs')?.remove();
      svgEl.insertAdjacentHTML('afterbegin', defsFor(uid, v));
      paintStatic(ringEl);
    }
    if (prev !== v && ringEl._ring) paintLabels(ringEl);
  }
  // The parts of the SVG that carry theme values directly.
  function paintStatic(ringEl) {
    const svgEl = ringEl.querySelector('.ring-svg'), v = ringEl._theme, uid = ringEl.dataset.uid;
    if (!svgEl || !v) return;
    const hs = col(v.hoverStroke);
    ringEl.querySelectorAll('.slice-lit, .ring-light > path, .ring-glide').forEach(p => {
      p.setAttribute('fill', `url(#light-${uid})`); p.setAttribute('stroke', css({ ...hs, a: hs.a * 0.7 })); p.setAttribute('stroke-width', (v.strokeWidth * K).toFixed(3));
      if (v.glow && v.glowRadius > 0) p.setAttribute('filter', `url(#glow-${uid})`); else p.removeAttribute('filter');
    });
    const hub = svgEl.querySelector('.ring-hubdisc');
    if (hub) { hub.setAttribute('fill', v.hub); hub.setAttribute('stroke', v.sliceStroke); hub.setAttribute('stroke-width', (v.strokeWidth * K).toFixed(3)); hub.setAttribute('r', (HUB - 0).toFixed(3)); }
    const shadow = svgEl.querySelector('.ring-shadow');
    if (shadow) shadow.setAttribute('fill', `url(#shadow-${uid})`);
  }
  const DEFAULT_THEME = () => (themeById('glass') || { dark: null }).dark;

  // ---- Build: slices, their soft light, the hub disc, and one label (icon + text) per slice ----
  function buildRing(svgEl, labelsEl, ring) {
    style();
    const ringEl = svgEl.closest('.ring, .how-ring') || svgEl.parentElement;
    const n = ring.slices.length;
    if (!ringEl._theme) themeRing(ringEl, DEFAULT_THEME());
    const uid = ringEl.dataset.uid, lit0 = slicePath(0, n);
    const shadowR = (140 + 22) * K;
    svgEl.innerHTML = defsFor(uid, ringEl._theme)
      + `<circle class="ring-shadow" cx="${C}" cy="${C + 4 * K}" r="${shadowR}" pointer-events="none"/>`
      + ring.slices.map((_, i) => `<path class="slice" data-i="${i}" d="${slicePath(i, n)}"/><path class="slice-lit" data-i="${i}" d="${lit0}" transform="rotate(${(i * 360 / n).toFixed(4)} ${C} ${C})"/>`).join('')
      + `<circle class="ring-hubdisc" cx="${C}" cy="${C}" r="${HUB}"/>`;
    paintStatic(ringEl);
    ringEl._ring = { n, slices: ring.slices.map(s => Array.isArray(s) ? s : [s.label, s.icon]) };
    ringEl._labelsEl = labelsEl || null;
    if (labelsEl) {
      labelsEl.innerHTML = ring.slices.map((_, i) => `<div class="ring-label" data-i="${i}"></div>`).join('');
      paintLabels(ringEl);
    }
  }
  // Fits and draws every label for the ring's current theme, into the label elements that are already there.
  function paintLabels(ringEl) {
    const labelsEl = ringEl._labelsEl, ring = ringEl._ring, v = ringEl._theme;
    if (!labelsEl || !ring || !v) return;
    const pack = packOf(ringEl), fc = face(v), measure = measurer(fc), n = ring.n;
    const lit = litColour(v), patterned = PATTERNED(v.pattern), uid = ringEl.dataset.uid;
    const items = ring.slices.map(([label, icon], i) => {
      const raw = String(label ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      const a = icon ? art(icon, v, pack, i, raw, { uid, patterned }) : null;
      const text = v.labelUppercase ? raw.toUpperCase() : raw;
      const base = v.labelSize > 0 ? v.labelSize : (a ? 12 : 14);
      const start = ((i * 360 / n) - (180 / n) + 360) % 360;
      return { raw, text, a, i, slot: { text, angle: i * 360 / n, start: start + 1.2, sweep: n > 1 ? 360 / n - 2.4 : 360, art: { w: a ? a.w : 0, h: a ? a.h : 0 }, base } };
    });
    const withText = items.filter(it => it.text);
    const fits = chooseRing(withText.map(it => it.slot), 3, measure);
    const ringRadius = fits.length ? Math.hypot(fits[0].anchor[0] - CEN, fits[0].anchor[1] - CEN) : (R_IN + R_OUT) / 2;
    withText.forEach((it, k) => { it.fit = fits[k]; });
    items.forEach(it => {
      const el = labelsEl.children[it.i];
      if (!el) return;
      const f = it.fit || { size: it.slot.base, lines: [''], anchor: dpolar(ringRadius, it.slot.angle), trimmed: false };
      const lh = f.size * 1.2, ah = it.a ? it.a.h : 0;
      const [x, y] = [C + (f.anchor[0] - CEN) * K, C + (f.anchor[1] - CEN) * K];
      const rad = it.slot.angle * Math.PI / 180;
      // Set one by one: a live ring moves its labels with an inline transform and opacity of its own.
      Object.assign(el.style, { left: (x / 3.2).toFixed(4) + '%', top: (y / 3.2).toFixed(4) + '%', width: dip(96), display: 'block', gap: '0', padding: '0', lineHeight: 'normal', textAlign: 'center' });
      el.style.setProperty('--lift-x', dip(4 * Math.sin(rad)));
      el.style.setProperty('--lift-y', dip(-4 * Math.cos(rad)));
      el.style.setProperty('--ink-lit', css(readableOn(lit, tintOf(it.raw, it.i))));
      el.dataset.x = x; el.dataset.y = y; el.dataset.size = f.size;
      if (f.trimmed) el.dataset.full = it.raw; else delete el.dataset.full;
      // WPF sets a block line's baseline lower in the line than CSS does: 0.02 em, measured on the app's renders.
      el.innerHTML = (it.a ? it.a.html : '')
        + `<span class="ring-txt" style="font:${fc.weight} ${dip(f.size)}/${dip(lh)} ${fc.family};top:${dip(0.02 * f.size)}">${esc(f.lines.join('\n'))}</span>`;
    });
  }

  // A picture behind the slices, as the app draws a theme's "photo": blurred, dimmed, clipped to the ring,
  // with the resting slices turned see-through. null takes it away again.
  function setPhoto(ringEl, photo) {
    let layer = ringEl.querySelector('.ring-photo');
    // Community files are someone else's: only a picture carried inside the file, never a URL to fetch.
    if (photo && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(String(photo.image))) photo = null;
    if (!photo) { layer?.remove(); ringEl.style.removeProperty('--r-slice-op'); return; }
    if (!layer) { layer = document.createElement('div'); layer.className = 'ring-photo'; ringEl.prepend(layer); }
    layer.style.setProperty('--ph-img', `url("${photo.image}")`);
    layer.style.setProperty('--ph-blur', `${photo.blur}px`);
    layer.style.setProperty('--ph-dim', photo.dim);
    ringEl.style.setProperty('--r-slice-op', Math.max(0.1, photo.slices));
  }
  function applyThemeEverywhere(v) { document.querySelectorAll('.ring, .how-ring').forEach(r => themeRing(r, v)); }
  function sliceAt(el, clientX, clientY, n) {
    const b = el.getBoundingClientRect();
    const dx = clientX - (b.left + b.width / 2), dy = clientY - (b.top + b.height / 2);
    const dist = Math.hypot(dx, dy) / (b.width / 2) * C;
    if (dist < RI * 0.8) return -1;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90; if (deg < 0) deg += 360;
    return Math.floor(((deg + 180 / n) % 360) / (360 / n));
  }
  // An icon on its own (a bubble, the hub's back arrow), in a ring's theme and pack.
  function icon(ringEl, spec, i = 0, label = '') {
    const v = ringEl._theme || DEFAULT_THEME();
    return art(spec, v, packOf(ringEl), i, label, { uid: ringEl.dataset.uid, patterned: PATTERNED(v.pattern) });
  }

  return { I, svg, R, RI, C, K, HUB, DIP, dip, paint: paintStatic, polar, slicePath, sliceAt, THEMES, themeById, defsFor, themeRing, buildRing, setPhoto, applyThemeEverywhere, DEFAULT_THEME, icon, kindOf, tintOf, litColour, readableOn, col, css };
})();
