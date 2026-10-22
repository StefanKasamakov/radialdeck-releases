/* CAD: a 2D drafting window with a real little floor plan (mm, 1:100), a ribbon, a command line and a status bar,
   whose ring holds the gallery's AutoCAD recipes: zoom extents, Osnap / Ortho / Polar, plot, purge, the Properties
   palette and clean screen. The command line takes the usual commands too (Z E, PURGE, AUDIT, PLOT, PR, F3, F8...). */
(() => {
  const ICON = 'os/icons/cad.svg';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const style = href => document.querySelector(`link[href="${href}"]`) ? Promise.resolve() : new Promise(ok => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = ok; document.head.append(l); });
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const f4 = n => n.toFixed(4);

  // ---- The drawing: a flat, 12 x 8 m, in millimetres. SVG's y runs down; the coordinates shown run up. ----
  const W = 12000, H = 8000;
  const ROOMS = [
    ['LIVING ROOM', 300, 300, 6000, 5000], ['KITCHEN', 6120, 300, 11700, 4000], ['BEDROOM', 6120, 4120, 11700, 7700],
    ['BATH', 300, 5120, 3000, 7700], ['HALL', 3120, 5120, 6000, 7700],
  ];
  // Doors: the opening in the wall, and which way the leaf swings.
  const DOORS = [[4000, 7700, 4900, 8000, 'up'], [4200, 5000, 5000, 5120, 'up'], [3000, 6000, 3120, 6700, 'left'], [6000, 6400, 6120, 7200, 'right']];
  const ARCH = [[6000, 1500, 6120, 2500]];
  const WINDOWS = [[1200, 0, 3600, 300], [7800, 0, 9800, 300], [11700, 5000, 12000, 6800], [0, 1800, 300, 3600], [1100, 7700, 1900, 8000], [11700, 1200, 12000, 2800]];

  function drawing() {
    const out = [], L = (x1, y1, x2, y2) => `M${x1} ${y1}L${x2} ${y2}`;
    const ob = (type, layer, body, info = '') => out.push(`<g class="ob" data-type="${type}" data-layer="${layer}" data-info="${esc(info)}">${body}</g>`);
    // Walls: the outline minus the rooms (even-odd), hatched; the openings are cut out over it.
    const rect = (x1, y1, x2, y2) => `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
    out.push(`<path class="L-patt" d="${rect(0, 0, W, H)}${ROOMS.map(r => rect(r[1], r[2], r[3], r[4])).join('')}" fill="url(#ca-ansi31)" fill-rule="evenodd"/>`);
    out.push(`<path class="L-wall ob-wall" d="${rect(0, 0, W, H)}${ROOMS.map(r => rect(r[1], r[2], r[3], r[4])).join('')}" fill="none"/>`);
    const cut = [], jambs = [];
    for (const [x1, y1, x2, y2] of [...DOORS, ...ARCH, ...WINDOWS]) {
      const hz = x2 - x1 > y2 - y1, e = 60;
      cut.push(hz ? rect(x1, y1 - e, x2, y2 + e) : rect(x1 - e, y1, x2 + e, y2));
      jambs.push(hz ? L(x1, y1, x1, y2) + L(x2, y1, x2, y2) : L(x1, y1, x2, y1) + L(x1, y2, x2, y2));
    }
    out.push(`<path class="ca-cut" d="${cut.join('')}"/><path class="L-wall" d="${jambs.join('')}" fill="none"/>`);
    // Doors: a leaf and its swing.
    DOORS.forEach(([x1, y1, x2, y2, into], i) => {
      const hz = x2 - x1 > y2 - y1, w = hz ? x2 - x1 : y2 - y1;
      const face = { up: y1, down: y2, left: x1, right: x2 }[into], s = into === 'up' || into === 'left' ? -1 : 1;
      const hinge = hz ? [x1, face] : [face, y1], leaf = hz ? [x1, face + s * w] : [face + s * w, y1], end = hz ? [x2, face] : [face, y2];
      const cross = (leaf[0] - hinge[0]) * (end[1] - hinge[1]) - (leaf[1] - hinge[1]) * (end[0] - hinge[0]);
      ob('Block Reference', 'A-DOOR', `<path class="L-door" d="${L(...hinge, ...leaf)}M${leaf[0]} ${leaf[1]}A${w} ${w} 0 0 ${cross > 0 ? 1 : 0} ${end[0]} ${end[1]}"/>`, `Name=DOOR-${w}|Position X=${f4(hinge[0])}|Position Y=${f4(H - hinge[1])}|Rotation=${{ up: 90, down: 270, left: 180, right: 0 }[into]}`);
    });
    WINDOWS.forEach(([x1, y1, x2, y2]) => {
      const hz = x2 - x1 > y2 - y1, m = hz ? (y1 + y2) / 2 : (x1 + x2) / 2;
      const d = hz ? L(x1, y1, x2, y1) + L(x1, y2, x2, y2) + L(x1, m - 30, x2, m - 30) + L(x1, m + 30, x2, m + 30)
        : L(x1, y1, x1, y2) + L(x2, y1, x2, y2) + L(m - 30, y1, m - 30, y2) + L(m + 30, y1, m + 30, y2);
      ob('Block Reference', 'A-GLAZ', `<path class="L-glaz" d="${d}"/>`, `Name=WIN-${hz ? x2 - x1 : y2 - y1}|Position X=${f4(x1)}|Position Y=${f4(H - y2)}`);
    });
    // Furniture, each a block.
    const F = (name, d) => ob('Block Reference', 'A-FURN', `<path class="L-furn" d="${d}"/>`, `Name=${name}`);
    F('SOFA-3', rect(800, 4000, 3200, 4800) + L(800, 4620, 3200, 4620) + L(1050, 4000, 1050, 4620) + L(2950, 4000, 2950, 4620) + L(1683, 4000, 1683, 4620) + L(2316, 4000, 2316, 4620));
    F('TABLE-COFFEE', rect(1500, 2900, 2500, 3450));
    F('TABLE-ROUND-4', `M5150 2200a550 550 0 1 0 -1100 0a550 550 0 1 0 1100 0Z` + rect(4400, 1250, 4800, 1550) + rect(4400, 2850, 4800, 3150) + rect(3650, 2000, 3950, 2400) + rect(5250, 2000, 5550, 2400));
    F('KITCHEN-RUN', `M6800 350H11650V2500H11050V950H6800Z` + rect(8300, 420, 9100, 880) + rect(8380, 480, 9020, 820)
      + rect(10000, 420, 10600, 880) + [[10150, 550], [10450, 550], [10150, 760], [10450, 760]].map(([x, y]) => `M${x + 90} ${y}a90 90 0 1 0 -180 0a90 90 0 1 0 180 0Z`).join(''));
    F('FRIDGE', rect(6170, 350, 6770, 1000) + L(6170, 350, 6770, 1000) + L(6770, 350, 6170, 1000));
    F('ISLAND', rect(8000, 2200, 10000, 3000));
    F('BED-1600', rect(8000, 5600, 9600, 7650) + L(8000, 6400, 9600, 6400) + rect(8100, 7150, 8750, 7550) + rect(8850, 7150, 9500, 7550));
    F('NIGHTSTAND', rect(7450, 7150, 7950, 7650) + rect(9650, 7150, 10150, 7650));
    F('WARDROBE', rect(6170, 4170, 6770, 6200) + L(6170, 5185, 6770, 5185) + L(6470, 4170, 6470, 6200));
    F('BATHTUB', rect(350, 5170, 1100, 6900) + `M450 5350a80 80 0 0 1 80 -80H920a80 80 0 0 1 80 80V6720a80 80 0 0 1 -80 80H530a80 80 0 0 1 -80 -80Z`);
    F('WC', rect(2150, 7480, 2650, 7680) + `M2590 7200a190 260 0 1 0 -380 0a190 260 0 1 0 380 0Z`);
    F('BASIN', rect(2400, 5170, 2950, 5650) + `M2850 5420a175 140 0 1 0 -350 0a175 140 0 1 0 350 0Z`);
    F('SHOE-CABINET', rect(3170, 5170, 3570, 5900) + L(3170, 5535, 3570, 5535));
    // Room names and areas.
    ROOMS.forEach(([name, x1, y1, x2, y2]) => {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, a = ((x2 - x1) * (y2 - y1) / 1e6).toFixed(2);
      const [dx, dy] = { 'LIVING ROOM': [0, -700], KITCHEN: [0, 1300], BEDROOM: [-1400, -400], BATH: [250, 0], HALL: [0, -600] }[name];
      ob('MText', 'A-ANNO-TEXT', `<text class="L-text" x="${cx + dx}" y="${cy + dy}" font-size="230">${name}</text><text class="L-text" x="${cx + dx}" y="${cy + dy + 300}" font-size="170">${a} m²</text>`, `Contents=${name}\\P${a} m²|Style=ARCH-NOTES|Text height=230.0000`);
    });
    // Dimensions: architectural ticks, text over the line.
    const tick = (x, y) => L(x - 70, y + 70, x + 70, y - 70);
    const dimH = (x1, x2, y, from) => ob('Rotated Dimension', 'A-ANNO-DIMS', `<path class="L-dims" d="${L(x1 - 150, y, x2 + 150, y)}${L(x1, from - 150, x1, y - 150)}${L(x2, from - 150, x2, y - 150)}${tick(x1, y)}${tick(x2, y)}"/><text class="L-dims-t" x="${(x1 + x2) / 2}" y="${y - 90}" font-size="200">${x2 - x1}</text>`, `Measurement=${f4(x2 - x1)}|Dim style=ARCH-100`);
    const dimV = (y1, y2, x, from) => ob('Rotated Dimension', 'A-ANNO-DIMS', `<path class="L-dims" d="${L(x, y1 - 150, x, y2 + 150)}${L(from - 150, y1, x - 150, y1)}${L(from - 150, y2, x - 150, y2)}${tick(x, y1)}${tick(x, y2)}"/><text class="L-dims-t" x="${x - 90}" y="${(y1 + y2) / 2}" font-size="200" transform="rotate(-90 ${x - 90} ${(y1 + y2) / 2})">${y2 - y1}</text>`, `Measurement=${f4(y2 - y1)}|Dim style=ARCH-100`);
    dimH(0, 6060, -700, 0); dimH(6060, W, -700, 0); dimH(0, W, -1400, 0);
    dimV(0, 5060, -700, 0); dimV(5060, H, -700, 0); dimV(0, H, -1400, 0);
    return out.join('');
  }
  // Where Osnap can land: the corners of the walls and the ends of every opening.
  const SNAPS = [[0, 0], [W, 0], [W, H], [0, H], ...ROOMS.flatMap(([, a, b, c, d]) => [[a, b], [c, b], [c, d], [a, d]]),
    ...[...DOORS, ...ARCH, ...WINDOWS].flatMap(([a, b, c, d]) => [[a, b], [c, b], [c, d], [a, d]])];
  const EXTENTS = [-1700, -1700, W + 2000, H + 2000];

  const LAYERS = ['0', 'A-WALL', 'A-WALL-PATT', 'A-DOOR', 'A-GLAZ', 'A-FURN', 'A-ANNO-DIMS', 'A-ANNO-TEXT', 'Defpoints'];
  const UNUSED = { blocks: ['CHAIR-OLD', 'DOOR-750-TEMP', 'A$C1F2B7E4'], layers: ['A-OLD-XREF', 'TEMP', 'S-GRID', 'E-LITE', 'A-FLOR-EVTR'], styles: ['Annotative-OLD', 'ROMANS-2'], linetypes: ['HIDDEN2', 'CENTER2', 'PHANTOM', 'DASHDOT'] };

  // ---- Ribbon ----
  const I = {
    line: '<path d="M4 20 20 4"/><rect x="2" y="18" width="4" height="4"/><rect x="18" y="2" width="4" height="4"/>',
    pline: '<path d="M3 19 8 8l6 7 7-11"/>',
    circle: '<circle cx="12" cy="12" r="8"/><path d="M12 12h8"/>',
    arc: '<path d="M4 18a10 10 0 0 1 16 0"/>',
    move: '<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    trim: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    mirror: '<path d="M12 3v18"/><path d="M3 17 9 7v10zM21 17l-6-10v10z"/>',
    fillet: '<path d="M4 4v8a8 8 0 0 0 8 8h8"/>',
    scale: '<rect x="3" y="11" width="10" height="10"/><path d="M13 11V3h8v8h-8M16 8l5-5"/>',
    array: '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/>',
    erase: '<path d="m7 21-4-4L14 6l7 7-8 8zM10 10l7 7"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    dim: '<path d="M3 8v8M21 8v8M3 12h18M6 10l-3 2 3 2M18 10l3 2-3 2"/>',
    leader: '<path d="M4 20 14 10h7M4 20l1-4M4 20l4-1"/>',
    table: '<rect x="3" y="4" width="18" height="16"/><path d="M3 10h18M3 15h18M10 4v16"/>',
    insert: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 21V9"/>',
    measure: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    audit: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    clean: '<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/>',
    zoomExt: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 8h6v6H8z"/>',
    osnap: '<rect x="8" y="8" width="8" height="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    ortho: '<path d="M5 3v16h16"/><path d="M5 19 19 5" stroke-dasharray="2 3"/>',
    polar: '<path d="M4 20 20 4" stroke-dasharray="2 3"/><path d="M4 20h16M4 20a14 14 0 0 1 4-10"/>',
    plot: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    purge: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    props: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M12 8h6M12 12h6M12 16h6"/>',
  };
  const RIBBON = [
    ['Draw', [['Line', 'line', 'LINE', 1], ['Polyline', 'pline', 'PLINE', 1], ['Circle', 'circle', 'CIRCLE', 1], ['Arc', 'arc', 'ARC', 1]]],
    ['Modify', [['Move', 'move', 'MOVE'], ['Rotate', 'rotate', 'ROTATE'], ['Trim', 'trim', 'TRIM'], ['Copy', 'copy', 'COPY'], ['Mirror', 'mirror', 'MIRROR'], ['Fillet', 'fillet', 'FILLET'], ['Scale', 'scale', 'SCALE'], ['Array', 'array', 'ARRAY'], ['Erase', 'erase', 'ERASE']]],
    ['Annotation', [['Text', 'text', 'MTEXT', 1], ['Dimension', 'dim', 'DIM', 1], ['Leader', 'leader', 'MLEADER'], ['Table', 'table', 'TABLE']]],
    ['Layers', null],
    ['Block', [['Insert', 'insert', 'INSERT', 1]]],
    ['Utilities', [['Measure', 'measure', 'MEASUREGEOM', 1], ['Audit', 'audit', 'AUDIT']]],
    ['Clipboard', [['Paste', 'paste', 'PASTECLIP', 1]]],
  ];
  const PROMPTS = {
    LINE: 'Specify first point:', PLINE: 'Specify start point:', CIRCLE: 'Specify center point for circle or [3P/2P/Ttr (tan tan radius)]:', ARC: 'Specify start point of arc or [Center]:',
    MOVE: 'Select objects:', ROTATE: 'Select objects:', TRIM: 'Select cutting edges ... Select objects or <select all>:', COPY: 'Select objects:', MIRROR: 'Select objects:',
    FILLET: 'Select first object or [Undo/Polyline/Radius/Trim/Multiple]:', SCALE: 'Select objects:', ARRAY: 'Select objects:', ERASE: 'Select objects:',
    MTEXT: 'Specify first corner:', DIM: 'Select objects or specify first extension line origin or [Angular/Baseline/Continue/Ordinate/aliGn/Distribute/Layer/Undo]:',
    MLEADER: 'Specify leader arrowhead location or [leader Landing first/Content first/Options] <Options>:', TABLE: 'Specify insertion point:',
    INSERT: 'Specify insertion point or [Basepoint/Scale/X/Y/Z/Rotate]:', MEASUREGEOM: 'Enter an option [Distance/Radius/Angle/ARea/Volume/Quick/Mode/eXit] <Quick>:', PASTECLIP: 'Specify insertion point:',
  };

  // ---- View: the viewBox, zoom about the cursor, pan, and an animated zoom extents ----
  function setView(c, v) {
    c.v = v;
    c.svg.setAttribute('viewBox', v.map(n => n.toFixed(2)).join(' '));
    const px = Math.max(v[2] / Math.max(1, c.svg.clientWidth), v[3] / Math.max(1, c.svg.clientHeight));
    c.svg.style.setProperty('--px', px);
    // AutoCAD thins out a grid that would be too dense to see.
    c.svg.querySelector('.ca-grid-minor').style.display = 1000 / px < 9 ? 'none' : '';
    grips(c);
    if (c.propsOn && !c.sel.size) props(c);
  }
  function toUser(c, x, y) { const p = new DOMPoint(x, y).matrixTransform(c.svg.getScreenCTM().inverse()); return [p.x, p.y]; }
  function zoomAt(c, x, y, f) {
    const [ux, uy] = toUser(c, x, y), v = c.v;
    setView(c, [ux - (ux - v[0]) / f, uy - (uy - v[1]) / f, v[2] / f, v[3] / f]);
  }
  function animateTo(c, to, ms = 520) {
    const from = c.v.slice(), t0 = performance.now();
    cancelAnimationFrame(c.anim);
    const frame = now => {
      const k = Math.min(1, (now - t0) / ms), e = RingLive.reduce ? 1 : 1 - Math.pow(1 - k, 3);
      setView(c, from.map((a, i) => a + (to[i] - a) * e));
      if (k < 1) c.anim = requestAnimationFrame(frame);
    };
    c.anim = requestAnimationFrame(frame);
  }
  function zoomExtents(c) {
    say(c, 'Command: ZOOM', 'Specify corner of window, enter a scale factor (nX or nXP), or', '[All/Center/Dynamic/Extents/Previous/Scale/Window/Object] <real time>: E');
    animateTo(c, extents(c));
  }
  // The drawing's extents, fitted to what the floating command line leaves free of the canvas.
  function extents(c) {
    const [bx, by, bw, bh] = EXTENTS, cw = c.svg.clientWidth || 800, ch = c.svg.clientHeight || 500;
    const free = Math.max(120, ch - (c.root.querySelector('.ca-cmd').offsetHeight + 16)), s = Math.min(cw / bw, free / bh);
    return [bx - (cw / s - bw) / 2, by - (free / s - bh) / 2, cw / s, ch / s];
  }

  // ---- Command line ----
  function say(c, ...lines) {
    c.hist.push(...lines);
    c.histEl.innerHTML = c.hist.slice(-3).map(l => `<div>${esc(l)}</div>`).join('');
    c.log.insertAdjacentHTML('beforeend', lines.map(l => `<div>${esc(l)}</div>`).join(''));
  }
  function command(c, raw) {
    const text = raw.trim().toUpperCase().replace(/^_/, '');
    if (!text) return c.last ? command(c, c.last) : say(c, 'Command:');
    const [cmd, ...rest] = text.split(/\s+/), arg = rest.join(' ');
    c.last = text;
    const run = {
      Z: () => arg.startsWith('E') ? zoomExtents(c) : arg.startsWith('A') ? (say(c, 'Command: ZOOM A'), animateTo(c, extents(c))) : say(c, 'Command: ZOOM', '[All/Center/Dynamic/Extents/Previous/Scale/Window/Object] <real time>: Press ESC or ENTER to exit, or right-click to display shortcut menu.'),
      ZE: () => zoomExtents(c), PURGE: () => purge(c), AUDIT: () => audit(c), PLOT: () => plot(c), PRINT: () => plot(c),
      PR: () => toggleProps(c, true), PROPERTIES: () => toggleProps(c, true), PROPERTIESCLOSE: () => toggleProps(c, false),
      ORTHO: () => toggle(c, 'ortho'), ORTHOMODE: () => toggle(c, 'ortho'), OSNAP: () => toggle(c, 'osnap'), OS: () => toggle(c, 'osnap'), POLAR: () => toggle(c, 'polar'),
      GRID: () => toggle(c, 'grid'), CLEANSCREENON: () => clean(c, true), CLEANSCREENOFF: () => clean(c, false),
      RE: () => say(c, 'Command: REGEN', 'Regenerating model.'), REGEN: () => say(c, 'Command: REGEN', 'Regenerating model.'), REGENALL: () => say(c, 'Command: REGENALL', 'Regenerating model.'),
      UNITS: () => say(c, 'Command: UNITS', 'Length: Decimal, precision 0.0000. Insertion scale: Millimeters.'),
      LA: () => say(c, 'Command: LAYER', `${LAYERS.length + (c.purged ? 0 : UNUSED.layers.length)} layers. Current layer: "A-WALL".`),
      LAYER: () => say(c, 'Command: LAYER', `${LAYERS.length + (c.purged ? 0 : UNUSED.layers.length)} layers. Current layer: "A-WALL".`),
      HELP: () => say(c, 'Try: Z E, PURGE, AUDIT, PLOT, PR, ORTHO, OSNAP, POLAR, GRID, REGEN, UNITS. F3 Osnap, F8 Ortho, F10 Polar.'),
    }[cmd === 'ZOOM' ? 'Z' : cmd === '-PURGE' ? 'PURGE' : cmd];
    if (run) return run();
    const alias = { L: 'LINE', PL: 'PLINE', C: 'CIRCLE', A: 'ARC', M: 'MOVE', RO: 'ROTATE', TR: 'TRIM', CO: 'COPY', CP: 'COPY', MI: 'MIRROR', F: 'FILLET', SC: 'SCALE', AR: 'ARRAY', E: 'ERASE', T: 'MTEXT', MT: 'MTEXT', I: 'INSERT', MEA: 'MEASUREGEOM' }[cmd] || cmd;
    if (PROMPTS[alias]) return start(c, alias);
    say(c, `Unknown command "${cmd}".  Press F1 for help.`);
  }
  function start(c, cmd) {
    c.pending = cmd;
    say(c, `Command: ${cmd}`, PROMPTS[cmd]);
    c.input.placeholder = PROMPTS[cmd];
  }
  function cancel(c) {
    if (c.pending) { say(c, PROMPTS[c.pending] + ' *Cancel*'); c.pending = null; c.input.placeholder = 'Type a command'; }
    if (c.sel.size) { c.sel.clear(); paintSel(c); }
  }

  // ---- What the ring does ----
  const MODES = { grid: ['GRID', 'Grid'], ortho: ['ORTHO', 'Ortho'], polar: ['POLAR', 'Polar'], osnap: ['OSNAP', 'Osnap'], otrack: ['OTRACK', 'Otrack'], lwt: ['LWT', 'Lineweight'] };
  function toggle(c, k) {
    c.modes[k] = !c.modes[k];
    const msg = [`<${MODES[k][1]} ${c.modes[k] ? 'on' : 'off'}>`];
    // Ortho and Polar never run together, in AutoCAD either.
    if (k === 'ortho' && c.modes.ortho && c.modes.polar) { c.modes.polar = false; msg.push('<Polar off>'); }
    if (k === 'polar' && c.modes.polar && c.modes.ortho) { c.modes.ortho = false; msg.unshift('<Ortho off>'); }
    say(c, msg.join(' '));
    modes(c);
  }
  function modes(c) {
    c.root.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('is-on', !!c.modes[b.dataset.mode]); b.setAttribute('aria-pressed', String(!!c.modes[b.dataset.mode])); });
    c.root.classList.toggle('no-grid', !c.modes.grid);
    c.root.classList.toggle('is-lwt', !!c.modes.lwt);
    if (!c.modes.osnap) c.snapEl.style.display = 'none';
  }
  function purge(c) {
    say(c, 'Command: -PURGE', 'Enter type of unused objects to purge [Blocks/Dimstyles/Groups/LAyers/LTypes/MAterials/MUltileaderstyles/Plotstyles/SHapes/textSTyles/Mlinestyles/Tablestyles/Visualstyles/Regapps/Zero-length geometry/Empty text objects/Orphaned data/All]: A',
      'Enter name(s) to purge <*>: *', 'Verify each name to be purged? [Yes/No] <Y>: N');
    if (c.purged) { say(c, 'No unreferenced blocks found.', 'No unreferenced layers found.', 'No unreferenced text styles found.', 'No unreferenced linetypes found.'); return OS.toast('Purge', 'Nothing left to purge. The drawing is clean.', ICON); }
    c.purged = true;
    say(c, ...UNUSED.blocks.map(n => `Deleting block "${n}".`), `${UNUSED.blocks.length} blocks deleted.`, ...UNUSED.layers.map(n => `Deleting layer "${n}".`), `${UNUSED.layers.length} layers deleted.`,
      ...UNUSED.styles.map(n => `Deleting text style "${n}".`), `${UNUSED.styles.length} text styles deleted.`, ...UNUSED.linetypes.map(n => `Deleting linetype "${n}".`), `${UNUSED.linetypes.length} linetypes deleted.`);
    c.root.querySelector('.ca-file small').textContent = '1.82 MB';
    layerList(c);
    OS.toast('Purged', `${UNUSED.blocks.length} blocks, ${UNUSED.layers.length} layers, ${UNUSED.styles.length} text styles, ${UNUSED.linetypes.length} linetypes. 2.41 MB → 1.82 MB.`, ICON);
  }
  function audit(c) {
    const n = c.root.querySelectorAll('.ob').length * 37 + 211, fixed = c.audited ? 0 : 2;
    say(c, 'Command: AUDIT', 'Fix any errors detected? [Yes/No] <N>: Y', 'Auditing Header', 'Auditing Tables', 'Auditing Entities Pass 1', `Pass 1 ${n} objects audited`, 'Auditing Entities Pass 2', `Pass 2 ${n} objects audited`,
      'Auditing Blocks', ` ${18 + (c.purged ? 0 : UNUSED.blocks.length)}     Blocks audited`, ...(fixed ? ['AcDbBlockReference(2C1F)  Invalid extents  Fixed', 'AcDbMText(3A07)  Duplicate handle  Fixed'] : []),
      `Total errors found ${fixed} fixed ${fixed}`, 'Erased 0 objects');
    c.audited = true;
    OS.toast('Audit', fixed ? `${n} objects checked. 2 errors found, 2 fixed.` : `${n} objects checked. No errors.`, ICON);
  }
  function toggleProps(c, on) {
    c.propsOn = on ?? !c.propsOn;
    c.root.classList.toggle('has-props', c.propsOn);
    if (c.propsOn) props(c);
    setView(c, c.v);
  }
  function clean(c, on) {
    const v = c.root.classList.toggle('is-clean', on);
    say(c, `Command: CLEANSCREEN${v ? 'ON' : 'OFF'}`);
    requestAnimationFrame(() => setView(c, c.v));
  }

  // ---- Selection: a click picks one, a window picks what is inside (blue) or touched (green), like AutoCAD ----
  function paintSel(c) {
    c.root.querySelectorAll('.ob').forEach(o => o.classList.toggle('is-sel', c.sel.has(o)));
    grips(c);
    if (c.propsOn) props(c);
  }
  function grips(c) {
    const px = c.v[2] / Math.max(1, c.svg.clientWidth), s = 9 * Math.max(px, c.v[3] / Math.max(1, c.svg.clientHeight));
    c.gripEl.innerHTML = [...c.sel].map(o => {
      const b = o.getBBox();
      return [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}"/>`).join('');
    }).join('');
  }
  function props(c) {
    const sel = [...c.sel], types = new Set(sel.map(o => o.dataset.type)), layers = new Set(sel.map(o => o.dataset.layer));
    const head = !sel.length ? 'No selection' : types.size === 1 ? `${[...types][0]} (${sel.length})` : `All (${sel.length})`;
    const row = (k, v) => `<div class="ca-pr"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
    let html = `<div class="ca-psel">${esc(head)}</div><h4>General</h4>`
      + row('Color', 'ByLayer') + row('Layer', !sel.length ? 'A-WALL' : layers.size === 1 ? [...layers][0] : '*VARIES*') + row('Linetype', 'ByLayer') + row('Linetype scale', '1.0000') + row('Lineweight', 'ByLayer') + row('Transparency', 'ByLayer');
    if (sel.length === 1 && sel[0].dataset.info) html += `<h4>${sel[0].dataset.type === 'MText' ? 'Text' : sel[0].dataset.type === 'Rotated Dimension' ? 'Text' : 'Geometry'}</h4>` + sel[0].dataset.info.split('|').map(p => row(...p.split('='))).join('');
    if (!sel.length) {
      const [x, y, w, h] = c.v;
      html += '<h4>View</h4>' + row('Center X', f4(x + w / 2)) + row('Center Y', f4(H - (y + h / 2))) + row('Center Z', '0.0000') + row('Height', f4(h)) + row('Width', f4(w))
        + '<h4>Misc</h4>' + row('Annotation scale', '1:100') + row('UCS icon On', 'Yes') + row('UCS Name', '*WORLD*') + row('Visual Style', '2D Wireframe');
    }
    c.propsEl.querySelector('.ca-pbody').innerHTML = html;
  }
  function layerList(c) {
    c.root.querySelector('.ca-layer small').textContent = `${LAYERS.length + (c.purged ? 0 : UNUSED.layers.length)} layers`;
  }

  // ---- Plot: the dialog with a preview on a monochrome A3 sheet ----
  function plot(c) {
    say(c, 'Command: PLOT');
    const d = c.root.querySelector('.ca-plot');
    d.hidden = false;
    d.querySelector('.ca-sheet-dwg').innerHTML = `<svg viewBox="${EXTENTS.join(' ')}" preserveAspectRatio="xMidYMid meet">${c.root.querySelector('.ca-dwg').innerHTML}</svg>`;
    d.querySelector('.ca-tb-date').textContent = new Date().toLocaleDateString('en-GB');
    d.querySelector('.ca-plot-ok').focus();
  }
  function plotDone(c, ok) {
    const d = c.root.querySelector('.ca-plot');
    d.hidden = true;
    if (!ok) return say(c, 'Plot cancelled.');
    say(c, 'Effective plotting area:  410.00 wide by 287.00 high', 'Plotting viewport 1.', 'Regenerating model.');
    OS.toast('Plot and Publish Job Complete', 'No errors or warnings found. House-plan-Model.pdf (DWG To PDF.pc3, A3, monochrome.ctb).', ICON);
  }

  OS.register({
    id: 'cad',
    tint: '#ff6b6b',
    async render(body, c) {
      await style('os/apps/cad.css');
      const panel = ([name, tools]) => `<div class="ca-panel"><div class="ca-tools">${tools ? tools.map(([label, icon, cmd, big]) => `<button type="button" class="ca-tool${big ? ' is-big' : ''}" data-cmd="${cmd}" title="${esc(label)} (${cmd})">${svg(I[icon])}<span>${esc(label)}</span></button>`).join('')
        : `<div class="ca-layer"><span class="ca-li">${svg(I.bulb)}${svg(I.sun)}${svg(I.unlock)}<i></i></span><b>A-WALL</b><small></small></div>`}</div><div class="ca-pname">${name} ▾</div></div>`;
      body.innerHTML = `<div class="ca has-props os-dark">
        <div class="ca-files"><span class="ca-ftab">Start</span><span class="ca-ftab is-on ca-file">House-plan* <small>2.41 MB</small></span><span class="ca-ftab ca-fplus">+</span></div>
        <div class="ca-ribbon">
          <div class="ca-rtabs">${['Home', 'Insert', 'Annotate', 'Parametric', 'View', 'Manage', 'Output', 'Add-ins', 'Collaborate', 'Express Tools'].map((t, i) => `<span${i ? '' : ' class="is-on"'}>${t}</span>`).join('')}</div>
          <div class="ca-panels">${RIBBON.map(panel).join('')}</div>
        </div>
        <div class="ca-work">
          <aside class="ca-props" aria-label="Properties"><div class="ca-ptitle">PROPERTIES<button type="button" class="ca-px" aria-label="Close Properties">×</button></div><div class="ca-pbody"></div></aside>
          <div class="ca-view">
            <svg class="ca-svg" preserveAspectRatio="xMidYMid meet" aria-label="Floor plan, 12 by 8 metres">
              <defs>
                <pattern id="ca-grid-a" width="1000" height="1000" patternUnits="userSpaceOnUse"><path class="ca-grid-minor" d="M1000 0H0V1000"/></pattern>
                <pattern id="ca-grid-b" width="5000" height="5000" patternUnits="userSpaceOnUse"><path class="ca-grid-major" d="M5000 0H0V5000"/></pattern>
                <pattern id="ca-ansi31" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="ca-hatch" d="M0 0V120"/></pattern>
              </defs>
              <g class="ca-grid"><rect x="-60000" y="-60000" width="132000" height="128000" fill="url(#ca-grid-a)"/><rect x="-60000" y="-60000" width="132000" height="128000" fill="url(#ca-grid-b)"/></g>
              <g class="ca-dwg">${drawing()}</g>
              <g class="ca-grips"></g>
              <rect class="ca-snap" width="1" height="1"/>
            </svg>
            <div class="ca-vplabel">[–][Top][2D Wireframe]</div>
            <div class="ca-cube" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="30"/><text x="40" y="8">N</text><text x="76" y="44">E</text><text x="40" y="79">S</text><text x="4" y="44">W</text><rect x="25" y="25" width="30" height="30"/><text class="t" x="40" y="44">TOP</text></svg><small>WCS ▾</small></div>
            <div class="ca-ucs" aria-hidden="true"><svg viewBox="0 0 60 60"><path class="x" d="M8 52H50M44 48l6 4-6 4"/><path class="y" d="M8 52V10M4 16l4-6 4 6"/><rect x="4" y="48" width="8" height="8"/><text x="52" y="46">X</text><text x="13" y="12">Y</text></svg></div>
            <div class="ca-cross" aria-hidden="true"><i class="h"></i><i class="v"></i><b></b></div>
            <div class="ca-tip" aria-hidden="true">Endpoint</div>
            <div class="ca-win" aria-hidden="true"></div>
            <div class="ca-cmd" data-no-ring>
              <div class="ca-hist"></div>
              <form class="ca-cmdin"><span>›_</span><input type="text" spellcheck="false" autocomplete="off" placeholder="Type a command" aria-label="Command line"></form>
            </div>
          </div>
        </div>
        <div class="ca-layouts"><span class="is-on">Model</span><span>Layout1</span><span>Layout2</span><span>+</span></div>
        <footer class="ca-status">
          <span class="ca-xy">0.0000, 0.0000, 0.0000</span>
          <b class="ca-model">MODEL</b>
          ${Object.entries(MODES).map(([k, [lab, name]]) => `<button type="button" data-mode="${k}" title="${name} (${{ grid: 'F7', ortho: 'F8', polar: 'F10', osnap: 'F3', otrack: 'F11', lwt: '' }[k] || ''})">${lab}</button>`).join('')}
          <span class="ca-fill"></span><span class="ca-scale">1:100</span>
          <button type="button" class="ca-cleanbtn" title="Clean Screen (Ctrl+0)">${svg(I.clean)}</button>
        </footer>
        <div class="ca-plot" hidden data-no-ring>
          <div class="ca-dlg" role="dialog" aria-label="Plot - Model">
            <div class="ca-dtitle">Plot - Model</div>
            <div class="ca-dbody">
              <div class="ca-sheet"><div class="ca-sheet-dwg"></div><div class="ca-tb"><b>APARTMENT 4B</b><span>Floor plan</span><span>Scale 1:100 · A3</span><span class="ca-tb-date"></span></div></div>
              <dl class="ca-dset"><dt>Printer/plotter</dt><dd>DWG To PDF.pc3</dd><dt>Paper size</dt><dd>ISO full bleed A3 (420.00 x 297.00 MM)</dd><dt>Plot area</dt><dd>Extents</dd><dt>Plot scale</dt><dd>1:100</dd><dt>Plot style table</dt><dd>monochrome.ctb</dd><dt>Orientation</dt><dd>Landscape</dd></dl>
            </div>
            <div class="ca-dfoot"><button type="button" class="os-btn ca-plot-ok os-btn-primary">OK</button><button type="button" class="os-btn ca-plot-no">Cancel</button></div>
          </div>
        </div>
      </div>`;
      const root = c.root = body.querySelector('.ca');
      c.svg = root.querySelector('.ca-svg'); c.gripEl = root.querySelector('.ca-grips'); c.snapEl = root.querySelector('.ca-snap');
      c.propsEl = root.querySelector('.ca-props'); c.histEl = root.querySelector('.ca-hist'); c.input = root.querySelector('.ca-cmdin input');
      c.log = document.createElement('div');
      c.hist = []; c.sel = new Set(); c.propsOn = !OS.phone; c.modes = { grid: true, ortho: false, polar: true, osnap: true, otrack: true, lwt: false };
      root.classList.toggle('has-props', c.propsOn);
      layerList(c); modes(c);
      say(c, 'Command: OPEN House-plan.dwg', 'Regenerating model.', 'Command:');
      // Opens a little zoomed in, off to one side: Zoom extents has something to do.
      requestAnimationFrame(() => setView(c, [3800, 1200, 7600, 4300]));
      new ResizeObserver(() => c.v && setView(c, c.v)).observe(c.svg);

      // The canvas: crosshair, Osnap marker, coordinates, wheel zoom, middle-button pan, click and window selection.
      const view = root.querySelector('.ca-view'), cross = root.querySelector('.ca-cross'), tip = root.querySelector('.ca-tip'), win = root.querySelector('.ca-win'), xy = root.querySelector('.ca-xy');
      let drag = null;
      const onCanvas = e => e.target.closest('.ca-svg, .ca-cross, .ca-win');
      view.addEventListener('pointermove', e => {
        const r = view.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        const over = !!onCanvas(e) && !OS.ring.held;
        view.classList.toggle('is-over', over);
        if (!over) return;
        let [ux, uy] = toUser(c, e.clientX, e.clientY), snapped = null;
        if (c.modes.osnap) {
          const px = c.v[2] / Math.max(1, c.svg.clientWidth) * 14;
          snapped = SNAPS.find(([sx, sy]) => Math.abs(sx - ux) < px && Math.abs(sy - uy) < px);
          if (snapped) {
            const s = c.v[2] / Math.max(1, c.svg.clientWidth) * 11;
            Object.assign(c.snapEl.style, { display: '' });
            c.snapEl.setAttribute('x', snapped[0] - s / 2); c.snapEl.setAttribute('y', snapped[1] - s / 2); c.snapEl.setAttribute('width', s); c.snapEl.setAttribute('height', s);
            [ux, uy] = snapped;
          } else c.snapEl.style.display = 'none';
        }
        tip.style.transform = `translate(${x + 18}px, ${y + 18}px)`;
        tip.classList.toggle('is-on', !!snapped);
        cross.style.transform = `translate(${x}px, ${y}px)`;
        xy.textContent = `${f4(ux)}, ${f4(H - uy)}, 0.0000`;
        if (drag?.pan) {
          const k = c.v[2] / Math.max(1, c.svg.clientWidth), m = Math.max(k, c.v[3] / Math.max(1, c.svg.clientHeight));
          setView(c, [drag.v[0] - (e.clientX - drag.x) * m, drag.v[1] - (e.clientY - drag.y) * m, drag.v[2], drag.v[3]]);
        } else if (drag && !drag.ring) {
          if (OS.ring.held) { drag.ring = true; win.classList.remove('is-on'); return; }
          if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
            drag.moved = true;
            const cr = e.clientX < drag.x;
            Object.assign(win.style, { left: Math.min(drag.x, e.clientX) - r.left + 'px', top: Math.min(drag.y, e.clientY) - r.top + 'px', width: Math.abs(e.clientX - drag.x) + 'px', height: Math.abs(e.clientY - drag.y) + 'px' });
            win.classList.add('is-on'); win.classList.toggle('is-cross', cr);
          }
        }
      });
      view.addEventListener('pointerleave', () => { view.classList.remove('is-over'); tip.classList.remove('is-on'); });
      view.addEventListener('pointerdown', e => {
        if (!onCanvas(e)) return;
        c.input.blur(); c.el.focus({ preventScroll: true });
        if (e.button === 1) { e.preventDefault(); drag = { pan: true, x: e.clientX, y: e.clientY, v: c.v.slice() }; view.setPointerCapture(e.pointerId); }
        else if (e.button === 0) drag = { x: e.clientX, y: e.clientY, target: e.target.closest('.ob') };
      });
      view.addEventListener('pointerup', e => {
        const d = drag; drag = null;
        win.classList.remove('is-on');
        if (!d || d.pan || d.ring || OS.ring.held) return;
        if (!e.shiftKey && !d.moved && !d.target) { c.sel.clear(); return paintSel(c); }
        if (!d.moved) { c.sel.add(d.target); return paintSel(c); }
        const a = { l: Math.min(d.x, e.clientX), r: Math.max(d.x, e.clientX), t: Math.min(d.y, e.clientY), b: Math.max(d.y, e.clientY) }, crossing = e.clientX < d.x;
        root.querySelectorAll('.ca-dwg .ob').forEach(o => {
          const b = o.getBoundingClientRect();
          const inside = b.left >= a.l && b.right <= a.r && b.top >= a.t && b.bottom <= a.b, touch = b.left < a.r && b.right > a.l && b.top < a.b && b.bottom > a.t;
          if (crossing ? touch : inside) c.sel.add(o);
        });
        paintSel(c);
      });
      view.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
      view.addEventListener('wheel', e => { if (!onCanvas(e)) return; e.preventDefault(); cancelAnimationFrame(c.anim); zoomAt(c, e.clientX, e.clientY, e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });
      view.addEventListener('dblclick', e => { if (onCanvas(e) && e.button === 1) zoomExtents(c); });
      // A quick right click is Enter: it repeats the last command, as AutoCAD's default does.
      view.addEventListener('contextmenu', e => { if (!onCanvas(e) || e.defaultPrevented) return; e.preventDefault(); if (!OS.ring.held && c.last) command(c, ''); });

      root.querySelector('.ca-cmdin').addEventListener('submit', e => { e.preventDefault(); const v = c.input.value; c.input.value = ''; command(c, v); });
      root.querySelector('.ca-panels').addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (b) command(c, b.dataset.cmd); });
      root.querySelector('.ca-status').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) toggle(c, b.dataset.mode); if (e.target.closest('.ca-cleanbtn')) clean(c); });
      root.querySelector('.ca-px').addEventListener('click', () => toggleProps(c, false));
      root.querySelector('.ca-plot-ok').addEventListener('click', () => plotDone(c, true));
      root.querySelector('.ca-plot-no').addEventListener('click', () => plotDone(c, false));
      // Keys: the F-keys and Ctrl shortcuts, Esc cancels, Enter repeats, and typing goes to the command line.
      body.addEventListener('keydown', e => {
        if (!root.querySelector('.ca-plot').hidden) { if (e.key === 'Escape') { e.stopPropagation(); plotDone(c, false); } return; }
        const k = e.key, typing = e.target === c.input;
        const act = k === 'F3' ? () => toggle(c, 'osnap') : k === 'F8' ? () => toggle(c, 'ortho') : k === 'F10' ? () => toggle(c, 'polar') : k === 'F7' ? () => toggle(c, 'grid') : k === 'F11' ? () => toggle(c, 'otrack')
          : e.ctrlKey && k === '0' ? () => clean(c) : e.ctrlKey && (k === 'p' || k === 'P') ? () => plot(c) : k === 'Escape' ? () => { cancel(c); c.input.value = ''; } : null;
        if (act) { e.preventDefault(); e.stopPropagation(); return act(); }
        if (typing || e.ctrlKey || e.altKey || e.metaKey || e.target.closest('button, input')) return;
        if (k === 'Enter' || k === ' ') { e.preventDefault(); return command(c, ''); }
        if (k.length === 1 && /[\w\-.]/.test(k)) { c.input.focus(); }
      });
    },
    onClose(c) { cancelAnimationFrame(c.anim); },
    // The gallery's AutoCAD recipes.
    ring: [
      { label: 'Zoom extents', icon: 'fluent:E8BD', tint: '#7cc4ff', say: 'Types Z, Enter, E, Enter: the whole drawing fills the window.', run: c => zoomExtents(c) },
      { label: 'Osnap', icon: '🧲', tint: '#ffd166', say: 'Turns object snap on or off (F3).', run: c => toggle(c, 'osnap') },
      { label: 'Ortho', icon: '📐', tint: '#6ee7a0', say: 'Turns Ortho mode on or off (F8).', run: c => toggle(c, 'ortho') },
      { label: 'Polar', icon: '🧭', tint: '#5eead4', say: 'Turns polar tracking on or off (F10).', run: c => toggle(c, 'polar') },
      { label: 'Plot', icon: 'fluent:E790', tint: '#a5b4fc', say: 'Opens Plot (Ctrl+P).', run: c => plot(c) },
      { label: 'Purge', icon: 'fluent:E790', tint: '#ff6b6b', say: 'Removes every unused block, layer, style and linetype in one go, without the dialog.', run: c => purge(c) },
      { label: 'Properties', icon: 'ℹ', tint: '#c4a1ff', say: 'Shows or hides the Properties palette (Ctrl+1).', run: c => toggleProps(c) },
      { label: 'Clean screen', icon: 'fluent:E7F4', tint: '#fdba74', say: 'Hides the ribbon and palettes; pick it again for them back (Ctrl+0).', run: c => clean(c) },
    ],
  });
})();
