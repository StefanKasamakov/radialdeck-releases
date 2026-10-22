/* Photo: a small image editor (a picture in layers, a brush you can paint with, a layers panel) whose ring holds the
   gallery's image recipes: brush size with [ and ], undo, crop, rotate, flip, black & white and export as. Export
   makes a real JPG or PNG of what you see; Ctrl+0 fits the picture to the window. */
(() => {
  const ICON = 'os/icons/photo.svg';
  const AW = 1600, AH = 1000;
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const style = href => document.querySelector(`link[href="${href}"]`) ? Promise.resolve() : new Promise(ok => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = ok; document.head.append(l); });
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const P = {
    move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    marquee: '<path d="M5 3h2M11 3h2M17 3h2M21 5v2M21 11v2M21 17v2M19 21h-2M13 21h-2M7 21H5M3 19v-2M3 13v-2M3 7V5"/>',
    lasso: '<path d="M7 22a5 5 0 0 1-2-4M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1"/><circle cx="5" cy="16" r="2"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/>',
    drop: '<path d="m2 22 1-1h3l9-9M3 21v-3l9-9M15 6l3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4z"/>',
    brush: '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    bigger: '<circle cx="12" cy="12" r="8"/><path d="M12 9v6M9 12h6"/>',
    smaller: '<circle cx="12" cy="12" r="5"/><path d="M10 12h4"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    flip: '<path d="M12 3v18"/><path d="M8 7 3 17h5zM16 7l5 10h-5z"/>',
    bw: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    export: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>',
  };
  const TOOLS = [['move', 'Move (V)'], ['marquee', 'Rectangular Marquee (M)'], ['lasso', 'Lasso (L)'], ['crop', 'Crop (C)'], ['drop', 'Eyedropper (I)'], ['brush', 'Brush (B)'], ['eraser', 'Eraser (E)'], ['text', 'Type (T)'], ['hand', 'Hand (H)'], ['zoom', 'Zoom (Z)']];
  const SWATCHES = ['#ffffff', '#1b1b1f', '#ffcf5a', '#ff6b4a', '#e8467c', '#7c5cff', '#38bdf8', '#34d399'];

  // The picture, as layers: a sky, a sun, two ranges of hills, a lake, and a title.
  const ART = `<svg class="ph-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${AW} ${AH}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28306a"/><stop offset=".45" stop-color="#b0578a"/><stop offset=".72" stop-color="#ff9a6b"/><stop offset="1" stop-color="#ffd59a"/></linearGradient>
      <radialGradient id="ph-glow"><stop offset="0" stop-color="#fff6d8"/><stop offset=".25" stop-color="#ffe0a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
      <linearGradient id="ph-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb487"/><stop offset="1" stop-color="#3a2d5c"/></linearGradient>
    </defs>
    <g data-layer="bg"><rect width="${AW}" height="${AH}" fill="url(#ph-sky)"/></g>
    <g data-layer="sun"><circle cx="1080" cy="560" r="330" fill="url(#ph-glow)"/><circle cx="1080" cy="560" r="92" fill="#fff1cf"/></g>
    <g data-layer="hills">
      <path d="M0 640 L120 590 L230 615 L380 520 L470 570 L610 480 L720 540 L830 505 L980 575 L1120 470 L1250 545 L1370 500 L1500 560 L1600 530 V1000 H0Z" fill="#8a5a88"/>
      <path d="M0 720 C220 660 420 690 640 712 S1060 650 1300 690 S1520 730 1600 700 V1000 H0Z" fill="#553c74"/>
      <rect y="760" width="${AW}" height="240" fill="url(#ph-lake)" opacity=".9"/>
      <path d="M1040 780h80M1010 810h140M1050 840h60M990 870h170" stroke="#fff1cf" stroke-width="6" stroke-linecap="round" opacity=".55"/>
      <path d="M0 860 C300 830 520 850 760 872 S1240 836 1600 858 V1000 H0Z" fill="#2c2148"/>
    </g>
    <g data-layer="title"><text x="110" y="200" fill="#fff" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-style="italic">Golden hour</text><text x="114" y="258" fill="#fff" fill-opacity=".75" font-family="'Segoe UI', Arial, sans-serif" font-size="30" letter-spacing="8">LAKE BOHINJ · 21.10</text></g>
  </svg>`;
  const LAYERS = [['title', 'Title', 'T'], ['paint', 'Layer 1', null], ['hills', 'Hills and lake', null], ['sun', 'Sun', null], ['bg', 'Background', 'lock']];

  // ---- The document: crop, rotation, flip and black & white are a state; undo steps back through it ----
  const state = c => ({ ...c.s, crop: { ...c.s.crop }, hidden: [...c.s.hidden] });
  function snap(c) {
    c.undo.push({ s: state(c), paint: c.ctx.getImageData(0, 0, AW, AH) });
    if (c.undo.length > 24) c.undo.shift();
  }
  function undo(c) {
    const u = c.undo.pop();
    if (!u) return OS.toast('Undo', 'Nothing to take back yet. Paint a stroke, then try it.', ICON);
    c.s = u.s; c.ctx.putImageData(u.paint, 0, 0);
    paint(c); layers(c);
  }
  // Paints the document: its size from the crop, its turn and mirror, its filter, fitted to the window.
  function paint(c, fit = true) {
    const { crop, rot, flip, bw } = c.s, w = crop.w * AW, h = crop.h * AH, turned = rot % 180 !== 0;
    if (fit) {
      const r = c.stage.getBoundingClientRect(), bw2 = turned ? h : w, bh2 = turned ? w : h;
      c.z = Math.max(.05, Math.min((r.width - 48) / bw2, (r.height - 48) / bh2));
    }
    Object.assign(c.doc.style, { width: w * c.z + 'px', height: h * c.z + 'px', transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`, filter: bw ? 'grayscale(1) contrast(1.08)' : '' });
    Object.assign(c.art.style, { width: AW * c.z + 'px', height: AH * c.z + 'px', left: -crop.x * AW * c.z + 'px', top: -crop.y * AH * c.z + 'px' });
    c.art.querySelectorAll('[data-layer]').forEach(g => g.style.visibility = c.s.hidden.includes(g.dataset.layer) ? 'hidden' : '');
    c.canvas.style.visibility = c.s.hidden.includes('paint') ? 'hidden' : '';
    const pw = Math.round(turned ? h : w), ph = Math.round(turned ? w : h);
    c.root.querySelector('.ph-zoom').textContent = `${Math.round(c.z * 100)}%`;
    c.root.querySelector('.ph-size').textContent = `${pw} × ${ph} px`;
    c.root.querySelector('.ph-doctab').textContent = `golden-hour.psd @ ${Math.round(c.z * 100)}% (Layer 1, RGB/8)${c.undo.length ? '*' : ''}`;
    brushUi(c);
  }
  function brushUi(c) {
    c.root.querySelector('.ph-bsize').textContent = c.size;
    c.cursor.style.width = c.cursor.style.height = Math.max(4, c.size * c.z) + 'px';
  }
  function brush(c, d) {
    c.size = Math.max(1, Math.min(400, c.size + d * (c.size < 10 ? 2 : c.size < 50 ? 6 : 20)));
    brushUi(c);
    c.root.classList.add('is-sizing'); clearTimeout(c.sizing);
    c.sizing = setTimeout(() => c.root.classList.remove('is-sizing'), 900);
  }
  function crop(c) {
    snap(c);
    const cr = c.s.crop, ov = c.root.querySelector('.ph-cropov');
    ov.classList.remove('is-on'); void ov.offsetWidth; ov.classList.add('is-on');
    setTimeout(() => {
      ov.classList.remove('is-on');
      c.s.crop = { x: cr.x + cr.w * .1, y: cr.y + cr.h * .1, w: cr.w * .8, h: cr.h * .8 };
      paint(c);
      OS.toast('Cropped', `${Math.round(c.s.crop.w * AW)} × ${Math.round(c.s.crop.h * AH)} px. Undo brings the edges back.`, ICON);
    }, 650);
  }
  const change = (c, fn) => { snap(c); fn(c.s); paint(c); };

  // ---- Painting on Layer 1 ----
  function toArt(c, e) {
    const r = c.doc.getBoundingClientRect(), a = -c.s.rot * Math.PI / 180;
    let x = (e.clientX - (r.left + r.width / 2)) / c.z, y = (e.clientY - (r.top + r.height / 2)) / c.z;
    [x, y] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    if (c.s.flip) x = -x;
    const cr = c.s.crop;
    return [x + cr.w * AW / 2 + cr.x * AW, y + cr.h * AH / 2 + cr.y * AH];
  }
  function stroke(c, from, to) {
    const g = c.ctx;
    g.globalCompositeOperation = c.tool === 'eraser' ? 'destination-out' : 'source-over';
    g.strokeStyle = c.color; g.lineWidth = c.size; g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(...from); g.lineTo(...to); g.stroke();
  }

  // ---- Export as: a real file of what is on screen ----
  function exportDialog(c) {
    const d = c.root.querySelector('.ph-export');
    d.hidden = false;
    const { crop, rot } = c.s, turned = rot % 180 !== 0;
    d.querySelector('.ph-ex-size').textContent = `${Math.round((turned ? crop.h * AH : crop.w * AW))} × ${Math.round((turned ? crop.w * AW : crop.h * AH))} px`;
    d.querySelector('.ph-ex-go').focus();
  }
  function render(c, type, quality) {
    return new Promise(done => {
      const img = new Image(), node = c.art.querySelector('svg').cloneNode(true);
      node.querySelectorAll('[data-layer]').forEach(g => { if (c.s.hidden.includes(g.dataset.layer)) g.remove(); });
      img.onload = () => {
        const { crop, rot, flip, bw } = c.s, w = crop.w * AW, h = crop.h * AH, turned = rot % 180 !== 0;
        const out = document.createElement('canvas');
        out.width = Math.round(turned ? h : w); out.height = Math.round(turned ? w : h);
        const g = out.getContext('2d');
        if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, out.width, out.height); }
        g.translate(out.width / 2, out.height / 2); g.rotate(rot * Math.PI / 180); g.scale(flip ? -1 : 1, 1);
        if (bw) g.filter = 'grayscale(1) contrast(1.08)';
        g.translate(-w / 2 - crop.x * AW, -h / 2 - crop.y * AH);
        g.drawImage(img, 0, 0, AW, AH);
        if (!c.s.hidden.includes('paint')) g.drawImage(c.canvas, 0, 0);
        out.toBlob(done, type, quality);
      };
      img.onerror = () => done(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(node));
    });
  }
  async function doExport(c) {
    const d = c.root.querySelector('.ph-export'), png = d.querySelector('input[value="png"]').checked;
    const q = +d.querySelector('.ph-ex-q').value / 100;
    d.hidden = true;
    const blob = await render(c, png ? 'image/png' : 'image/jpeg', q);
    if (!blob) return OS.toast('Export as', 'This browser would not draw the picture. Nothing was saved.', ICON);
    const name = `golden-hour${c.exports.length ? '-' + (c.exports.length + 1) : ''}.${png ? 'png' : 'jpg'}`, url = URL.createObjectURL(blob);
    c.exports.push(url);
    const kb = blob.size / 1024;
    c.root.querySelector('.ph-files').insertAdjacentHTML('beforeend', `<a class="ph-file" href="${url}" download="${name}" title="Save ${esc(name)}"><img src="${url}" alt=""><span>${esc(name)}<small>${kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'}</small></span></a>`);
    OS.toast('Exported', `${name}, ${kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'}. It is in the bar at the bottom; click it to save it.`, ICON);
  }

  function layers(c) {
    c.root.querySelector('.ph-layers').innerHTML = LAYERS.map(([id, name, mark]) => `<div class="ph-layer${c.active === id ? ' is-on' : ''}${c.s.hidden.includes(id) ? ' is-hidden' : ''}" data-id="${id}">
      <button type="button" class="ph-eye" aria-label="Show or hide ${esc(name)}" aria-pressed="${!c.s.hidden.includes(id)}">${svg(P.eye)}</button>
      <i class="ph-thumb ph-thumb-${id}">${mark === 'T' ? 'T' : ''}</i><span>${esc(name)}</span>${mark === 'lock' ? svg(P.lock) : ''}</div>`).join('');
  }

  OS.register({
    id: 'photo',
    tint: '#a5b4fc',
    async render(body, c) {
      await style('os/apps/photo.css');
      body.innerHTML = `<div class="ph os-dark">
        <div class="ph-opts">
          <span class="ph-opt-tool">${svg(P.brush)}</span>
          <label>Size: <b class="ph-bsize"></b> px</label><span class="ph-sep"></span>
          <label>Mode: <b>Normal</b></label><label>Opacity: <b>100%</b></label><label>Flow: <b>100%</b></label><span class="ph-sep"></span>
          <span class="ph-sw">${SWATCHES.map((s, i) => `<button type="button" class="ph-swatch${i === 2 ? ' is-on' : ''}" style="--c:${s}" data-c="${s}" aria-label="Colour ${s}"></button>`).join('')}</span>
          <span class="ph-hint">Paint with the mouse. Hold still for the ring.</span>
        </div>
        <nav class="ph-tools" aria-label="Tools">${TOOLS.map(([id, t]) => `<button type="button" data-tool="${id}" class="${id === 'brush' ? 'is-on' : ''}" title="${esc(t)}">${svg(P[id])}</button>`).join('')}<i class="ph-fg"></i></nav>
        <div class="ph-main">
          <div class="ph-tabs"><span class="ph-doctab"></span></div>
          <div class="ph-stage">
            <div class="ph-doc"><div class="ph-art">${ART}<canvas class="ph-canvas" width="${AW}" height="${AH}"></canvas></div><div class="ph-cropov"><i></i></div></div>
            <i class="ph-cursor" aria-hidden="true"></i>
          </div>
          <div class="ph-status"><span class="ph-zoom"></span><span class="ph-size"></span><button type="button" class="ph-fit" title="Fit on screen (Ctrl+0)">Fit</button><span class="ph-files"></span></div>
        </div>
        <aside class="ph-panel">
          <div class="ph-ptabs"><b>Layers</b><span>Channels</span><span>Paths</span></div>
          <div class="ph-pbar"><span>Normal</span><span>Opacity: 100%</span></div>
          <div class="ph-layers"></div>
          <div class="ph-adj"><b>Properties</b><p>Ring: Brush − / Brush +, Undo, Crop, Rotate, Flip, Black &amp; white, Export as.</p></div>
        </aside>
        <div class="ph-export" hidden data-no-ring>
          <div class="ph-dlg" role="dialog" aria-label="Export As">
            <h3>Export As</h3>
            <div class="ph-ex-row"><span>Format</span><label><input type="radio" name="ph-fmt" value="jpg" checked> JPG</label><label><input type="radio" name="ph-fmt" value="png"> PNG</label></div>
            <div class="ph-ex-row"><span>Quality</span><input class="ph-ex-q" type="range" min="40" max="100" value="85"><b class="ph-ex-qv">85</b></div>
            <div class="ph-ex-row"><span>Image size</span><b class="ph-ex-size"></b></div>
            <div class="ph-ex-foot"><button type="button" class="os-btn ph-ex-no">Cancel</button><button type="button" class="os-btn os-btn-primary ph-ex-go">Export</button></div>
          </div>
        </div>
      </div>`;
      const root = c.root = body.querySelector('.ph');
      c.stage = root.querySelector('.ph-stage'); c.doc = root.querySelector('.ph-doc'); c.art = root.querySelector('.ph-art');
      c.canvas = root.querySelector('.ph-canvas'); c.ctx = c.canvas.getContext('2d'); c.cursor = root.querySelector('.ph-cursor');
      c.s = { rot: 0, flip: false, bw: false, crop: { x: 0, y: 0, w: 1, h: 1 }, hidden: [] };
      c.undo = []; c.size = 24; c.color = SWATCHES[2]; c.tool = 'brush'; c.active = 'paint'; c.exports = [];
      root.querySelector('.ph-fg').style.background = c.color;
      layers(c);
      requestAnimationFrame(() => paint(c));
      new ResizeObserver(() => paint(c)).observe(c.stage);

      // A stroke starts at once; if the press turns into the ring instead, the dot it left goes again.
      let last = null, before = null;
      c.stage.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !['brush', 'eraser'].includes(c.tool) || !e.target.closest('.ph-doc')) return;
        before = { s: state(c), paint: c.ctx.getImageData(0, 0, AW, AH) };
        last = toArt(c, e); stroke(c, last, last);
        c.stage.setPointerCapture(e.pointerId);
      });
      c.stage.addEventListener('pointermove', e => {
        const r = c.stage.getBoundingClientRect();
        c.cursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%)`;
        c.stage.classList.toggle('is-over', !!e.target.closest('.ph-doc') && ['brush', 'eraser'].includes(c.tool));
        if (!last) return;
        if (OS.ring.held) { c.ctx.putImageData(before.paint, 0, 0); last = null; before = null; return; }
        const p = toArt(c, e); stroke(c, last, p); last = p;
      });
      const end = () => {
        if (before && OS.ring.held) c.ctx.putImageData(before.paint, 0, 0);
        else if (last && before) { c.undo.push(before); if (c.undo.length > 24) c.undo.shift(); paint(c, false); }
        last = null; before = null;
      };
      c.stage.addEventListener('pointerup', end);
      c.stage.addEventListener('pointercancel', end);
      c.stage.addEventListener('pointerleave', () => c.stage.classList.remove('is-over'));
      root.querySelector('.ph-tools').addEventListener('click', e => {
        const b = e.target.closest('[data-tool]');
        if (!b) return;
        if (b.dataset.tool === 'crop') return crop(c);
        c.tool = b.dataset.tool;
        root.querySelectorAll('.ph-tools [data-tool]').forEach(x => x.classList.toggle('is-on', x === b));
        root.querySelector('.ph-opt-tool').innerHTML = svg(P[c.tool]);
      });
      root.querySelector('.ph-sw').addEventListener('click', e => {
        const b = e.target.closest('.ph-swatch');
        if (!b) return;
        c.color = b.dataset.c; root.querySelector('.ph-fg').style.background = c.color;
        root.querySelectorAll('.ph-swatch').forEach(x => x.classList.toggle('is-on', x === b));
      });
      root.querySelector('.ph-layers').addEventListener('click', e => {
        const row = e.target.closest('.ph-layer');
        if (!row) return;
        if (e.target.closest('.ph-eye')) { const id = row.dataset.id; change(c, s => { s.hidden = s.hidden.includes(id) ? s.hidden.filter(x => x !== id) : [...s.hidden, id]; }); }
        else c.active = row.dataset.id;
        layers(c);
      });
      root.querySelector('.ph-fit').addEventListener('click', () => paint(c));
      const ex = root.querySelector('.ph-export');
      ex.querySelector('.ph-ex-q').addEventListener('input', e => { ex.querySelector('.ph-ex-qv').textContent = e.target.value; });
      ex.addEventListener('change', () => { ex.querySelector('.ph-ex-q').disabled = ex.querySelector('input[value="png"]').checked; });
      ex.querySelector('.ph-ex-no').addEventListener('click', () => { ex.hidden = true; });
      ex.querySelector('.ph-ex-go').addEventListener('click', () => doExport(c));
      body.addEventListener('keydown', e => {
        if (!ex.hidden) { if (e.key === 'Escape') { e.stopPropagation(); ex.hidden = true; } return; }
        if (e.target.closest('input')) return;
        const k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
        const act = e.key === '[' ? () => brush(c, -1) : e.key === ']' ? () => brush(c, 1) : ctrl && k === 'z' ? () => undo(c) : ctrl && k === '0' ? () => paint(c)
          : ctrl && e.altKey && e.shiftKey && k === 'w' ? () => exportDialog(c) : !ctrl && k === 'b' ? () => root.querySelector('[data-tool="brush"]').click() : !ctrl && k === 'e' ? () => root.querySelector('[data-tool="eraser"]').click() : null;
        if (act) { e.preventDefault(); act(); }
      });
    },
    onClose(c) { c.exports?.forEach(u => URL.revokeObjectURL(u)); },
    // The gallery's image recipes: [ and ] for the brush (Photoshop, Krita, GIMP, Paint.NET), Undo, Crop, Export as.
    ring: [
      { label: 'Undo', icon: P.undo, tint: '#7cc4ff', say: 'Takes back the last thing you did.', run: c => undo(c) },
      { label: 'Brush +', icon: P.bigger, tint: '#6ee7a0', say: 'The ] key: a bigger brush.', run: c => brush(c, 1) },
      { label: 'Rotate', icon: P.rotate, tint: '#5eead4', say: 'Turns the picture 90° clockwise.', run: c => change(c, s => { s.rot = (s.rot + 90) % 360; }) },
      { label: 'Flip', icon: P.flip, tint: '#a5b4fc', say: 'Mirrors the picture left to right.', run: c => change(c, s => { s.flip = !s.flip; }) },
      { label: 'Export as', icon: P.export, tint: '#fdba74', say: 'Saves a JPG or a PNG of the picture.', run: c => exportDialog(c) },
      { label: 'Black & white', icon: P.bw, tint: '#e5e7eb', say: 'Takes the colour out, or puts it back.', run: c => change(c, s => { s.bw = !s.bw; }) },
      { label: 'Crop', icon: P.crop, tint: '#ff7aa8', say: 'Crops to the frame: a tenth off each edge.', run: c => crop(c) },
      { label: 'Brush −', icon: P.smaller, tint: '#ffd166', say: 'The [ key: a smaller brush.', run: c => brush(c, -1) },
    ],
  });
})();
