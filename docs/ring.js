/* RadialDeck: the ring itself.
   Shared by the landing page and the theme studio, and deliberately the only implementation:
   it reproduces what RadialDeck draws on Windows, down to the slice gradients, the tiled
   patterns, the glow on the highlighted slice and the label font. The values come from
   themes.js, which is generated from the application's own theme files. */
window.RDRing = (() => {
  // ---- Icons (Lucide, inline) ----------------------------------------------------------
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

  // ---- Ring geometry ------------------------------------------------------------------
  const R = 150, RI = 48, C = 160, GAP = 1.2;
  const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  function slicePath(i, n) {
    const sweep = 360 / n, start = -sweep / 2 + i * sweep + GAP / 2, end = start + sweep - GAP;
    const [x1, y1] = polar(R, start), [x2, y2] = polar(R, end), [x3, y3] = polar(RI, end), [x4, y4] = polar(RI, start);
    const large = sweep - GAP > 180 ? 1 : 0;
    return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${RI} ${RI} 0 ${large} 0 ${x4} ${y4} Z`;
  }
  // ---- Theme engine: the same values RadialDeck renders (site/themes.js is generated from Theme/Themes/*.json) --------
  // ---- Theme engine: the same values RadialDeck renders (site/themes.js is generated from Theme/Themes/*.json) --------
  const THEMES = window.RD_THEMES || [];
  const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];
  let uidSeq = 0;
  const esc = v => v.replace(/[^a-z0-9.,()% -]/gi, '');
  function patternBody(kind, color) {
    // Drawn in a 280x280 box that is stretched over each slice's bounding box, exactly like the app's DrawingBrush.
    const m = color.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/);
    if (!m) return '';
    const [r, g, b] = [m[1], m[2], m[3]]; const a = m[4] === undefined ? 1 : +m[4];
    const c = al => `rgba(${r},${g},${b},${Math.min(1, al).toFixed(3)})`;
    let out = '';
    if (kind === 'pixels') {
      let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
      const shades = [c(a), c(a / 2), c(a * 1.5)];
      for (let y = 0; y < 280; y += 8) for (let x = 0; x < 280; x += 8) { const sh = shades[rnd(3)]; if (rnd(3) !== 0) out += `<rect x="${x}" y="${y}" width="8" height="8" fill="${sh}"/>`; }
    } else if (kind === 'gloss') {
      out += `<rect x="0" y="0" width="280" height="135" fill="url(#gl-${uidSeq})"/><rect x="0" y="200" width="280" height="80" fill="url(#gs-${uidSeq})"/>`;
    } else if (kind === 'stripes') {
      for (let d = -280; d < 560; d += 14) out += `<line x1="${d}" y1="0" x2="${d + 280}" y2="280" stroke="${c(a)}" stroke-width="3"/>`;
    } else if (kind === 'dots') {
      for (let y = 6; y < 280; y += 12) for (let x = 6; x < 280; x += 12) out += `<circle cx="${x}" cy="${y}" r="1.6" fill="${c(a)}"/>`;
    } else if (kind === 'scanlines') {
      for (let y = 0; y < 280; y += 4) out += `<rect x="0" y="${y}" width="280" height="1.2" fill="${c(a)}"/>`;
    } else if (kind === 'grid') {
      for (let q = 0; q <= 280; q += 20) out += `<line x1="${q}" y1="0" x2="${q}" y2="280" stroke="${c(a)}" stroke-width="1"/><line x1="0" y1="${q}" x2="280" y2="${q}" stroke="${c(a)}" stroke-width="1"/>`;
    }
    return out;
  }
  function defsFor(uid, v) {
    const pc = v.patternColor.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/);
    const pa = pc ? (pc[4] === undefined ? 1 : +pc[4]) : 0;
    const zero = pc ? `rgba(${pc[1]},${pc[2]},${pc[3]},0)` : 'transparent';
    const third = pc ? `rgba(${pc[1]},${pc[2]},${pc[3]},${(pa / 3).toFixed(3)})` : 'transparent';
    const glossDefs = v.pattern === 'gloss' ? `<linearGradient id="gl-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.patternColor}"/><stop offset="1" stop-color="${zero}"/></linearGradient><linearGradient id="gs-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${zero}"/><stop offset="1" stop-color="${third}"/></linearGradient>` : '';
    const savedSeq = uidSeq; uidSeq = uid;
    const pat = v.pattern && v.pattern !== 'none' ? `<pattern id="pat-${uid}" patternUnits="objectBoundingBox" width="1" height="1" viewBox="0 0 280 280" preserveAspectRatio="none">${patternBody(v.pattern, v.patternColor)}</pattern>` : '';
    uidSeq = savedSeq;
    return `<defs>
      <linearGradient id="slice-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.sliceTop}"/><stop offset="1" stop-color="${v.sliceBottom}"/></linearGradient>
      <linearGradient id="hover-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.hoverTop}"/><stop offset="1" stop-color="${v.hoverBottom}"/></linearGradient>
      ${glossDefs}${pat}</defs>`;
  }
  function themeRing(ringEl, v) {
    if (!ringEl.dataset.uid) ringEl.dataset.uid = ++uidSeq;
    const uid = ringEl.dataset.uid;
    ringEl._theme = v;
    const st = ringEl.style;
    st.setProperty('--r-fill', `url(#slice-${uid})`); st.setProperty('--r-fill-hot', `url(#hover-${uid})`);
    st.setProperty('--r-pat', v.pattern && v.pattern !== 'none' ? `url(#pat-${uid})` : 'none');
    st.setProperty('--r-stroke', v.sliceStroke); st.setProperty('--r-hover-stroke', v.hoverStroke); st.setProperty('--r-stroke-w', v.strokeWidth);
    st.setProperty('--r-hub', v.hub); st.setProperty('--r-label', v.label); st.setProperty('--r-label-dim', v.labelDim);
    st.setProperty('--r-glow', v.glow || 'transparent'); st.setProperty('--r-glow-r', (v.glow ? Math.round(v.glowRadius * .55) : 0) + 'px');
    const sh = v.shadow.match(/rgba?\((\d+),(\d+),(\d+)/);
    st.setProperty('--r-shadow', sh ? `rgba(${sh[1]},${sh[2]},${sh[3]},${(v.shadowOpacity * .9).toFixed(2)})` : 'rgba(0,0,0,.5)');
    st.setProperty('--r-font', v.font ? `"${esc(v.font)}", var(--font-body)` : 'var(--font-body)');
    st.setProperty('--r-weight', /black/i.test(v.font) ? '800' : '600');
    st.setProperty('--r-label-size', v.labelSize ? (v.labelSize * 1.04).toFixed(1) + 'px' : '12.5px');
    ringEl.classList.toggle('is-upper', !!v.labelUppercase);
    const svgEl = ringEl.querySelector('.ring-svg');
    const old = svgEl.querySelector('defs'); if (old) old.remove();
    svgEl.insertAdjacentHTML('afterbegin', defsFor(uid, v));
  }
  const DEFAULT_THEME = () => (themeById('glass') || { dark: null }).dark;
  function buildRing(svgEl, labelsEl, ring) {
    const ringEl = svgEl.closest('.ring, .how-ring');
    const n = ring.slices.length;
    if (!ringEl._theme) themeRing(ringEl, DEFAULT_THEME());
    svgEl.innerHTML = defsFor(ringEl.dataset.uid, ringEl._theme) + ring.slices.map((_, i) => `<path class="slice" data-i="${i}" d="${slicePath(i, n)}"/><path class="slice-pat" d="${slicePath(i, n)}"/>`).join('');
    if (labelsEl) {
      labelsEl.innerHTML = ring.slices.map(([label, icon], i) => {
        const [x, y] = polar((R + RI) / 2 + 2, i * 360 / n);
        const longest = Math.max(...label.split(' ').map(w => w.length));
        const size = longest > 10 ? ' is-long' : label.length > 12 ? ' is-mid' : '';
        return `<div class="ring-label${size}" data-i="${i}" style="left:${x / 320 * 100}%;top:${y / 320 * 100}%">${svg(icon)}<span>${label}</span></div>`;
      }).join('');
    }
  }
  function applyThemeEverywhere(v) { document.querySelectorAll('.ring, .how-ring').forEach(r => themeRing(r, v)); }
  function sliceAt(el, clientX, clientY, n) {
    const b = el.getBoundingClientRect();
    const dx = clientX - (b.left + b.width / 2), dy = clientY - (b.top + b.height / 2);
    const dist = Math.hypot(dx, dy) / (b.width / 2) * R;
    if (dist < RI * 0.8) return -1;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90; if (deg < 0) deg += 360;
    return Math.floor(((deg + 180 / n) % 360) / (360 / n));
  }


  return { I, svg, R, RI, C, polar, slicePath, sliceAt, THEMES, themeById, defsFor, themeRing, buildRing, applyThemeEverywhere, DEFAULT_THEME };
})();
