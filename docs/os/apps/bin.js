/* Recycle Bin: what was deleted in File Explorer (OSFiles.bin), and the ring's Empty bin (gallery win-bin) emptying
   it without asking, as the app does. The desktop's bin icon and the Everyday ring's Empty bin come here too. */
(() => {
  const F = () => window.OSFiles;
  let B = null;
  const binIcon = () => document.getElementById('bin');
  function draw() {
    if (!B) return;
    const items = F().bin;
    B.list.innerHTML = items.length
      ? items.map((it, i) => `<div class="rb-row${B.sel.has(it) ? ' is-sel' : ''}" data-i="${i}" role="option" aria-selected="${B.sel.has(it)}"><span class="rb-ic">${F().thumb(it.file)}</span><span class="rb-n">${esc(it.file.name)}</span><span>${esc(F().pathOf(it.from))}</span><span>${F().when(it.at || it.file.t + 3600e3)}</span><span class="rb-s">${F().fmt(it.file.size)}</span></div>`).join('')
      : `<div class="rb-empty">${OS.svg(OS.icons.trash)}<b>The Recycle Bin is empty</b><span>Delete a file in File Explorer and it comes here.</span></div>`;
    const size = items.reduce((a, it) => a + (it.file.size || 0), 0);
    B.stat.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}${items.length ? ' · ' + F().fmt(size) : ''}${B.sel.size ? ` · ${B.sel.size} selected` : ''}`;
    B.head.hidden = !items.length;
    binIcon()?.classList.toggle('is-empty', !items.length);
  }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const chosen = () => B && B.sel.size ? [...B.sel] : [];

  // Empty bin: the files crumple into the bin, the desktop's bin shakes. No question first, as in the app.
  function empty() {
    const items = F().bin;
    const ic = binIcon();
    if (!items.length) return OS.toast('Recycle Bin', 'It is already empty.', 'os/icons/bin.svg');
    const n = items.length, size = items.reduce((a, it) => a + (it.file.size || 0), 0);
    const finish = () => {
      items.length = 0; B?.sel.clear(); draw(); F().changed();
      ic?.classList.add('is-empty', 'is-shake'); setTimeout(() => ic?.classList.remove('is-shake'), 520);
      OS.toast('Recycle Bin emptied', `${n} ${n === 1 ? 'item' : 'items'}, ${F().fmt(size)} freed.`, 'os/icons/bin.svg');
    };
    const rows = B ? [...B.list.querySelectorAll('.rb-row')] : [];
    if (!rows.length) return finish();
    rows.forEach((r, i) => r.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-30px, 24px) scale(.4) rotate(-14deg)', opacity: 0 }],
      { duration: 360, delay: i * 45, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    setTimeout(finish, 360 + rows.length * 45);
  }
  function restore(items, open) {
    if (!items.length) return OS.toast('Restore', 'Select a file first, or pick Restore all.', 'os/icons/bin.svg');
    items.forEach(it => {
      const at = F().bin.indexOf(it);
      if (at >= 0) F().bin.splice(at, 1);
      F().list(it.from).push(it.file);
      B?.sel.delete(it);
    });
    draw(); F().changed();
    if (open) return OS.open('explorer', { cwd: items[0].from });
    OS.toast('Restored', `${items.length === 1 ? items[0].file.name : items.length + ' items'} → ${items[0].from}`, 'os/icons/bin.svg');
  }
  function remove(items) {
    if (!items.length) return OS.toast('Delete', 'Select a file first.', 'os/icons/bin.svg');
    items.forEach(it => { const at = F().bin.indexOf(it); if (at >= 0) F().bin.splice(at, 1); B?.sel.delete(it); });
    draw(); F().changed();
  }

  OS.register({
    id: 'bin',
    tint: '#cbd5e1',
    empty,
    render(body, c) {
      B = c;
      c.sel = new Set();
      body.innerHTML = `<div class="rb">
        <div class="rb-cmd" role="toolbar" aria-label="Commands">
          <button type="button" data-cmd="empty">${OS.svg(OS.icons.trash)}<span>Empty Recycle Bin</span></button>
          <button type="button" data-cmd="restoreAll">${OS.svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')}<span>Restore all items</span></button>
          <button type="button" data-cmd="restore">${OS.svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')}<span>Restore the selected items</span></button>
        </div>
        <div class="rb-head" aria-hidden="true"><span></span><span>Name</span><span>Original location</span><span>Date deleted</span><span>Size</span></div>
        <div class="rb-list" role="listbox" aria-multiselectable="true" aria-label="Deleted items" tabindex="0"></div>
        <div class="rb-stat" aria-live="polite"></div>
      </div>`;
      const $ = s => body.querySelector(s);
      Object.assign(c, { list: $('.rb-list'), stat: $('.rb-stat'), head: $('.rb-head') });
      $('.rb-cmd').addEventListener('click', e => {
        const b = e.target.closest('[data-cmd]');
        if (!b) return;
        ({ empty, restoreAll: () => restore([...F().bin]), restore: () => restore(chosen()) })[b.dataset.cmd]();
      });
      c.list.addEventListener('pointerdown', e => {
        const r = e.target.closest('.rb-row'), it = r && F().bin[+r.dataset.i];
        if (!it) { if (!e.ctrlKey) { c.sel.clear(); draw(); } return; }
        if (e.ctrlKey || e.metaKey) c.sel.has(it) ? c.sel.delete(it) : c.sel.add(it);
        else if (!c.sel.has(it)) { c.sel.clear(); c.sel.add(it); }
        draw();
      });
      c.list.addEventListener('dblclick', e => { const r = e.target.closest('.rb-row'); if (r) OS.toast(F().bin[+r.dataset.i].file.name, 'Deleted files open after a Restore.', 'os/icons/bin.svg'); });
      c.el.addEventListener('keydown', e => { if (e.key === 'Delete') remove(chosen()); if ((e.key === 'a' || e.key === 'A') && e.ctrlKey) { e.preventDefault(); F().bin.forEach(it => c.sel.add(it)); draw(); } });
      draw();
    },
    onClose() { B = null; },
    ring: [
      { label: 'Empty bin', icon: '🗑', tint: '#ff6b6b', say: 'Empties the Recycle Bin without opening it.', run: empty },
      { label: 'Restore', icon: 'fluent:E777', tint: '#6ee7a0', say: 'Puts the selected files back where they were.', run: () => restore(chosen()) },
      { label: 'Open location', icon: 'fluent:E8B7', tint: '#ffd166', say: 'Restores the selected file and opens the folder it came from.', run: () => restore(chosen().slice(0, 1), true) },
      { label: 'Restore all', icon: '🔄', tint: '#5eead4', say: 'Everything back where it came from.', run: () => restore([...F().bin]) },
      { label: 'Delete', icon: 'fluent:E74D', tint: '#ff7aa8', say: 'Deletes the selected files for good.', run: () => remove(chosen()) },
      { label: 'Select all', icon: '🔲', tint: '#7cc4ff', say: 'Selects everything in the bin.', run: () => { F().bin.forEach(it => B?.sel.add(it)); draw(); } },
    ],
  });
  // The desktop's bin starts full; the Everyday ring and the desktop icon find this app through the shell.
  addEventListener('os:files', () => { draw(); if (!B) binIcon()?.classList.toggle('is-empty', !F().bin.length); });
})();
