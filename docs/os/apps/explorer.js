/* File Explorer: a folder tree of believable files, and the ring doing to them what RadialDeck's file recipes do
   (gallery category "explorer": Shrink PDF, Zip, Mail file, Copy path, → MP3 / GIF / MP4…). The result of a
   conversion lands next to the original, as in the app. Drag a file and tap Shift (or Ctrl) mid-drag: the drop ring
   (src/RadialDeck/Menu/DropRing.cs, DropChip.cs) opens around the pointer with the file small in its hub; pick by
   direction, let go, and the file flies into the slice. The ops are the app's own (Actions/FileConvert.cs).
   window.OSFiles shares the files with Terminal (dir, cd) and the Recycle Bin. */
(() => {
  const KB = 1024, MB = KB * KB, GB = MB * KB, DAY = 864e5, NOW = Date.now();
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const EXT = { pdf: 'pdf', jpg: 'image', jpeg: 'image', png: 'image', heic: 'image', webp: 'image', ico: 'image', gif: 'image', mov: 'video', mp4: 'video', webm: 'video',
    mp3: 'audio', m4a: 'audio', wav: 'audio', xlsx: 'xlsx', csv: 'xlsx', docx: 'docx', zip: 'zip', '7z': 'zip', txt: 'txt' };
  const extOf = n => (/\.([^.]+)$/.exec(n)?.[1] || '').toLowerCase();
  const baseOf = n => n.replace(/\.[^.]+$/, '');
  const kindOf = f => f.dir ? 'folder' : EXT[extOf(f.name)] || 'file';
  const TYPE = { folder: 'File folder', pdf: 'PDF Document', image: '%s File', video: '%s Video', audio: '%s Audio', xlsx: 'Microsoft Excel Worksheet', docx: 'Microsoft Word Document', zip: 'Compressed (zipped) Folder', txt: 'Text Document', file: 'File' };
  const typeOf = f => (TYPE[kindOf(f)] || 'File').replace('%s', extOf(f.name).toUpperCase());
  const fmt = b => b == null ? '' : b < KB ? `${Math.round(b)} bytes` : b < MB ? `${Math.max(1, Math.round(b / KB))} KB` : b < GB ? `${(b / MB).toFixed(b < 100 * MB ? 1 : 0)} MB` : `${(b / GB).toFixed(1)} GB`;
  const when = t => { const d = new Date(t); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; };
  const HOME = 'C:\\Users\\you';
  const pathOf = (dir, name) => [HOME, dir, name].filter(Boolean).join('\\');

  // ---- The files ----
  let seq = 0;
  const f = (name, size, ago, x) => ({ id: ++seq, name, size, t: NOW - ago * DAY, ...x });
  const d = (name, ago) => ({ id: ++seq, name, dir: true, t: NOW - ago * DAY });
  const TOP = ['Desktop', 'Downloads', 'Documents', 'Pictures', 'Music', 'Videos'];
  const tree = {
    '': TOP.map(n => d(n, 1)),
    Desktop: [f('Project plan.pdf', 4.2 * MB, 1.2, { pages: 6 }), f('Team photo.jpg', 3.4 * MB, 2, { art: 5 }), f('Budget 2027.xlsx', 84 * KB, 3), f('Notes.txt', 2 * KB, .2)],
    Downloads: [f('Offer.pdf', 27.4 * MB, .05, { pages: 12 }), f('Holiday.mov', 214 * MB, .2, { art: 1, len: '1:12' }), f('IMG_2041.heic', 3.1 * MB, .4, { art: 0 }),
      f('Screenshot 2026-10-20.png', 1.8 * MB, 1, { art: 3 }), f('Invoice-2291.pdf', 1.2 * MB, 1.5, { pages: 2 }),
      f('Photos-Rome.zip', 148 * MB, 2, { inside: [f('Colosseum.jpg', 5.1 * MB, 9, { art: 0 }), f('Trevi.jpg', 4.4 * MB, 9, { art: 1 }), f('Dinner.jpg', 3.2 * MB, 9, { art: 4 })] }),
      f('Report Q3.docx', 412 * KB, 3), f('Prices 2027.xlsx', 56 * KB, 6)],
    Documents: [d('Contracts', 30), d('Taxes 2026', 12), f('CV.pdf', 380 * KB, 40, { pages: 2 }), f('Letter to the bank.docx', 28 * KB, 9), f('Household.xlsx', 41 * KB, 4)],
    'Documents\\Contracts': [f('Lease 2026.pdf', 2.2 * MB, 200, { pages: 9 }), f('Work contract.pdf', 640 * KB, 300, { pages: 4 })],
    'Documents\\Taxes 2026': [f('Receipts.zip', 12.6 * MB, 20, { inside: [f('Receipt 01.pdf', 210 * KB, 30), f('Receipt 02.pdf', 180 * KB, 30)] }), f('Tax return.pdf', 1.1 * MB, 12, { pages: 5 })],
    Pictures: [f('Sunset at Rila.jpg', 4.8 * MB, 5, { art: 0 }), f('Beach.jpg', 3.9 * MB, 40, { art: 1 }), f('Forest walk.jpg', 5.2 * MB, 60, { art: 2 }),
      f('City lights.jpg', 2.7 * MB, 75, { art: 4 }), f('Snow peaks.png', 9.1 * MB, 120, { art: 6 }), f('Team photo.jpg', 3.4 * MB, 2, { art: 5 })],
    Videos: [f('Phone clip.mov', 61 * MB, 1, { art: 2, len: '0:22', rot: -90 }), f('Birthday.mp4', 96 * MB, 15, { art: 5, len: '0:48' }), f('Screen recording.mp4', 38 * MB, 3, { art: 3, len: '2:05' })],
  };
  const music = () => tree.Music ||= (window.OSMusic?.tracks || []).map((t, i) => f(`${t.artist} - ${t.title}.mp3`, t.len * 40 * KB, 10 + i * 3, { track: i }));
  const list = dir => dir === 'Music' ? music() : (tree[dir] ||= []);
  const bin = [  // what the Recycle Bin holds: { file, from }
    { file: f('Offer v1.pdf', 25.9 * MB, 3), from: 'Downloads' }, { file: f('IMG_1980.jpg', 2.9 * MB, 8, { art: 2 }), from: 'Pictures' },
    { file: f('Draft budget.xlsx', 77 * KB, 6), from: 'Documents' }, { file: f('Untitled.txt', 1 * KB, 1), from: 'Desktop' }, { file: f('Holiday (old).mov', 188 * MB, 12, { art: 1, len: '1:05' }), from: 'Videos' },
  ];
  const changed = () => dispatchEvent(new CustomEvent('os:files'));

  // ---- Pictures: thumbnails drawn in SVG (flat colours: gradients by id break inside a hidden window) ----
  const LAND = [
    ['#ffb38a', '#ffd9b0', '#fff1d6', '#7a4a7e', '#3f2a55'], ['#8ec9ff', '#d8eeff', '#ffffff', '#1f74c9', '#f0d39b'], ['#bfe8cf', '#e8f8ee', '#ffe69a', '#3d8a62', '#1f5a3d'],
    null, null, null, ['#9fc3ff', '#e2ecff', '#ffffff', '#c9d6ee', '#6f83ad'],
  ];
  function photo(i = 0) {
    const v = 'viewBox="0 0 64 48" preserveAspectRatio="xMidYMid slice"';
    if (i === 3) return `<svg ${v}><rect width="64" height="48" fill="#e9edf5"/><rect width="64" height="7" fill="#2b59c3"/><rect x="5" y="12" width="34" height="4" rx="1" fill="#1f2937"/><rect x="5" y="20" width="50" height="2" fill="#94a3b8"/><rect x="5" y="25" width="44" height="2" fill="#94a3b8"/><rect x="5" y="30" width="48" height="2" fill="#94a3b8"/><circle cx="50" cy="15" r="5" fill="#60a5fa"/></svg>`;
    if (i === 4) return `<svg ${v}><rect width="64" height="48" fill="#1b1942"/><circle cx="50" cy="10" r="4" fill="#fde68a"/><path d="M0 48V26h8v-8h8v14h6V20h10v28M32 48V14h9v34M41 48V24h9v-6h6v30h8v8z" fill="#0b1022"/>${[[4, 30], [11, 22], [25, 26], [35, 18], [35, 28], [44, 30], [52, 24], [59, 34]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2" fill="#fcd34d"/>`).join('')}</svg>`;
    if (i === 5) return `<svg ${v}><rect width="64" height="48" fill="#fcd98a"/><rect y="34" width="64" height="14" fill="#d9a441"/>${[[14, '#7c3aed'], [26, '#ef4444'], [38, '#0ea5e9'], [50, '#16a34a']].map(([x, c]) => `<circle cx="${x}" cy="21" r="5" fill="#f3c9a4"/><path d="M${x - 7} 40a7 8 0 0 1 14 0z" fill="${c}"/>`).join('')}</svg>`;
    const [s1, s2, sun, h1, h2] = LAND[i] || LAND[0];
    return `<svg ${v}><rect width="64" height="48" fill="${s1}"/><rect y="18" width="64" height="30" fill="${s2}"/><circle cx="44" cy="20" r="7" fill="${sun}"/>`
      + `<path d="M0 34 14 20l9 8 11-13 14 15 16-8v26H0z" fill="${h1}"/><path d="M0 40c14-6 26-2 38-4s18-6 26-4v16H0z" fill="${h2}"/></svg>`;
  }
  // File icons, 32×40 (play.html's, plus Office, text and zip).
  const PAGE = '<path d="M6 2h15l7 7v27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#eef2f8"/><path d="M21 2v7h7" fill="#c9d4e8"/>';
  const badge = (c, t) => `<rect x="2" y="20" width="22" height="10" rx="1.5" fill="${c}"/><text x="13" y="27.6" font-size="6.6" font-weight="700" fill="#fff" text-anchor="middle" font-family="Segoe UI,Inter,sans-serif">${t}</text>`;
  const ART = {
    pdf: PAGE + badge('#e5484d', 'PDF'),
    xlsx: PAGE + '<path d="M9 12h14M9 16h14M9 33h14M15 12v24" stroke="#a7c8b2" stroke-width="1"/>' + badge('#1d7a46', 'XLS'),
    docx: PAGE + '<path d="M9 12h14M9 15.5h14M9 33h12" stroke="#b6c4e0" stroke-width="1.2"/>' + badge('#2b5fc4', 'DOC'),
    txt: PAGE + '<path d="M9 14h14M9 18h14M9 22h10M9 26h14M9 30h8" stroke="#9aa6bb" stroke-width="1.2"/>',
    zip: '<path d="M6 2h15l7 7v27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#f3e3a6"/><path d="M21 2v7h7" fill="#e0c977"/><path d="M14 3v23" stroke="#8a6d1c" stroke-width="2.4" stroke-dasharray="2 2"/><rect x="11.5" y="25" width="5" height="6" rx="1" fill="#8a6d1c"/>',
    audio: PAGE + '<path d="M13 29V18l9-2v10" stroke="#a855f7" stroke-width="2" fill="none"/><circle cx="11" cy="29" r="2.4" fill="#a855f7"/><circle cx="20" cy="27" r="2.4" fill="#a855f7"/>',
    file: PAGE,
  };
  const FOLDER = '<svg class="xp-ic xp-dir" viewBox="0 0 40 32" aria-hidden="true"><path d="M2 5a2 2 0 0 1 2-2h11l3 3h18a2 2 0 0 1 2 2v3H2z" fill="#e3a21a"/><path d="M2 9h36v19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="#ffc83d"/><path d="M2 9h36v2H2z" fill="#ffd96a"/></svg>';
  function thumb(fl) {
    const k = kindOf(fl), rot = fl.rot ? ` style="--rot:${fl.rot}deg"` : '';
    if (k === 'folder') return FOLDER;
    if (k === 'image') return `<span class="xp-ph${fl.square ? ' is-square' : ''}"${rot}>${photo(fl.art)}</span>`;
    if (k === 'video') return `<span class="xp-ph xp-vid"${rot}>${photo(fl.art)}<i>${OS.svg('<path d="M8 5v14l11-7z"/>')}</i></span>`;
    return `<svg class="xp-ic" viewBox="0 0 32 40" aria-hidden="true">${ART[k] || ART.file}</svg>`;
  }

  // ---- Icons for the slices (Lucide) ----
  const I = {
    shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    zip: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    film: '<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/>',
    folderPlus: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/><path d="M12 10v6M9 13h6"/>',
    rename: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    extract: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.2 10H20a2 2 0 0 1 1.9 2.5l-1.5 6a2 2 0 0 1-2 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H18a2 2 0 0 1 2 2v2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    copyTo: '<path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2"/><path d="m8 16 3-3-3-3M2 13h9"/>',
    move: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    pinOff: '<path d="M12 22s-7-6.4-7-12a7 7 0 0 1 11.2-5.6M19 10c0 1.4-.4 2.8-1 4.1M2 2l20 20"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.1 2 9.3l6.9-1z"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    checks: '<path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    play: '<path d="M6 4v16l14-8z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    home: OS.icons.home, copy: OS.icons.copy, hash: OS.icons.hash, trash: OS.icons.trash, sort: OS.icons.sort, scan: OS.icons.scan, mute: OS.icons.mute, desktop: OS.icons.desktop, download: OS.icons.download,
    doc: OS.icons.file,
  };
  const SIDE = [['Home', '', 'home', '#7cc4ff'], ['Desktop', 'Desktop', 'desktop', '#60a5fa'], ['Downloads', 'Downloads', 'download', '#4ade80'], ['Documents', 'Documents', 'doc', '#93c5fd'],
    ['Pictures', 'Pictures', 'image', '#38bdf8'], ['Music', 'Music', 'music', '#f472b6'], ['Videos', 'Videos', 'film', '#c084fc']];

  // ---- The window ----
  let X = null;   // the Explorer window's ctx (one window per app)
  const sel = () => X ? [...X.sel] : [];
  function go(dir, push = true) {
    if (!X) return;
    if (push) { X.hist = X.hist.slice(0, X.hi + 1); X.hist.push(dir); X.hi = X.hist.length - 1; }
    X.dir = dir; X.sel.clear(); X.q = ''; X.search.value = '';
    draw();
  }
  const childDir = name => X.dir ? `${X.dir}\\${name}` : name;
  function items() {
    const q = X.q.toLowerCase(), key = { name: (a, b) => baseOf(a.name).localeCompare(baseOf(b.name), undefined, { numeric: true, sensitivity: 'base' }) || extOf(a.name).localeCompare(extOf(b.name)),
      date: (a, b) => b.t - a.t, size: (a, b) => (b.size || 0) - (a.size || 0), type: (a, b) => typeOf(a).localeCompare(typeOf(b)) || a.name.localeCompare(b.name) }[X.sort];
    return list(X.dir).filter(x => !q || x.name.toLowerCase().includes(q)).sort((a, b) => (b.dir ? 1 : 0) - (a.dir ? 1 : 0) || key(a, b));
  }
  function draw() {
    if (!X) return;
    const its = X.items = items();
    X.root.classList.toggle('is-list', X.view === 'list');
    X.files.innerHTML = (X.view === 'list' ? '<div class="xp-head" aria-hidden="true"><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span></div>' : '')
      + (its.map(fl => `<div class="xp-f${X.sel.has(fl) ? ' is-sel' : ''}${fl.fresh ? ' is-new' : ''}${fl.busy ? ' is-busy' : ''}" data-id="${fl.id}" role="option" aria-selected="${X.sel.has(fl)}" title="${esc(fl.name)}">`
        + `<span class="xp-t">${thumb(fl)}</span><span class="xp-n">${esc(fl.name)}</span><span class="xp-c xp-date">${when(fl.t)}</span><span class="xp-c">${esc(typeOf(fl))}</span><span class="xp-c xp-size">${fl.dir ? '' : fmt(fl.size)}</span><i class="xp-bar"></i></div>`).join('')
        || `<p class="xp-empty">${X.q ? 'No items match your search.' : 'This folder is empty.'}</p>`);
    const parts = X.dir ? X.dir.split('\\') : [];
    X.crumbs.innerHTML = `<button type="button" data-dir="" aria-label="Home">${OS.svg(I.home)}</button>` + parts.map((p, i) => `<span>›</span><button type="button" data-dir="${esc(parts.slice(0, i + 1).join('\\'))}">${esc(p)}</button>`).join('');
    X.search.placeholder = `Search ${parts.at(-1) || 'Home'}`;
    X.side.querySelectorAll('[data-dir]').forEach(b => b.classList.toggle('is-on', b.dataset.dir === X.dir));
    X.back.disabled = X.hi <= 0; X.fwd.disabled = X.hi >= X.hist.length - 1; X.upBtn.disabled = !X.dir;
    status();
  }
  const elOf = fl => X?.files.querySelector(`[data-id="${fl.id}"]`);
  function paintSel() {
    X.files.querySelectorAll('.xp-f').forEach(el => { const on = X.sel.has(X.items.find(x => x.id === +el.dataset.id)); el.classList.toggle('is-sel', on); el.setAttribute('aria-selected', on); });
    status();
  }
  function status(msg) {
    if (!X) return;
    if (msg !== undefined) { X.msg = msg; clearTimeout(X.msgT); if (msg) X.msgT = setTimeout(() => status(''), 2600); }
    const s = sel(), size = s.reduce((a, x) => a + (x.size || 0), 0);
    X.stat.innerHTML = `<span>${X.items.length} ${X.items.length === 1 ? 'item' : 'items'}</span>`
      + (s.length ? `<span>${s.length} ${s.length === 1 ? 'item' : 'items'} selected${size ? ' ' + fmt(size) : ''}</span>` : '')
      + (X.msg ? `<span class="xp-msg">${esc(X.msg)}</span>` : '')
      + '<span class="xp-tip">Drag a file, tap <kbd>Shift</kbd> mid-drag: the drop ring <b class="tag tag-pro">Pro</b></span>';
  }

  // ---- What the ring does to files ----
  function unique(dir, name) {
    const names = new Set(list(dir).map(x => x.name.toLowerCase()));
    if (!names.has(name.toLowerCase())) return name;
    const b = baseOf(name), e = name.slice(b.length);
    for (let n = 2; ; n++) if (!names.has(`${b} (${n})${e}`.toLowerCase())) return `${b} (${n})${e}`;
  }
  // A new file next to the source: it pops in, a bar runs while it is "made", and its size counts to the end.
  function derive(src, name, { size, from = src.size, ms = 900, dir = X?.dir ?? '', ...x } = {}) {
    const fl = f(unique(dir, name), from, 0, { art: src.art, len: src.len, rot: src.rot, pages: src.pages, ...x, fresh: true, busy: true });
    list(dir).push(fl);
    draw();
    status(`Working on ${fl.name}…`);
    const t0 = performance.now();
    const tick = now => {
      const q = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - q, 3);
      fl.size = from + (size - from) * e;
      const el = elOf(fl);
      if (el) { el.querySelector('.xp-size').textContent = fmt(fl.size); el.style.setProperty('--p', q.toFixed(3)); }
      if (q < 1) return requestAnimationFrame(tick);
      fl.busy = false; fl.size = size;
      el?.classList.remove('is-busy');
      status(`${fl.name} · ${fmt(size)}`);
      setTimeout(() => { fl.fresh = false; elOf(fl)?.classList.remove('is-new'); }, 600);
      changed();
    };
    requestAnimationFrame(tick);
    return fl;
  }
  const each = fn => files => files.forEach(fn);
  const named = (src, suffix, ext) => baseOf(src.name) + suffix + '.' + (ext || extOf(src.name));
  const DO = {
    shrinkPdf: s => derive(s, named(s, '-small'), { size: s.size * .095, ms: 1300 }),
    pdfPages: ext => s => { for (let p = 1; p <= Math.min(3, s.pages || 1); p++) derive(s, `${baseOf(s.name)}-${p}.${ext}`, { size: ext === 'png' ? 1.4 * MB : 420 * KB, from: 0, art: 3, pages: undefined }); },
    pdfText: s => derive(s, named(s, '', 'txt'), { size: (s.pages || 2) * 3 * KB, from: 0 }),
    merge: files => derive(files[0], named(files[0], '-merged'), { size: files.reduce((a, x) => a + x.size, 0), from: 0, pages: files.reduce((a, x) => a + (x.pages || 1), 0) }),
    small: s => derive(s, named(s, '-small', 'jpg'), { size: Math.min(s.size * .18, 640 * KB), ms: 800 }),
    toJpg: s => derive(s, named(s, '', 'jpg'), { size: s.size * .55, ms: 700 }),
    toPng: s => derive(s, named(s, '', 'png'), { size: s.size * 2.2, ms: 700 }),
    imgPdf: files => derive(files[0], files.length > 1 ? 'scans.pdf' : named(files[0], '', 'pdf'), { size: files.reduce((a, x) => a + x.size * .6, 0), from: 0, art: undefined, pages: files.length }),
    rotateImg: s => derive(s, named(s, '-rotated', extOf(s.name) === 'png' ? 'png' : 'jpg'), { size: s.size, rot: (s.rot || 0) + 90, ms: 600 }),
    rotateVid: s => derive(s, `${baseOf(s.name)} (rotated).mp4`, { size: s.size * .8, rot: (s.rot || 0) + 90, ms: 1500 }),
    square: s => derive(s, named(s, '-square', 'jpg'), { size: s.size * .7, square: true, ms: 700 }),
    icon: s => derive(s, named(s, '', 'ico'), { size: 118 * KB, from: 0, square: true, ms: 600 }),
    clean: s => derive(s, named(s, '-clean'), { size: s.size * .98, ms: 600 }),
    mp4: s => derive(s, named(s, '', 'mp4'), { size: s.size * .084, ms: 1800 }),
    mp3: s => derive(s, named(s, '', 'mp3'), { size: 3.1 * MB, from: 0, ms: 1100 }),
    gif: s => derive(s, named(s, '', 'gif'), { size: 6.8 * MB, from: 0, ms: 1500 }),
    webm: s => derive(s, named(s, '', 'webm'), { size: s.size * .07, ms: 1800 }),
    smallVid: s => derive(s, named(s, '-small', 'mp4'), { size: s.size * .25, ms: 1700 }),
    under: mb => s => derive(s, named(s, `-${mb}MB`, 'mp4'), { size: mb * MB * .96, ms: 1700 }),
    frame: s => derive(s, named(s, '-frame', 'png'), { size: 1.6 * MB, from: 0, len: undefined, ms: 600 }),
    silent: s => derive(s, named(s, '-silent', 'mp4'), { size: s.size * .97, ms: 700 }),
    audio: ext => s => derive(s, named(s, '', ext), { size: ext === 'wav' ? s.size * 9 : s.size * .9, ms: 900 }),
    officePdf: s => derive(s, named(s, '', 'pdf'), { size: Math.max(s.size * 1.6, 90 * KB), from: 0, pages: 3, ms: 1200 }),
    csv: s => derive(s, named(s, '', 'csv'), { size: s.size * .3, from: 0, ms: 700 }),
    extract: s => {
      const name = unique(X.dir, baseOf(s.name)), sub = childDir(name);
      tree[sub] = (s.inside || []).map(x => ({ ...x, id: ++seq }));
      const dir = d(name, 0); dir.fresh = true; list(X.dir).push(dir); draw(); status(`Extracted to ${name}`);
      setTimeout(() => { dir.fresh = false; }, 700); changed();
    },
    zip: files => derive(files[0], `${baseOf(files[0].name)}.zip`, { size: files.reduce((a, x) => a + (x.size || 300 * KB), 0) * .9, from: 0, inside: files.map(x => ({ ...x })), art: undefined, rot: undefined, ms: 1200 }),
  };
  function toast(head, text, icon = 'assets/apps/explorer.png') { OS.toast(head, text, icon); }
  const say = files => files.length === 1 ? files[0].name : `${files.length} files`;
  async function copyPath(files) {
    const p = (files.length ? files.map(x => pathOf(X.dir, x.name)) : [pathOf(X.dir)]).join('\n');
    try { await navigator.clipboard.writeText(p); } catch (_) { }
    toast('Path copied', p.split('\n')[0] + (files.length > 1 ? ` and ${files.length - 1} more` : ''));
  }
  async function sha(files) {
    const out = [];
    for (const x of files.filter(x => !x.dir)) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${x.name}|${Math.round(x.size)}`));
      out.push([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''));
    }
    if (!out.length) return toast('SHA-256', 'Select a file first.');
    try { await navigator.clipboard.writeText(out.join('\n')); } catch (_) { }
    toast('SHA-256 copied', `${out[0].slice(0, 32)}…`);
  }
  function mail(files) {
    if (!files.length) return toast('Mail file', 'Select a file first.');
    const attach = files.map(x => ({ name: x.name, size: fmt(x.size), bytes: Math.round(x.size), kind: kindOf(x), path: pathOf(X.dir, x.name) }));
    // Another app may give Outlook a window of its own; until then the toast says what happens.
    if (OS.apps.has('outlook')) return OS.open('outlook', { attach });
    toast('New message', `${say(files)} ${files.length === 1 ? 'is' : 'are'} attached.`, 'assets/apps/outlook.png');
  }
  function remove(files, toBin = true) {
    const from = X.dir;
    files.forEach(x => {
      const arr = list(from), i = arr.indexOf(x);
      if (i >= 0) arr.splice(i, 1);
      if (toBin) bin.unshift({ file: x, from, at: Date.now() });
      X.sel.delete(x);
    });
    if (toBin && files.length) document.getElementById('bin')?.classList.remove('is-empty');
    draw(); changed();
  }
  function newFolder() {
    const dir = d(unique(X.dir, 'New folder'), 0);
    list(X.dir).push(dir);
    X.sel.clear(); X.sel.add(dir);
    draw(); changed();
    rename(dir);
  }
  function rename(fl) {
    const el = fl && elOf(fl);
    if (!el) return toast('Rename', 'Select a file, then rename it.');
    const n = el.querySelector('.xp-n'), inp = document.createElement('input');
    inp.className = 'xp-ren'; inp.value = fl.name; inp.setAttribute('aria-label', 'New name');
    n.replaceWith(inp);
    inp.focus();
    inp.setSelectionRange(0, fl.dir ? fl.name.length : baseOf(fl.name).length);
    let done = false;
    const end = ok => {
      if (done) return; done = true;
      const v = inp.value.trim();
      if (ok && v && v !== fl.name) {
        if (/[\\/:*?"<>|]/.test(v)) toast('Rename', 'A file name can\'t contain \\ / : * ? " < > |');
        else {
          const was = fl.dir ? childDir(fl.name) : null;
          fl.name = unique(X.dir, v);
          if (was) Object.keys(tree).filter(k => k === was || k.startsWith(was + '\\')).forEach(k => { tree[childDir(fl.name) + k.slice(was.length)] = tree[k]; delete tree[k]; });
          changed();
        }
      }
      draw();
      X.files.focus({ preventScroll: true });
    };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') end(true); if (e.key === 'Escape') end(false); });
    inp.addEventListener('blur', () => end(true));
    inp.addEventListener('pointerdown', e => e.stopPropagation());
  }
  function datePrefix(files) {
    const p = new Date().toISOString().slice(0, 10) + '_';
    files.forEach(x => { if (!x.name.startsWith(p)) x.name = unique(X.dir, p + x.name); });
    draw(); changed();
  }
  function open(fl) {
    if (!fl) return;
    const k = kindOf(fl);
    if (fl.dir) return go(childDir(fl.name));
    if (k === 'zip') return toast(fl.name, 'Pick "Extract here" in the ring to unpack it next to the zip.');
    if (k === 'audio' && fl.track != null && OS.apps.has('music')) return OS.open('music', { track: fl.track });
    if (k === 'txt' && OS.apps.get('notepad')) return OS.open('notepad');
    toast(fl.name, `${typeOf(fl)} · ${fmt(fl.size)}. Hold the mouse on it to see its ring.`);
  }
  // Copy to… / Move to…: the app asks for a folder; so does this.
  function pickFolder(files, move) {
    X.root.querySelector('.xp-pick')?.remove();
    const box = document.createElement('div');
    box.className = 'xp-pick';
    box.innerHTML = `<div role="dialog" aria-label="${move ? 'Move to' : 'Copy to'}"><b>${move ? 'Move' : 'Copy'} ${esc(say(files))} to…</b>`
      + TOP.filter(n => n !== X.dir && n !== 'Music').map(n => `<button type="button" data-to="${n}">${FOLDER}${n}</button>`).join('') + '<button type="button" class="xp-cancel">Cancel</button></div>';
    X.root.append(box);
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      box.remove();
      if (!b.dataset.to) return;
      list(b.dataset.to).push(...files.map(x => ({ ...x, id: ++seq, name: unique(b.dataset.to, x.name), t: Date.now() })));
      if (move) remove(files, false);
      changed();
      toast(move ? 'Moved' : 'Copied', `${say(files)} → ${b.dataset.to}`);
    });
    box.querySelector('button').focus();
  }

  // Each op once: what the drop ring and the window's ring offer. Labels are the gallery's (Settings/Gallery/recipes.json)
  // for the window ring, FileConvert's for the drop ring.
  const S = (label, icon, tint, says, run) => ({ label, icon: I[icon] || icon, tint, say: says, run });
  const W = {   // window ring, by recipe
    shrinkPdf: S('Shrink PDF', 'shrink', '#ff6b6b', 'A smaller copy named *-small.pdf.', fs => each(DO.shrinkPdf)(fs)),
    zip: S('Zip', 'zip', '#fbbf24', 'Zips the selected files with 7-Zip.', fs => fs.length ? DO.zip(fs) : toast('Zip', 'Select files first.')),
    mail: S('Mail file', 'mail', '#7cc4ff', 'New Outlook message with the file attached.', mail),
    copyPath: S('Copy path', 'copy', '#a5b4fc', 'Copies the full path of the selected file.', copyPath),
    pdfJpg: S('→ JPG', 'image', '#6ee7a0', 'Every page as a JPG next to the PDF.', fs => each(DO.pdfPages('jpg'))(fs)),
    pdfText: S('PDF → text', 'text', '#c4a1ff', 'The text of the PDF as a .txt next to it.', fs => each(DO.pdfText)(fs)),
    merge: S('Merge PDFs', 'layers', '#fdba74', 'One merged.pdf in the folder, in selection order.', DO.merge),
    small: S('→ small JPG', 'shrink', '#ff6b6b', '1600 px wide copy next to the original.', fs => each(DO.small)(fs)),
    toJpg: S('→ JPG', 'image', '#6ee7a0', 'A JPG copy next to the original.', fs => each(DO.toJpg)(fs)),
    toPng: S('→ PNG', 'image', '#6ee7a0', 'A PNG copy next to the original.', fs => each(DO.toPng)(fs)),
    imgPdf: S('Images → PDF', 'pdf', '#ff7aa8', 'The selected images as one PDF.', DO.imgPdf),
    rotateImg: S('Rotate ↻', 'rotate', '#fdba74', 'A copy turned clockwise.', fs => each(DO.rotateImg)(fs)),
    mp4: S('→ MP4', 'film', '#7cc4ff', 'An MP4 copy that plays everywhere (H.264), next to the original.', fs => each(DO.mp4)(fs)),
    mp3: S('→ MP3', 'music', '#c4a1ff', 'Saves the sound of a video as an MP3.', fs => each(DO.mp3)(fs)),
    gif: S('→ GIF', 'image', '#6ee7a0', 'Turns a short video into a GIF.', fs => each(DO.gif)(fs)),
    rotateVid: S('Rotate ↻', 'rotate', '#fdba74', 'For a phone video that came out sideways: turns it clockwise.', fs => each(DO.rotateVid)(fs)),
    mb10: S('10 MB', 'shrink', '#ff6b6b', 'Shrinks a video to fit Discord\'s free 10 MB limit or an e-mail. Up to about 3 minutes.', fs => each(DO.under(10))(fs)),
    xlsxPdf: S('XLSX → PDF', 'pdf', '#4ade80', 'Converts the selected .xlsx to PDF next to it, with Excel.', fs => each(DO.officePdf)(fs)),
    docxPdf: S('DOCX → PDF', 'pdf', '#7cb4ff', 'Converts the selected .docx to PDF next to it, with Word.', fs => each(DO.officePdf)(fs)),
    extract: S('Extract here', 'extract', '#fbbf24', 'Extracts the selected .zip/.7z/.rar into a folder with the same name.', fs => each(DO.extract)(fs)),
    play: S('Play', 'play', '#6ee7a0', 'Plays it in Music.', fs => open(fs[0])),
    open: S('Open', 'extract', '#ffd166', 'Opens the folder.', fs => open(fs[0])),
    rename: S('Rename', 'rename', '#5eead4', 'Select a file, then rename it.', fs => rename(fs[0])),
    datePfx: S('date_name', 'calendar', '#ffd166', 'scan.pdf becomes 2026-09-25_scan.pdf, so the folder sorts itself.', datePrefix),
    sha: S('SHA256', 'hash', '#a5b4fc', 'SHA-256 of the selected file, on the clipboard.', sha),
    newFolder: S('New folder', 'folderPlus', '#ffd166', 'A new folder here, ready to name.', newFolder),
    terminal: S('Terminal here', 'terminal', '#c4a1ff', 'Windows Terminal in the folder you are looking at.', () => OS.open('terminal', { cwd: X.dir })),
    all: S('Select all', 'checks', '#6ee7a0', 'Selects everything in the folder.', () => { X.items.forEach(x => X.sel.add(x)); paintSel(); }),
    view: S('View', 'grid', '#7cc4ff', 'Large icons or details.', () => { X.view = X.view === 'list' ? 'grid' : 'list'; draw(); }),
    sort: S('Sort', 'sort', '#fdba74', 'By name, date, size or type.', () => { const o = ['name', 'date', 'size', 'type']; X.sort = o[(o.indexOf(X.sort) + 1) % o.length]; draw(); status(`Sorted by ${X.sort}`); }),
    bin: S('Recycle Bin', 'trash', '#ff6b6b', 'Opens the Recycle Bin.', () => OS.open('bin')),
    up: S('Up', 'up', '#93c5fd', 'The folder above this one.', () => X.dir && go(X.dir.split('\\').slice(0, -1).join('\\'))),
  };
  function windowRing() {
    const s = sel(), kinds = new Set(s.map(kindOf)), k = kinds.size === 1 ? [...kinds][0] : s.length ? 'mixed' : 'none';
    const ext = s.length ? extOf(s[0].name) : '';
    // Convert is a nested ring: pointed at, what the files can become comes out as bubbles (Pro, next update).
    const convert = ids => ({ label: 'Convert', icon: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5"/>', tint: '#6ee7a0', say: 'A nested ring: point at it and what the files can become comes out as bubbles.', children: ids.map(id => ({ ...W[id], run: () => W[id].run(sel()) })) });
    const R = {
      none: ['newFolder', 'terminal', 'view', 'copyPath', 'bin', 'sort', 'up', 'all'],
      pdf: ['shrinkPdf', 'zip', 'mail', 'copyPath', s.length > 1 ? 'merge' : 'pdfText', 'rename', 'datePfx', 'pdfJpg'],
      image: ['small', 'rotateImg', convert([...(ext === 'jpg' || ext === 'jpeg' ? [] : ['toJpg']), ...(ext === 'png' ? [] : ['toPng']), 'imgPdf']), 'zip', 'mail', 'copyPath', 'rename'],
      video: [convert([...(ext === 'mp4' ? [] : ['mp4']), 'mp3', 'gif']), 'mb10', 'rotateVid', 'rename', 'zip', 'mail', 'copyPath'],
      xlsx: ['xlsxPdf', 'zip', 'mail', 'copyPath', 'rename', 'datePfx', 'sha', 'newFolder'],
      docx: ['docxPdf', 'zip', 'mail', 'copyPath', 'rename', 'datePfx', 'sha', 'newFolder'],
      zip: ['extract', 'mail', 'copyPath', 'rename', 'sha', 'datePfx', 'newFolder', 'terminal'],
      audio: ['play', 'zip', 'mail', 'copyPath', 'rename', 'datePfx', 'sha', 'newFolder'],
      folder: ['open', 'zip', 'copyPath', 'terminal', 'rename', 'newFolder', 'datePfx', 'all'],
      txt: ['zip', 'mail', 'copyPath', 'rename', 'datePfx', 'sha', 'newFolder', 'all'],
      mixed: ['zip', 'mail', 'copyPath', 'datePfx', 'sha', 'newFolder', 'all', 'view'],
    }[k] || ['zip', 'mail', 'copyPath', 'rename', 'newFolder', 'all', 'view', 'sort'];
    return R.map(id => typeof id === 'object' ? id : ({ ...W[id], run: () => W[id].run(sel()) }));
  }

  // The drop ring's slices: FileConvert.OpsFor, split by FileConvert.Wheel (Shift: what it becomes, Ctrl: tools).
  const C = (label, icon, says, run) => ({ label, icon: I[icon] || icon, say: says, run });
  function dropOps(files, tools) {
    const kinds = new Set(files.map(kindOf)), k = kinds.size === 1 ? [...kinds][0] : 'mixed', all = e => files.every(x => extOf(x.name) === e || (e === 'jpg' && extOf(x.name) === 'jpeg'));
    const conv = [];
    if (k === 'image') {
      conv.push(C('Smaller', 'shrink', 'A smaller JPG, 1920 px at most, named *-small.jpg.', each(DO.small)));
      if (!all('jpg')) conv.push(C('JPG', 'image', 'A JPG copy.', each(DO.toJpg)));
      if (!all('png')) conv.push(C('PNG', 'image', 'A PNG copy.', each(DO.toPng)));
      conv.push(C('PDF', 'pdf', 'The pictures as one PDF.', DO.imgPdf), C('Copy text', 'scan', 'Reads the text in the picture (Windows OCR) onto the clipboard.', () => toast('Text copied', '"Your workday. In one gesture."')),
        C('No location', 'pinOff', 'A copy without the GPS position and camera details.', each(DO.clean)), C('Rotate', 'rotate', 'A copy turned clockwise.', each(DO.rotateImg)),
        C('Square', 'square', 'A square crop from the middle.', each(DO.square)), C('Icon', 'star', 'An .ico for a shortcut or a folder.', each(DO.icon)));
    } else if (k === 'video') {
      conv.push(C('Smaller', 'shrink', 'A smaller MP4 next to the original.', each(DO.smallVid)));
      if (!all('mp4')) conv.push(C('MP4', 'film', 'An MP4 copy that plays everywhere (H.264).', each(DO.mp4)));
      conv.push(C('MP3', 'music', 'The sound as an MP3.', each(DO.mp3)), C('GIF', 'image', 'A short video as a GIF.', each(DO.gif)), C('Frame', 'camera', 'A still of the first frame as a PNG.', each(DO.frame)),
        C('No sound', 'mute', 'A copy without the sound, in a second.', each(DO.silent)), C('10 MB', 'mail', 'Under 10 MB, for Discord or an e-mail.', each(DO.under(10))), C('25 MB', 'mail', 'Under 25 MB, for an e-mail.', each(DO.under(25))));
    } else if (k === 'pdf') {
      conv.push(C('Smaller', 'shrink', 'A smaller copy named *-small.pdf (Ghostscript).', each(DO.shrinkPdf)), C('PNG', 'image', 'Every page as a PNG.', each(DO.pdfPages('png'))), C('JPG', 'image', 'Every page as a JPG.', each(DO.pdfPages('jpg'))));
      if (files.length > 1) conv.push(C('Merge', 'layers', 'One PDF, in the order they were selected.', DO.merge));
    } else if (k === 'audio') {
      ['mp3', 'm4a', 'wav'].filter(e => !all(e)).forEach(e => conv.push(C(e.toUpperCase(), 'music', `An ${e.toUpperCase()} copy.`, each(DO.audio(e)))));
    } else if (k === 'xlsx') conv.push(C('PDF', 'pdf', 'A PDF, with Excel.', each(DO.officePdf)), C('CSV', 'table', 'A CSV (UTF-8), with Excel.', each(DO.csv)));
    else if (k === 'docx') conv.push(C('PDF', 'pdf', 'A PDF, with Word.', each(DO.officePdf)));
    else if (k === 'zip') conv.push(C('Extract', 'extract', 'Into a folder with the same name.', each(DO.extract)));
    const tool = [];
    if (k !== 'zip') tool.push(C('ZIP', 'zip', 'One .zip of what you dragged.', DO.zip));
    tool.push(C('Copy to…', 'copyTo', 'Asks for a folder, then copies it there.', fs => pickFolder(fs, false)), C('Move to…', 'move', 'Asks for a folder, then moves it there.', fs => pickFolder(fs, true)),
      C('Share', 'share', 'The Windows share sheet: Nearby sharing, Outlook, Teams…', fs => toast('Share', `${say(fs)}: Nearby sharing, Outlook, Teams, WhatsApp…`)), C('Copy path', 'copy', 'The full path on the clipboard.', copyPath));
    if (!files.some(x => x.dir)) tool.push(C('SHA-256', 'hash', 'The file\'s SHA-256 on the clipboard.', sha));
    // A key with nothing to show opens the other's, so a tap is never for nothing.
    const pick = tools ? (tool.length ? tool : conv) : (conv.length ? conv : tool);
    return { ops: pick.slice(0, 8), tools: pick === tool };
  }

  // ---- The drop ring: a second live ring, opened at the pointer mid-drag ----
  let dropRing = null, drag = null;
  function ensureDrop() {
    if (dropRing) return dropRing;
    const el = document.createElement('div');
    el.className = 'ring os-ring xp-drop';
    el.setAttribute('aria-hidden', 'true');
    document.body.append(el);
    dropRing = RingLive.create(el, {
      onHot: s => {
        if (!drag?.ring) return;
        const i = s ? drag.ring.ops.indexOf(s) : -1;
        drag.chip.lean(i, drag.ring.ops.length);
        drag.chip.caption(s ? s.label : drag.label);
        sayLine(s ? `${s.label}. ${s.say}` : 'Pick by direction, let go. Let go in the middle: nothing happens.');
      },
      onFire: s => {
        const dg = drag, i = dg.ring.ops.indexOf(s);
        s.run(dg.files);
        dg.chip.fly(i, dg.ring.ops.length, () => dropRing.close());
      },
    });
    return dropRing;
  }
  function sayLine(t) {
    const el = document.getElementById('ring-say');
    if (!el) return;
    el.textContent = t || '';
    el.classList.toggle('is-on', !!t);
  }
  // The file, small, in the hub: shrinks in from the drag picture, leans toward the lit slice, flies into the one
  // it is dropped on (stretched along its flight) while a ripple spreads, or pops back out on a cancel.
  function makeChip(files, from) {
    const el = document.createElement('div');
    el.className = 'xp-chip';
    el.innerHTML = `<span class="xp-chip-art">${thumb(files[0])}${files.length > 1 ? `<b>${files.length}</b>` : ''}</span><span class="xp-chip-cap"></span>`;
    document.body.append(el);
    const cap = el.querySelector('.xp-chip-cap');
    let c = { x: from.x, y: from.y };
    const put = (x, y, s, o = 1) => { el.style.transform = `translate(${x}px, ${y}px) scale(${s})`; el.style.opacity = o; };
    put(from.x, from.y, 1.5, .85);
    const ring = () => document.querySelector('.xp-drop').getBoundingClientRect();
    const toward = (i, n, r) => { const a = (i * 360 / n - 90) * Math.PI / 180; return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r }; };
    return {
      el,
      caption(t) { cap.textContent = t; },
      land(at) { c = at; el.classList.add('is-in'); requestAnimationFrame(() => put(c.x, c.y, 1)); },
      lean(i, n) { const p = i >= 0 ? toward(i, n, 10) : c; put(p.x, p.y, 1); },
      fly(i, n, done) {
        const w = ring().width || 340, p = toward(i, n, w * ((150 + 48) / 2) / 320), a = i * 360 / n - 90;
        el.classList.remove('is-in');
        el.animate([
          { transform: `translate(${c.x}px, ${c.y}px) scale(1)`, opacity: 1 },
          { transform: `translate(${(c.x + p.x) / 2}px, ${(c.y + p.y) / 2}px) rotate(${a}deg) scale(1.25, .7) rotate(${-a}deg)`, opacity: 1, offset: .55 },
          { transform: `translate(${p.x}px, ${p.y}px) scale(.35)`, opacity: 0 },
        ], { duration: 340, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).onfinish = () => {
          el.remove();
          const rp = document.createElement('i');
          rp.className = 'xp-ripple';
          rp.style.left = p.x + 'px'; rp.style.top = p.y + 'px';
          document.body.append(rp);
          rp.animate([{ transform: 'translate(-50%, -50%) scale(.2)', opacity: .75 }, { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => rp.remove();
          done?.();
        };
      },
      out(to, done) {
        el.classList.remove('is-in');
        el.animate([{ transform: el.style.transform, opacity: 1 }, { transform: `translate(${to.x + 18}px, ${to.y + 18}px) scale(1.5)`, opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }).onfinish = () => { el.remove(); done?.(); };
      },
    };
  }
  function startDrag(files, e) {
    const g = document.createElement('div');
    g.className = 'xp-ghost';
    g.innerHTML = `${thumb(files[0])}<span>${esc(say(files))}</span>${files.length > 1 ? `<b>${files.length}</b>` : ''}`;
    const keys = document.createElement('div');
    keys.className = 'xp-keys';
    keys.innerHTML = '<button type="button" data-k="shift"><kbd>Shift</kbd> Convert</button><button type="button" data-k="ctrl"><kbd>Ctrl</kbd> Tools</button><span>Tap a key mid-drag: the drop ring <b class="tag tag-pro">Pro</b></span>';
    // On a touch screen a second finger taps the keys.
    keys.addEventListener('pointerdown', ev => { const b = ev.target.closest('[data-k]'); if (b) { ev.preventDefault(); ev.stopPropagation(); openDrop(b.dataset.k === 'ctrl'); } });
    document.body.append(g, keys);
    drag = { files, g, keys, x: e.clientX, y: e.clientY, pid: e.pointerId, label: say(files), ring: null, chip: null, target: null };
    X.root.classList.add('is-dragging');
    moveGhost(e.clientX, e.clientY);
  }
  function moveGhost(x, y) {
    drag.x = x; drag.y = y;
    drag.g.style.transform = `translate(${x + 10}px, ${y + 12}px)`;
    const t = document.elementFromPoint(x, y)?.closest('.xp-f, .xp-side [data-dir], #bin');
    const fl = t?.classList.contains('xp-f') ? X.items.find(i => i.id === +t.dataset.id) : null;
    const ok = t && (t.id === 'bin' || (fl ? fl.dir && !drag.files.includes(fl) : t.dataset.dir !== X.dir && t.dataset.dir !== undefined && t.dataset.dir !== 'Music'));
    if (drag.target !== (ok ? t : null)) { drag.target?.classList.remove('is-drop'); drag.target = ok ? t : null; drag.target?.classList.add('is-drop'); }
  }
  function openDrop(tools) {
    if (!drag) return;
    const r = dropOps(drag.files, tools), ring = ensureDrop();
    // The same look as the desktop's ring (OS.setRingTheme).
    const main = OS.ring.el;
    RDRing.themeRing(ring.el, main._theme || RDRing.DEFAULT_THEME());
    ring.el.classList.toggle('is-themed', main.classList.contains('is-themed'));
    ring.el.classList.toggle('is-upper', main.classList.contains('is-upper'));
    // Whole on the screen: near an edge (a phone held in one hand) it opens a little in from the pointer.
    const half = Math.min(340, innerWidth * .9, innerHeight * .8) / 2, clamp = (v, max) => Math.max(half, Math.min(max - half, v));
    const at = { x: clamp(drag.x, innerWidth), y: clamp(drag.y, innerHeight) }, again = !!drag.ring;
    drag.ring = r;
    drag.target?.classList.remove('is-drop'); drag.target = null;
    ring.swap(r.ops, { title: '', sub: '' }, at);
    if (!again) {
      drag.chip = makeChip(drag.files, { x: drag.x + 40, y: drag.y + 40 });
      drag.g.style.display = 'none';
    }
    drag.chip.caption(drag.label);
    setTimeout(() => drag?.chip?.land(at), again ? 0 : 60);
    drag.keys.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('is-on', (b.dataset.k === 'ctrl') === r.tools));
    sayLine(`${r.tools ? 'Tools' : 'Convert'}: pick by direction, let go. Let go in the middle: nothing happens.`);
  }
  function endDrag(e, cancel) {
    const dg = drag;
    drag = null;
    dg.g.remove(); dg.keys.remove();
    dg.target?.classList.remove('is-drop');
    X?.root.classList.remove('is-dragging');
    if (dg.ring) {
      const i = cancel ? -1 : dropRing.aim(e.clientX, e.clientY);
      if (i >= 0) { drag = dg; dropRing.fire(i); drag = null; }
      else dg.chip.out({ x: e.clientX, y: e.clientY }, () => dropRing.close());
      setTimeout(() => sayLine(''), 900);
      return;
    }
    if (cancel || !dg.target) return;
    if (dg.target.id === 'bin' || dg.target.dataset.dir === 'bin') return remove(dg.files);
    const fl = X.items.find(i => i.id === +dg.target.dataset.id), to = fl ? childDir(fl.name) : dg.target.dataset.dir;
    list(to).push(...dg.files.map(x => ({ ...x, name: unique(to, x.name) })));
    remove(dg.files, false);
    status(`Moved ${say(dg.files)} to ${to.split('\\').pop() || 'Home'}`);
  }
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (drag.ring) { drag.x = e.clientX; drag.y = e.clientY; dropRing.pointer(e.clientX, e.clientY); }
    else moveGhost(e.clientX, e.clientY);
  });
  addEventListener('pointerup', e => { if (drag && e.pointerId === drag.pid) endDrag(e); });
  addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.pid) endDrag(e, true); });
  addEventListener('keydown', e => {
    if (!drag) return;
    if (e.key === 'Shift' || e.key === 'Control') { e.preventDefault(); if (!e.repeat) openDrop(e.key === 'Control'); }
    if (e.key === 'Escape') { e.preventDefault(); endDrag({ clientX: drag.x, clientY: drag.y }, true); }
  }, true);

  // ---- Pointer and keys in the file pane: select (click, Ctrl, Shift, a box), drag, open ----
  function wire() {
    const files = X.files;
    let press = null;
    files.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.button !== 2) return;
      if (e.target.closest('.xp-ren')) return;
      const el = e.target.closest('.xp-f'), fl = el && X.items.find(i => i.id === +el.dataset.id);
      if (fl) {
        if (e.ctrlKey || e.metaKey) { X.sel.has(fl) ? X.sel.delete(fl) : X.sel.add(fl); X.anchor = fl; }
        else if (e.shiftKey && X.anchor) { const a = X.items.indexOf(X.anchor), b = X.items.indexOf(fl); X.sel.clear(); X.items.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => X.sel.add(x)); }
        else if (!X.sel.has(fl)) { X.sel.clear(); X.sel.add(fl); X.anchor = fl; }
        paintSel();
      } else if (!e.ctrlKey && !e.shiftKey) { X.sel.clear(); paintSel(); }
      if (e.button !== 0) return;
      press = { x: e.clientX, y: e.clientY, fl, id: e.pointerId, t: performance.now(), mods: e.ctrlKey || e.shiftKey || e.metaKey, base: new Set(X.sel) };
    });
    addEventListener('pointermove', e => {
      if (!press || e.pointerId !== press.id) return;
      // The shell opens the ring after a still hold (130 ms, 300 ms by touch) unless the pointer moved 8 px first:
      // moving past that in time is a drag (the shell has let go of it), later it is the ring's flick.
      if (!press.live) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 9) return;
        if (performance.now() - press.t > (e.pointerType === 'touch' ? 290 : 120) || OS.ring.held) { press = null; return; }
        press.live = true;
        if (press.fl) { const p = press; press = null; return startDrag(X.sel.has(p.fl) ? sel() : [p.fl], e); }
      }
      // A box from the press: what it touches is selected.
      const r = files.getBoundingClientRect();
      if (!X.box) { X.box = document.createElement('i'); X.box.className = 'xp-box'; files.append(X.box); }
      const x1 = Math.min(press.x, e.clientX), y1 = Math.min(press.y, e.clientY), x2 = Math.max(press.x, e.clientX), y2 = Math.max(press.y, e.clientY);
      Object.assign(X.box.style, { left: x1 - r.left + files.scrollLeft + 'px', top: y1 - r.top + files.scrollTop + 'px', width: x2 - x1 + 'px', height: y2 - y1 + 'px' });
      X.sel = new Set(press.mods ? press.base : []);
      files.querySelectorAll('.xp-f').forEach(el => { const b = el.getBoundingClientRect(); if (b.right > x1 && b.left < x2 && b.bottom > y1 && b.top < y2) X.sel.add(X.items.find(i => i.id === +el.dataset.id)); });
      paintSel();
    });
    addEventListener('pointerup', e => {
      if (!press || e.pointerId !== press.id) return;
      // A plain click on one of several selected files leaves just that one (as Windows does on release).
      if (press.fl && !press.mods && X.sel.size > 1 && performance.now() - press.t < 300 && !OS.ring.held) { X.sel = new Set([press.fl]); X.anchor = press.fl; paintSel(); }
      press = null; X.box?.remove(); X.box = null;
    });
    files.addEventListener('dblclick', e => { const el = e.target.closest('.xp-f'); if (el) open(X.items.find(i => i.id === +el.dataset.id)); });
    X.el.addEventListener('keydown', e => {
      if (e.target.closest('input')) return;
      const s = sel();
      if (e.key === 'Delete' && s.length) { e.preventDefault(); remove(s); }
      else if (e.key === 'F2' && s.length) { e.preventDefault(); rename(s[0]); }
      else if (e.key === 'Enter' && s.length === 1) { e.preventDefault(); open(s[0]); }
      else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); X.items.forEach(x => X.sel.add(x)); paintSel(); }
      else if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) { e.preventDefault(); nav(-1); }
      else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); W.up.run(); }
    });
  }
  function nav(step) { const i = X.hi + step; if (i < 0 || i >= X.hist.length) return; X.hi = i; go(X.hist[i], false); }

  OS.register({
    id: 'explorer',
    tint: '#ffc83d',
    render(body, c) {
      X = c;
      c.sel = new Set(); c.view = 'grid'; c.sort = 'name'; c.q = ''; c.hist = []; c.hi = -1; c.msg = '';
      body.innerHTML = `<div class="xp">
        <div class="xp-top">
          <button type="button" class="xp-nb xp-back" aria-label="Back">${OS.svg(I.left)}</button><button type="button" class="xp-nb xp-fwd" aria-label="Forward">${OS.svg(I.right)}</button><button type="button" class="xp-nb xp-up" aria-label="Up">${OS.svg(I.up)}</button>
          <nav class="xp-crumbs" aria-label="Address"></nav>
          <label class="xp-find">${OS.svg(OS.icons.search)}<input type="search" aria-label="Search this folder" autocomplete="off"></label>
        </div>
        <div class="xp-cmd" role="toolbar" aria-label="Commands">
          <button type="button" data-cmd="newFolder">${OS.svg(I.folderPlus)}<span>New folder</span></button>
          <button type="button" data-cmd="rename" aria-label="Rename" title="Rename (F2)">${OS.svg(I.rename)}</button>
          <button type="button" data-cmd="copyPath" aria-label="Copy path" title="Copy path">${OS.svg(I.copy)}</button>
          <button type="button" data-cmd="delete" aria-label="Delete" title="Delete">${OS.svg(I.trash)}</button>
          <i></i>
          <button type="button" data-cmd="sort">${OS.svg(I.sort)}<span>Sort</span></button>
          <button type="button" data-cmd="view">${OS.svg(I.grid)}<span>View</span></button>
          <span class="xp-hint">Select files, then hold the mouse on them: the ring is for what is selected.</span>
        </div>
        <div class="xp-main">
          <nav class="xp-side" aria-label="Folders">${SIDE.map(([t, dir, ic, col]) => `<button type="button" data-dir="${dir}" style="--c:${col}">${OS.svg(I[ic])}<span>${t}</span></button>`).join('')}
            <hr><button type="button" data-dir="bin" style="--c:#cbd5e1">${OS.svg(I.trash)}<span>Recycle Bin</span></button></nav>
          <div class="xp-files" role="listbox" aria-multiselectable="true" aria-label="Files" tabindex="0"></div>
        </div>
        <div class="xp-stat" aria-live="polite"></div>
      </div>`;
      const $ = s => body.querySelector(s);
      Object.assign(c, { root: $('.xp'), files: $('.xp-files'), crumbs: $('.xp-crumbs'), search: $('.xp-find input'), side: $('.xp-side'), stat: $('.xp-stat'), back: $('.xp-back'), fwd: $('.xp-fwd'), upBtn: $('.xp-up') });
      c.back.onclick = () => nav(-1); c.fwd.onclick = () => nav(1); c.upBtn.onclick = () => W.up.run();
      c.crumbs.addEventListener('click', e => { const b = e.target.closest('[data-dir]'); if (b) go(b.dataset.dir); });
      c.side.addEventListener('click', e => { const b = e.target.closest('[data-dir]'); if (!b) return; b.dataset.dir === 'bin' ? OS.open('bin') : go(b.dataset.dir); });
      c.search.addEventListener('input', () => { c.q = c.search.value; draw(); });
      $('.xp-cmd').addEventListener('click', e => {
        const b = e.target.closest('[data-cmd]');
        if (!b) return;
        const cmd = b.dataset.cmd;
        if (cmd === 'delete') return sel().length ? remove(sel()) : toast('Delete', 'Select a file first.');
        if (cmd === 'rename') return rename(sel()[0]);
        W[cmd].run(sel());
      });
      wire();
      go(c.args.cwd ?? 'Downloads');
    },
    onOpen(c, args) { if (args.cwd != null && args.cwd !== c.dir) go(args.cwd); },
    onClose() { X = null; },
    ring: () => windowRing(),
  });
  addEventListener('os:files', () => { if (X && !X.files.querySelector('.xp-ren')) { const busy = X.items?.some(x => x.busy); if (!busy) draw(); } });

  window.OSFiles = { tree, list, bin, TOP, HOME, kindOf, typeOf, fmt, when, thumb, pathOf, changed, f };
})();
