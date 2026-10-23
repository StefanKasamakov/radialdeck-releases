/* Excel: a small, real sheet (formulas, selection, copy and paste, formats, filter, freeze panes, sheets).
   Its ring is RadialDeck's Excel ring from the gallery (xl-*, the "Accounting in Excel" pack); in the real app
   each slice presses Excel's own keys, and here those keys work too (Alt+=, Ctrl+Shift+4, Ctrl+Shift+L...). */
(() => {
  const ICON = 'assets/apps/excel.png';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const css = () => document.querySelector('link[href="os/apps/office.css"]') ? null
    : new Promise(ok => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'os/apps/office.css', onload: ok, onerror: ok })));
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    values: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h1v6M14 12h2l-2 6"/>',
    paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sum: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    euro: '<path d="M4 10h12M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
    freeze: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/><path d="M3 3h18v6H9v12H3z" fill="currentColor" fill-opacity=".3" stroke="none"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    date: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    general: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
  };
  const COLS = 12, ROWS = 30, L = i => String.fromCharCode(65 + i), key = (r, c) => L(c) + (r + 1);
  const W = [92, 96, 172, 96, 96, 58, 92, 74, 72, 72, 72, 72], RH = 22, HH = 24, HW = 40;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const serial = (y, m, d) => (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const EUR = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  // Office running costs, first half of 2026. Made up, but adds up.
  const DATA = [
    [1, 5, 'Rent', 'Office rent', 2400, 2400, 'Yes'], [1, 12, 'Software', 'Design tool licences', 310, 350, 'Yes'], [1, 20, 'Travel', 'Train to the trade fair', 186, 250, 'Yes'],
    [1, 28, 'Utilities', 'Electricity', 214, 200, 'Yes'], [2, 5, 'Rent', 'Office rent', 2400, 2400, 'Yes'], [2, 9, 'Marketing', 'Flyers and print', 520, 600, 'Yes'],
    [2, 16, 'Software', 'Cloud storage', 96, 100, 'Yes'], [2, 24, 'Utilities', 'Internet', 59, 60, 'Yes'], [3, 5, 'Rent', 'Office rent', 2400, 2400, 'Yes'],
    [3, 11, 'Travel', 'Hotel, two nights', 342, 300, 'Yes'], [3, 18, 'Marketing', 'Online ads', 760, 700, 'No'], [3, 25, 'Utilities', 'Electricity', 198, 200, 'Yes'],
    [4, 5, 'Rent', 'Office rent', 2400, 2400, 'No'], [4, 14, 'Software', 'Accounting app', 45, 50, 'No'], [4, 22, 'Travel', 'Client visit, fuel', 128, 150, 'No'],
    [4, 29, 'Marketing', 'Trade fair stand', 1150, 1200, 'No'],
  ];
  function seed() {
    const cells = {}, put = (k, raw, fmt, bold) => { cells[k] = { raw: String(raw), fmt: fmt || null, bold: !!bold }; };
    ['Date', 'Category', 'Item', 'Amount', 'Budget', 'Paid', 'Left', 'Used'].forEach((h, i) => put(L(i) + 1, h, null, true));
    DATA.forEach(([m, d, cat, item, amt, bud, paid], i) => {
      const r = i + 2;
      put('A' + r, serial(2026, m, d), 'date'); put('B' + r, cat); put('C' + r, item); put('D' + r, amt, 'cur'); put('E' + r, bud, 'cur');
      put('F' + r, paid); put('G' + r, `=E${r}-D${r}`, 'cur'); put('H' + r, `=D${r}/E${r}`);
    });
    return cells;
  }

  // ---- Values: numbers, text, and formulas with + - * / ( ) and SUM / AVERAGE / MIN / MAX / COUNT over ranges ----
  function keys(a) {
    const m = a.match(/^([A-Z])(\d+)(?::([A-Z])(\d+))?$/);
    if (!m) return [];
    const c0 = m[1].charCodeAt(0) - 65, r0 = +m[2] - 1, c1 = m[3] ? m[3].charCodeAt(0) - 65 : c0, r1 = m[4] ? +m[4] - 1 : r0, out = [];
    for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) out.push(key(r, c));
    return out;
  }
  function val(sh, k, seen = new Set()) {
    const raw = sh.cells[k]?.raw ?? '';
    if (raw === '') return '';
    if (raw[0] !== '=') { const n = Number(raw); return raw.trim() && !isNaN(n) ? n : raw; }
    if (seen.has(k)) return '#REF!';
    seen.add(k);
    const v = calc(sh, raw, seen);
    seen.delete(k);
    return v;
  }
  function calc(sh, raw, seen) {
    let s = raw.slice(1).toUpperCase().replace(/\$/g, '').replace(/\s+/g, '');
    s = s.replace(/(SUM|AVERAGE|MIN|MAX|COUNT)\(([^()]*)\)/g, (_, fn, args) => {
      const vs = args.split(',').flatMap(a => /^[A-Z]\d+(:[A-Z]\d+)?$/.test(a) ? keys(a).map(k => val(sh, k, seen)) : [Number(a)]).filter(v => typeof v === 'number' && !isNaN(v));
      const sum = vs.reduce((a, b) => a + b, 0);
      const r = { SUM: sum, AVERAGE: vs.length ? sum / vs.length : 0, MIN: vs.length ? Math.min(...vs) : 0, MAX: vs.length ? Math.max(...vs) : 0, COUNT: vs.length }[fn];
      return `(${r})`;
    });
    s = s.replace(/([A-Z])(\d+)/g, (_, col, row) => { const v = val(sh, col + row, seen); return `(${typeof v === 'number' ? v : 0})`; });
    // Only digits and arithmetic are left; anything else is a name this little Excel does not know.
    if (!/^[\d.+\-*/()e]*$/.test(s)) return '#NAME?';
    try { const r = Function(`"use strict";return (${s || 0})`)(); return typeof r === 'number' && isFinite(r) ? r : '#DIV/0!'; } catch (_) { return '#VALUE!'; }
  }
  function show(v, fmt) {
    if (typeof v !== 'number') return String(v);
    if (fmt === 'cur') return EUR.format(v);
    if (fmt === 'pct') return Math.round(v * 100) + '%';
    if (fmt === 'date') { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return `${d.getUTCDate()}-${MON[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(2)}`; }
    return Number.isInteger(v) ? String(v) : String(+v.toFixed(6));
  }
  // A copied formula moves with the paste, as in Excel: =E2-D2 pasted one row down is =E3-D3 ($ keeps a part fixed).
  const shift = (raw, dr, dc) => raw[0] !== '=' ? raw : raw.replace(/(\$?)([A-Z])(\$?)(\d+)/g,
    (_, a, col, b, row) => (a ? a + col : L(clamp(col.charCodeAt(0) - 65 + dc, 0, COLS - 1))) + (b ? b + row : Math.max(1, +row + dr)));

  // ---- Selection ----
  const sheet = c => c.sheets[c.cur];
  const rect = c => { const s = c.s; return { r0: Math.min(s.ar, s.r), r1: Math.max(s.ar, s.r), c0: Math.min(s.ac, s.c), c1: Math.max(s.ac, s.c) }; };
  const inside = (c, r, col) => { const q = rect(c); return r >= q.r0 && r <= q.r1 && col >= q.c0 && col <= q.c1; };
  const multi = c => { const q = rect(c); return q.r1 > q.r0 || q.c1 > q.c0; };
  function select(c, ar, ac, r = ar, col = ac) { c.s = { ar, ac, r, c: col }; paint(c); }
  const td = (c, r, col) => c.tbody.rows[r]?.cells[col + 1];
  function lastRow(sh) { let last = 0; for (const k in sh.cells) if (sh.cells[k].raw !== '') last = Math.max(last, +k.slice(1) - 1); return last; }
  function hiddenRows(sh) {
    const out = new Set();
    if (!sh.filter) return out;
    const last = lastRow(sh);
    for (let r = 1; r <= last; r++) for (const col in sh.filter) if (sh.filter[col].size && sh.filter[col].has(show(val(sh, key(r, +col)), sh.cells[key(r, +col)]?.fmt))) out.add(r);
    return out;
  }

  function paint(c) {
    const sh = sheet(c), q = rect(c), fr = sh.frozen, hid = hiddenRows(sh);
    const left = col => HW + W.slice(0, col).reduce((a, b) => a + b, 0);
    for (let r = 0; r < ROWS; r++) {
      const tr = c.tbody.rows[r], th = tr.cells[0];
      tr.hidden = hid.has(r);
      const top = fr && r < fr.r;
      th.classList.toggle('is-on', r >= q.r0 && r <= q.r1);
      th.classList.toggle('is-filtered', !!hid.size && r > 0 && r <= lastRow(sh));
      th.classList.toggle('fz-b', !!fr && r === fr.r - 1);
      Object.assign(th.style, { top: top ? HH + r * RH + 'px' : '', zIndex: top ? 5 : '' });
      for (let col = 0; col < COLS; col++) {
        const cell = tr.cells[col + 1], k = key(r, col), data = sh.cells[k], v = val(sh, k);
        const text = show(v, data?.fmt), head = r === 0 && sh.filter && data?.raw;
        if (head) cell.innerHTML = `<span>${esc(text)}</span><button class="xl-fb${sh.filter[col]?.size ? ' is-on' : ''}" type="button" data-col="${col}" aria-label="Filter ${esc(text)}">${svg(sh.filter[col]?.size ? I.filter : I.down)}</button>`;
        else cell.textContent = text;
        cell.className = (typeof v === 'number' ? 'n' : '') + (data?.bold ? ' b' : '') + (String(v)[0] === '#' ? ' e' : '')
          + (inside(c, r, col) && multi(c) && !(r === c.s.r && col === c.s.c) ? ' s' : '')
          + (fr && r === fr.r - 1 ? ' fz-b' : '') + (fr && col === fr.c - 1 ? ' fz-r' : '');
        // Frozen panes: the rows above and the columns left of the frozen cell stay where they are.
        const st = fr && r < fr.r, sl = fr && col < fr.c;
        Object.assign(cell.style, { position: st || sl ? 'sticky' : '', top: st ? HH + r * RH + 'px' : '', left: sl ? left(col) + 'px' : '', zIndex: st && sl ? 3 : st || sl ? 2 : '' });
      }
    }
    c.thead.querySelectorAll('th').forEach((th, i) => {
      th.classList.toggle('is-on', i > 0 && i - 1 >= q.c0 && i - 1 <= q.c1);
      const sl = i > 0 && fr && i - 1 < fr.c;
      Object.assign(th.style, { left: sl ? left(i - 1) + 'px' : '', zIndex: sl ? 5 : '' });
      th.classList.toggle('fz-r', !!sl && i === fr.c);
    });
    outline(c, c.box, q);
    if (c.clip && c.clip.sheet === c.cur) outline(c, c.ants, c.clip.q); else c.ants.style.display = 'none';
    const k = key(c.s.ar, c.s.ac);
    c.name.textContent = multi(c) ? `${key(q.r0, q.c0)}:${key(q.r1, q.c1)}` : k;
    if (document.activeElement !== c.fbar) c.fbar.value = sh.cells[k]?.raw ?? '';
    status(c);
  }
  // Where a cell sits inside the grid, in the grid's own pixels: the window springs open with a scale and the
  // whole desktop can be scaled (--os-k), and screen pixels would put the box off by that much.
  function at(c, el) {
    const g = c.grid.getBoundingClientRect(), r = el.getBoundingClientRect(), k = g.width / c.grid.offsetWidth || 1;
    const x = v => (v - g.left) / k + c.grid.scrollLeft, y = v => (v - g.top) / k + c.grid.scrollTop;
    return { left: x(r.left), right: x(r.right), top: y(r.top), bottom: y(r.bottom), width: r.width / k, height: r.height / k };
  }
  function outline(c, el, q) {
    const a = td(c, q.r0, q.c0), b = td(c, q.r1, q.c1);
    if (!a || !b) { el.style.display = 'none'; return; }
    const ra = at(c, a), rb = at(c, b);
    Object.assign(el.style, { display: 'block', left: ra.left - 1 + 'px', top: ra.top - 1 + 'px',
      width: rb.right - ra.left + 1 + 'px', height: Math.max(RH, rb.bottom - ra.top + 1) + 'px' });
  }
  function status(c) {
    if (c.sayUntil > Date.now()) return;
    const sh = sheet(c), q = rect(c), nums = [];
    let count = 0;
    for (let r = q.r0; r <= q.r1; r++) for (let col = q.c0; col <= q.c1; col++) { const v = val(sh, key(r, col)); if (v !== '') { count++; if (typeof v === 'number') nums.push(v); } }
    const fmt = sh.cells[key(c.s.ar, c.s.ac)]?.fmt, f = v => show(v, fmt === 'date' ? null : fmt), sum = nums.reduce((a, b) => a + b, 0);
    c.info.textContent = count > 1 && nums.length ? `Average: ${f(sum / nums.length)}   Count: ${count}   Sum: ${f(sum)}` : count > 1 ? `Count: ${count}` : 'Ready';
  }
  function say(c, text) { c.sayUntil = Date.now() + 3500; c.info.textContent = text; setTimeout(() => status(c), 3600); }

  // ---- Editing ----
  function setRaw(c, k, raw, fmt) {
    const sh = sheet(c), old = sh.cells[k];
    sh.cells[k] = { raw: String(raw), fmt: fmt === undefined ? old?.fmt ?? null : fmt, bold: old?.bold ?? false };
  }
  function edit(c, text) {
    stopEdit(c, true);
    const { ar, ac } = c.s, cell = td(c, ar, ac);
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = at(c, cell);
    const inp = Object.assign(document.createElement('input'), { className: 'xl-in', value: text ?? sheet(c).cells[key(ar, ac)]?.raw ?? '' });
    inp.setAttribute('aria-label', 'Cell ' + key(ar, ac));
    Object.assign(inp.style, { left: r.left - 1 + 'px', top: r.top - 1 + 'px', width: Math.max(r.width + 2, 120) + 'px', height: r.height + 2 + 'px' });
    c.grid.append(inp);
    c.edit = inp;
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
    inp.addEventListener('input', () => { c.fbar.value = inp.value; });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); stopEdit(c, true); move(c, e.key === 'Tab' ? 0 : e.shiftKey ? -1 : 1, e.key === 'Tab' ? (e.shiftKey ? -1 : 1) : 0); c.grid.focus(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopEdit(c, false); c.grid.focus(); }
    });
    inp.addEventListener('blur', () => stopEdit(c, true));
  }
  function stopEdit(c, keep) {
    const inp = c.edit;
    if (!inp) return;
    c.edit = null;
    if (keep) setRaw(c, key(c.s.ar, c.s.ac), inp.value);
    inp.remove();
    paint(c);
  }
  function move(c, dr, dc, extend) {
    const hid = hiddenRows(sheet(c)), s = c.s;
    let r = extend ? s.r : s.ar, col = extend ? s.c : s.ac;
    do r = clamp(r + dr, 0, ROWS - 1); while (dr && hid.has(r) && r > 0 && r < ROWS - 1);
    col = clamp(col + dc, 0, COLS - 1);
    if (extend) select(c, s.ar, s.ac, r, col); else select(c, r, col);
    td(c, r, col)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function clear(c) {
    const q = rect(c), sh = sheet(c);
    for (let r = q.r0; r <= q.r1; r++) for (let col = q.c0; col <= q.c1; col++) if (sh.cells[key(r, col)]) sh.cells[key(r, col)].raw = '';
    paint(c);
  }

  // ---- What the ring does ----
  function copy(c) {
    const q = rect(c), sh = sheet(c), raws = [], vals = [];
    for (let r = q.r0; r <= q.r1; r++) {
      raws.push([]); vals.push([]);
      for (let col = q.c0; col <= q.c1; col++) { const d = sh.cells[key(r, col)]; raws.at(-1).push(d ? { ...d } : null); vals.at(-1).push(val(sh, key(r, col))); }
    }
    c.clip = { q, sheet: c.cur, raws, vals };
    try { navigator.clipboard?.writeText(vals.map(row => row.join('\t')).join('\n')).catch(() => { }); } catch (_) { }
    paint(c);
    say(c, 'Copied. Pick where it goes, then Paste or Paste values.');
  }
  function paste(c, values) {
    const clip = c.clip;
    if (!clip) return OS.toast(values ? 'Paste values' : 'Paste', 'Copy some cells first: select them and press Ctrl+C (or Copy).', ICON);
    const q = rect(c), dr = q.r0 - clip.q.r0, dc = q.c0 - clip.q.c0;
    clip.raws.forEach((row, i) => row.forEach((d, j) => {
      const r = q.r0 + i, col = q.c0 + j;
      if (r >= ROWS || col >= COLS) return;
      const v = clip.vals[i][j];
      // Paste values: the numbers and text the cells showed, no formulas; the cells keep their own format.
      if (values) setRaw(c, key(r, col), typeof v === 'number' ? String(+v.toFixed(10)) : v);
      else if (d) { setRaw(c, key(r, col), shift(d.raw, dr, dc), d.fmt); sheet(c).cells[key(r, col)].bold = d.bold; }
      else setRaw(c, key(r, col), '');
    }));
    select(c, q.r0, q.c0, Math.min(ROWS - 1, q.r0 + clip.raws.length - 1), Math.min(COLS - 1, q.c0 + clip.raws[0].length - 1));
    say(c, values ? 'Pasted as values: no formulas came along.' : 'Pasted.');
  }
  function autosum(c) {
    const sh = sheet(c), q = rect(c), has = (r, col) => (sh.cells[key(r, col)]?.raw ?? '') !== '', isNum = (r, col) => typeof val(sh, key(r, col)) === 'number';
    const out = [];
    for (let col = q.c0; col <= q.c1; col++) {
      let from, to, at;
      if (q.r1 > q.r0) { from = q.r0; to = q.r1; at = q.r1 + 1; while (at < ROWS && has(at, col)) at++; }
      else if (has(q.r0, col)) {
        // On a number: the block it sits in, summed under the block.
        from = q.r0; while (from > 0 && isNum(from - 1, col)) from--;
        to = q.r0; while (to < ROWS - 1 && isNum(to + 1, col)) to++;
        at = to + 1;
      } else { to = q.r0 - 1; from = to; while (from > 0 && isNum(from - 1, col)) from--; at = q.r0; }
      if (at >= ROWS || to < from || !isNum(to, col)) continue;
      while (from < to && !isNum(from, col)) from++;
      setRaw(c, key(at, col), `=SUM(${key(from, col)}:${key(to, col)})`, sh.cells[key(to, col)]?.fmt ?? null);
      sh.cells[key(at, col)].bold = true;
      out.push([at, col]);
    }
    if (!out.length) return OS.toast('AutoSum', 'Select the numbers to add up (or the empty cell under them) first.', ICON);
    select(c, out[0][0], out[0][1], out.at(-1)[0], out.at(-1)[1]);
    td(c, out[0][0], out[0][1])?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function format(c, fmt) {
    const q = rect(c), sh = sheet(c);
    for (let r = q.r0; r <= q.r1; r++) for (let col = q.c0; col <= q.c1; col++) { const k = key(r, col); sh.cells[k] = { raw: '', bold: false, ...sh.cells[k], fmt }; }
    paint(c);
  }
  function freeze(c) {
    const sh = sheet(c);
    if (sh.frozen) { sh.frozen = null; paint(c); return say(c, 'Panes unfrozen.'); }
    let { ar: r, ac: col } = c.s;
    if (!r && !col) r = 1;   // on A1, as Excel's "Freeze top row"
    sh.frozen = { r, c: col };
    paint(c);
    say(c, `Frozen: ${r ? `row${r > 1 ? 's' : ''} 1${r > 1 ? '-' + r : ''}` : ''}${r && col ? ' and ' : ''}${col ? `column${col > 1 ? 's' : ''} A${col > 1 ? '-' + L(col - 1) : ''}` : ''}. Scroll to see.`);
  }
  function filter(c) {
    const sh = sheet(c);
    sh.filter = sh.filter ? null : {};
    menu(c, null);
    paint(c);
    say(c, sh.filter ? 'Filter on: use the arrows in row 1.' : 'Filter off: every row is back.');
  }
  function menu(c, col) {
    c.grid.querySelector('.xl-menu')?.remove();
    c.menuCol = col;
    if (col === null) return;
    const sh = sheet(c), last = lastRow(sh), hide = sh.filter[col] ||= new Set();
    const vals = [...new Set(Array.from({ length: last }, (_, i) => show(val(sh, key(i + 1, col)), sh.cells[key(i + 1, col)]?.fmt)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const m = document.createElement('div');
    m.className = 'xl-menu';
    m.innerHTML = `<label><input type="checkbox" data-all ${hide.size ? '' : 'checked'}> (Select all)</label><hr>`
      + vals.map(v => `<label><input type="checkbox" value="${esc(v)}" ${hide.has(v) ? '' : 'checked'}> ${esc(v || '(Blanks)')}</label>`).join('');
    const r = at(c, td(c, 0, col));
    Object.assign(m.style, { left: Math.max(4, r.left) + 'px', top: r.bottom + 2 + 'px' });
    m.addEventListener('change', e => {
      const box = e.target;
      if (box.dataset.all !== undefined) { hide.clear(); if (!box.checked) vals.forEach(v => hide.add(v)); m.querySelectorAll('input').forEach(i => { i.checked = box.checked; }); }
      else { box.checked ? hide.delete(box.value) : hide.add(box.value); m.querySelector('[data-all]').checked = !hide.size; }
      paint(c);
    });
    c.grid.append(m);
    m.querySelector('input').focus({ preventScroll: true });
  }
  function newSheet(c) {
    let n = c.sheets.length + 1;
    while (c.sheets.some(s => s.name === 'Sheet' + n)) n++;
    c.sheets.push({ name: 'Sheet' + n, cells: {}, filter: null, frozen: null });
    tab(c, c.sheets.length - 1);
  }
  function tab(c, i) {
    stopEdit(c, true); menu(c, null);
    c.cur = i;
    c.tabs.innerHTML = c.sheets.map((s, j) => `<button type="button" role="tab" aria-selected="${j === i}" data-tab="${j}">${esc(s.name)}</button>`).join('')
      + `<button class="xl-add" type="button" aria-label="New sheet (Shift+F11)" title="New sheet (Shift+F11)">+</button><span>${esc(c.foot)}</span>`;
    select(c, 0, 0);
    c.grid.scrollTo(0, 0);
  }
  function pdf(c) {
    const name = sheet(c).name === 'Costs' ? 'Office costs 2026.pdf' : `Office costs 2026 - ${sheet(c).name}.pdf`;
    OS.toast('Saved as PDF', `${name}, 1 page, in Downloads. (Pretend: nothing was written to your PC.)`, ICON);
  }
  // After a ring opened by its button has gone home, the sheet takes the keyboard back.
  const R = fn => c => { fn(c); requestAnimationFrame(() => { if (!c.edit && !c.grid.querySelector('.xl-menu')) c.grid.focus({ preventScroll: true }); }); };
  const onDate = c => /date/i.test(String(val(sheet(c), key(0, c.s.ac)))) || sheet(c).cells[key(c.s.ar, c.s.ac)]?.fmt === 'date';

  OS.register({
    id: 'excel',
    tint: '#3fb27f',
    async render(body, c) {
      await css();
      c.foot = 'Ctrl+C, Ctrl+V, Alt+= and Ctrl+Shift+4 work too';
      body.innerHTML = `<div class="of xl">
        <div class="xl-doc"><b>Office costs 2026.xlsx</b><small>Saved to this PC (pretend)</small></div>
        <div class="of-tb" role="toolbar" aria-label="Home">
          <button type="button" data-act="paste" title="Paste (Ctrl+V)">${svg(I.paste)}Paste</button><button type="button" data-act="values" title="Paste values (Ctrl+Alt+V)">${svg(I.values)}Paste values</button><button type="button" data-act="copy" title="Copy (Ctrl+C)">${svg(I.copy)}Copy</button><i></i>
          <button type="button" data-act="cur" title="Currency (Ctrl+Shift+4)" aria-label="Currency">${svg(I.euro)}</button><button type="button" data-act="pct" title="Percent (Ctrl+Shift+5)" aria-label="Percent">${svg(I.percent)}</button><button type="button" data-act="date" title="Date (Ctrl+Shift+3)" aria-label="Date">${svg(I.date)}</button><button type="button" data-act="general" title="General (Ctrl+Shift+~)" aria-label="General">${svg(I.general)}</button><i></i>
          <button type="button" data-act="sum" title="AutoSum (Alt+=)">${svg(I.sum)}AutoSum</button><button type="button" data-act="filter" title="Filter (Ctrl+Shift+L)">${svg(I.filter)}Filter</button><button type="button" data-act="freeze" title="Freeze panes">${svg(I.freeze)}Freeze</button>
        </div>
        <div class="xl-fx"><div class="xl-name" aria-live="polite"></div><em>fx</em><input class="xl-fbar" aria-label="Formula bar" spellcheck="false"></div>
        <div class="xl-grid" tabindex="0" role="grid" aria-label="Sheet"><table class="xl-t"><colgroup><col style="width:${HW}px">${W.map(w => `<col style="width:${w}px">`).join('')}</colgroup>
          <thead><tr><th></th>${W.map((_, i) => `<th>${L(i)}</th>`).join('')}</tr></thead>
          <tbody>${Array.from({ length: ROWS }, (_, r) => `<tr><th>${r + 1}</th>${'<td></td>'.repeat(COLS)}</tr>`).join('')}</tbody></table>
          <div class="xl-box"></div><div class="xl-ants"></div></div>
        <div class="xl-tabs" role="tablist" aria-label="Sheets"></div>
        <div class="of-about"><span class="xl-info" aria-live="polite">Ready</span><a href="for/excel.html" target="_blank" rel="noopener">The Excel ring →</a></div></div>`;
      const root = body.querySelector('.xl');
      Object.assign(c, {
        root, grid: root.querySelector('.xl-grid'), tbody: root.querySelector('tbody'), thead: root.querySelector('thead'), box: root.querySelector('.xl-box'), ants: root.querySelector('.xl-ants'),
        name: root.querySelector('.xl-name'), fbar: root.querySelector('.xl-fbar'), tabs: root.querySelector('.xl-tabs'), info: root.querySelector('.xl-info'),
        sheets: [{ name: 'Costs', cells: seed(), filter: null, frozen: null }], cur: 0, s: { ar: 0, ac: 0, r: 0, c: 0 }, clip: null, edit: null, press: null, sayUntil: 0,
      });
      tab(c, 0);
      select(c, 1, 3, 16, 3);
      const cellOf = el => { const t = el?.closest?.('td'); return t && c.tbody.contains(t) ? [t.parentElement.rowIndex - 1, t.cellIndex - 1] : null; };

      // Click selects, Shift+click extends, a drag selects a range. A press that stays still opens the ring
      // instead (the desktop decides after 130 ms), so a press inside the selection keeps it until then.
      c.grid.addEventListener('pointerdown', e => {
        if (e.target.closest('.xl-fb, .xl-menu, .xl-in')) return;
        menu(c, null);
        const at = cellOf(e.target);
        if (!at || e.button !== 0) return;
        stopEdit(c, true);
        c.press = { x: e.clientX, y: e.clientY, t: performance.now(), at, touch: e.pointerType === 'touch', keep: multi(c) && inside(c, ...at) };
        if (c.press.touch) return;
        e.preventDefault();   // no text selection in the grid; it takes the focus itself
        if (e.shiftKey) { select(c, c.s.ar, c.s.ac, ...at); c.press = null; }
        else if (!c.press.keep) select(c, ...at);
        c.grid.focus({ preventScroll: true });
      });
      c.onMove = e => {
        const p = c.press;
        if (!p || p.touch || p.ring) return;
        if (!p.moved) {
          if (performance.now() - p.t >= 130) { p.ring = true; return; }
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) <= 8) return;
          p.moved = true;
          if (p.keep) select(c, ...p.at);
        }
        const at = cellOf(document.elementFromPoint(e.clientX, e.clientY));
        if (at && (at[0] !== c.s.r || at[1] !== c.s.c)) select(c, c.s.ar, c.s.ac, ...at);
      };
      c.onUp = e => {
        const p = c.press;
        c.press = null;
        if (!p) return;
        const quick = performance.now() - p.t < (p.touch ? 300 : 130), still = Math.hypot(e.clientX - p.x, e.clientY - p.y) <= 8;
        if (quick && still && (p.touch || (p.keep && !p.moved))) select(c, ...p.at);
      };
      addEventListener('pointermove', c.onMove);
      addEventListener('pointerup', c.onUp);
      c.grid.addEventListener('dblclick', e => { if (cellOf(e.target)) edit(c); });
      c.grid.addEventListener('scroll', () => menu(c, null));
      c.grid.addEventListener('click', e => { const b = e.target.closest('.xl-fb'); if (b) { e.stopPropagation(); const col = +b.dataset.col; menu(c, c.menuCol === col ? null : col); } });
      c.grid.addEventListener('keydown', e => {
        if (e.target !== c.grid) { if (e.key === 'Escape' && e.target.closest('.xl-menu')) { e.stopPropagation(); menu(c, null); c.grid.focus(); } return; }
        const k = e.key, ctrl = e.ctrlKey || e.metaKey;
        const go = (fn, ...a) => { e.preventDefault(); fn(c, ...a); };
        if (ctrl && e.shiftKey && e.code === 'Digit4') return go(format, 'cur');
        if (ctrl && e.shiftKey && e.code === 'Digit5') return go(format, 'pct');
        if (ctrl && e.shiftKey && e.code === 'Digit3') return go(format, 'date');
        if (ctrl && e.shiftKey && e.code === 'Backquote') return go(format, null);
        if (ctrl && e.shiftKey && e.code === 'KeyL') return go(filter);
        if (e.altKey && (k === '=' || e.code === 'Equal')) return go(autosum);
        if (e.shiftKey && k === 'F11') return go(newSheet);
        if (ctrl && e.altKey && e.code === 'KeyV') return go(paste, true);
        if (ctrl && e.code === 'KeyC') return go(copy);
        if (ctrl && e.code === 'KeyV') return go(paste, false);
        const arrows = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }[k];
        if (arrows) return go(move, ...arrows, e.shiftKey);
        if (k === 'Enter') return go(move, e.shiftKey ? -1 : 1, 0);
        if (k === 'Tab') return go(move, 0, e.shiftKey ? -1 : 1);
        if (k === 'Delete' || k === 'Backspace') return go(clear);
        if (k === 'F2') return go(edit);
        if (k === 'Escape' && c.clip) { e.stopPropagation(); c.clip = null; return paint(c); }
        if (k.length === 1 && !ctrl && !e.altKey) { e.preventDefault(); edit(c, k); }
      });
      c.fbar.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); setRaw(c, key(c.s.ar, c.s.ac), c.fbar.value); c.grid.focus(); move(c, 1, 0); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); c.grid.focus(); paint(c); }
      });
      root.querySelector('.of-tb').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        stopEdit(c, true);
        ({ paste: () => paste(c, false), values: () => paste(c, true), copy: () => copy(c), cur: () => format(c, 'cur'), pct: () => format(c, 'pct'), date: () => format(c, 'date'),
          general: () => format(c, null), sum: () => autosum(c), filter: () => filter(c), freeze: () => freeze(c) })[b.dataset.act]();
        c.grid.focus({ preventScroll: true });
      });
      c.tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; b.dataset.tab ? tab(c, +b.dataset.tab) : newSheet(c); c.grid.focus({ preventScroll: true }); });
      new ResizeObserver(() => paint(c)).observe(c.grid);
      c.grid.focus({ preventScroll: true });
    },
    onClose(c) { removeEventListener('pointermove', c.onMove); removeEventListener('pointerup', c.onUp); },
    // RadialDeck's Excel ring. The sixth slice follows the selection: Date format on a date column, else Percent.
    ring: c => [
      { label: 'Paste values', icon: 'fluent:E8C8', tint: '#6ee7a0', say: 'Pastes what you copied as plain values, no formulas. In Excel: Ctrl+Alt+V, V, Enter.', run: R(c => paste(c, true)) },
      { label: 'AutoSum', icon: 'Σ', tint: '#ffd166', say: 'Adds a SUM under the selected numbers. In Excel: Alt+=.', run: R(autosum) },
      { label: 'Filter', icon: 'fluent:E721', tint: '#7cc4ff', say: 'Filter arrows on the headers, on or off. In Excel: Ctrl+Shift+L.', run: R(filter) },
      { label: 'Format', icon: '€', tint: '#5eead4', say: 'A nested ring: point at it and Currency, Percent and Date come out as bubbles (Pro).', children: [
        { label: 'Currency', icon: '€', tint: '#5eead4', say: 'Currency format on the selection. In Excel: Ctrl+Shift+4.', run: R(c => format(c, 'cur')) },
        { label: 'Percent', icon: '%', tint: '#fdba74', say: 'Percent format on the selection. In Excel: Ctrl+Shift+5.', run: R(c => format(c, 'pct')) },
        { label: 'Date', icon: '📅', tint: '#ffd166', say: 'Date format on the selection. In Excel: Ctrl+Shift+3.', run: R(c => format(c, 'date')) },
      ] },
      { label: 'Freeze panes', icon: 'fluent:E8FD', tint: '#93c5fd', say: 'Keeps the rows above and the columns left of the cell in place. Again to unfreeze.', run: R(freeze) },
      { label: 'New sheet', icon: 'fluent:E8FD', tint: '#c4a1ff', say: 'Adds a sheet and opens it. In Excel: Shift+F11.', run: R(newSheet) },
      { label: 'To PDF', icon: '📄', tint: '#ff7aa8', say: 'Saves this sheet as a PDF.', run: R(pdf) },
    ],
  });

  // For build checks and the console: OSExcel.calc({ cells: { A1: { raw: '2' } } }, '=A1*3') === 6
  window.OSExcel = { calc: (sh, raw) => calc(sh, raw, new Set()), shift, show };
})();
