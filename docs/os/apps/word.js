/* Word: a one-page letter you can edit. Its ring is RadialDeck's Word ring from the gallery (wd-*): track
   changes that really track (typing shows as an insertion, deleting as a strike-through), word count, a
   signature at the end, a 3x3 table, read mode, accept all and clear formatting. */
(() => {
  const ICON = 'assets/apps/word.png';
  const css = () => document.querySelector('link[href="os/apps/office.css"]') ? null
    : new Promise(ok => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'os/apps/office.css', onload: ok, onerror: ok })));
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    track: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    count: '<path d="M4 6h16M4 11h16M4 16h9M17 14l2 6M21 14l-2 6"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    read: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    accept: '<path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16"/>',
    clear: '<path d="m7 21-4.3-4.3a2.4 2.4 0 0 1 0-3.4l9.6-9.6a2.4 2.4 0 0 1 3.4 0l5.6 5.6a2.4 2.4 0 0 1 0 3.4L13 21M22 21H7M5 11l9 9"/>',
  };
  const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  // A made-up studio writing to a made-up client.
  const LETTER = () => `<p><b>Harbour Lane Studio</b><br>14 Harbour Lane<br>Northport NP4 2QL</p>
    <p>${today()}</p>
    <p>Jordan Ellis<br>Ellis &amp; Reed Interiors<br>3 Mill Street<br>Northport NP1 6AB</p>
    <p>Dear Jordan,</p>
    <p><b><u>Re: Office refit, phase two</u></b></p>
    <p>Thank you for walking us through the second floor last week. We have now priced the work we discussed, and the summary is attached. The total comes to <mark><b>€48,600</b></mark>, which is <i>within the budget</i> you gave us in September.</p>
    <p>We can start on <span style="color:#c0392b;font-weight:600">Monday 9 November</span> and expect to hand over the space four weeks later. The meeting rooms would be finished first, so your team can keep working while we fit out the open area.</p>
    <p>If you would like to change anything in the plan, mark it up in this letter and send it back. We are happy to go through the numbers on a call.</p>`;
  const BLOCKS = 'p,div,table,tr,td,h1,h2,h3,li,ul,ol';

  // ---- Where the ring acts. A hold on the page that opened the ring acts on the selection from before the press,
  // or on the spot pressed; the drag the flick makes in the text does not count. Else the selection as it is. ----
  const sel = () => getSelection();
  const heldOn = h => h.pre && !h.pre.collapsed ? h.pre : h.at;
  function range(c) {
    if (c.hold?.ring) return heldOn(c.hold);
    const s = sel(), r = s.rangeCount ? s.getRangeAt(0) : null;
    return r && c.page.contains(r.commonAncestorContainer) ? r : c.last || null;
  }
  function put(r) { const s = sel(); s.removeAllRanges(); s.addRange(r); }
  function words(text) { return text.split(/\s+/).filter(Boolean).length; }
  function plain(node) { const x = node.cloneNode(true); x.querySelectorAll?.('del.tc').forEach(d => d.remove()); return x.textContent; }

  // ---- Track changes: typing becomes <ins class="tc">, deleting wraps the text in <del class="tc"> ----
  function trackedInsert(c, text) {
    const s = sel();
    let r = s.getRangeAt(0);
    if (!r.collapsed) r = trackedRemove(c, r, false);
    // Never type inside a deletion.
    const inDel = r.startContainer.parentElement?.closest('del.tc');
    if (inDel) { r.setStartAfter(inDel); r.collapse(true); }
    const tn = document.createTextNode(text);
    const ins = r.startContainer.nodeType === 3 ? r.startContainer.parentElement.closest('ins.tc') : r.startContainer.closest?.('ins.tc');
    if (ins && c.page.contains(ins)) r.insertNode(tn);
    else { const el = document.createElement('ins'); el.className = 'tc'; el.append(tn); r.insertNode(el); }
    r.setStart(tn, tn.length); r.collapse(true); put(r);
    changed(c);
  }
  function trackedRemove(c, r, backward) {
    // Inside your own insertion a delete is just a delete.
    const box = r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentElement : r.commonAncestorContainer;
    // Already struck through: the caret just steps over it.
    if (box.closest('del.tc')) { r.collapse(backward); put(r); return r; }
    const own = box.closest('ins.tc');
    if (own && c.page.contains(own)) {
      r.deleteContents();
      if (!own.textContent) { const at = document.createRange(); at.setStartBefore(own); own.remove(); r = at; }
      r.collapse(true); put(r); changed(c);
      return r;
    }
    const frag = r.extractContents();
    // Your own insertions just go; everything else is struck through and stays until it is accepted.
    frag.querySelectorAll('ins.tc').forEach(n => n.remove());
    frag.querySelectorAll('del.tc').forEach(n => n.replaceWith(...n.childNodes));
    const out = document.createRange();
    if (frag.textContent) {
      let del = document.createElement('del'); del.className = 'tc'; del.append(frag);
      r.insertNode(del);
      // Deleting letter by letter makes one strike-through, not a row of them.
      const sib = (n, way) => { let x = n[way]; while (x && x.nodeType === 3 && !x.data) x = x[way]; return x; };
      const prev = sib(del, 'previousSibling'), next = sib(del, 'nextSibling');
      if (prev?.matches?.('del.tc')) { prev.append(...del.childNodes); del.remove(); del = prev; }
      if (next?.matches?.('del.tc')) { del.append(...next.childNodes); next.remove(); }
      backward ? out.setStartBefore(del) : out.setStartAfter(del);
    } else out.setStart(r.startContainer, r.startOffset);
    out.collapse(true); put(out);
    changed(c);
    return out;
  }
  function beforeInput(c, e) {
    if (!c.track) return;
    const t = e.inputType, s = sel();
    if (t === 'insertText' || t === 'insertReplacementText' || t === 'insertFromPaste') {
      const text = e.data ?? e.dataTransfer?.getData('text/plain') ?? '';
      if (!text || /\n/.test(text)) return;
      e.preventDefault(); trackedInsert(c, text);
    } else if (t.startsWith('delete')) {
      const before = s.getRangeAt(0).cloneRange(), back = /Backward/.test(t);
      if (s.isCollapsed) s.modify('extend', back ? 'backward' : 'forward', /Word/.test(t) ? 'word' : 'character');
      const r = s.getRangeAt(0);
      // Joining two paragraphs is not tracked; Word marks it with a pilcrow we do not draw.
      if (r.collapsed || r.cloneContents().querySelector(BLOCKS)) { put(before); return; }
      e.preventDefault(); trackedRemove(c, r, back);
    }
  }

  function changed(c) {
    const n = c.page.querySelectorAll('ins.tc, del.tc').length;
    c.wordsEl.textContent = `${words(plain(c.page))} words`;
    c.trk.textContent = `Track changes: ${c.track ? 'On' : 'Off'}${n ? ` (${n})` : ''}`;
    c.trk.classList.toggle('is-on', c.track);
    c.root.querySelector('[data-act="track"]').setAttribute('aria-pressed', String(c.track));
  }

  // ---- What the ring does ----
  function track(c) {
    c.track = !c.track;
    changed(c);
    pill(c, c.track ? 'Track changes is on: what you type and delete now shows as a change.' : 'Track changes is off.');
  }
  function count(c) {
    const r = range(c), part = r && !r.collapsed;
    const text = part ? plain(r.cloneContents()) : plain(c.page);
    const paras = part ? text.split(/\n+/).filter(x => x.trim()).length : [...c.page.querySelectorAll('p')].filter(p => p.textContent.trim()).length;
    const lh = parseFloat(getComputedStyle(c.page).lineHeight) || 23;
    const lines = part ? Math.max(1, Math.round(r.getBoundingClientRect().height / lh)) : [...c.page.children].reduce((a, el) => a + Math.max(1, Math.round(el.offsetHeight / lh)), 0);
    dialog(c, part ? 'Word count (selection)' : 'Word count', [['Pages', 1], ['Words', words(text)], ['Characters (no spaces)', text.replace(/\s/g, '').length],
      ['Characters (with spaces)', text.replace(/\n/g, '').length], ['Paragraphs', paras], ['Lines', lines]]);
  }
  function dialog(c, title, rows) {
    c.root.querySelector('.of-dlg')?.remove();
    const d = document.createElement('div');
    d.className = 'of-dlg';
    d.innerHTML = `<div role="dialog" aria-modal="true" aria-label="${title}"><h3>${title}</h3><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v.toLocaleString()}</td></tr>`).join('')}</table><button class="os-btn" type="button">Close</button></div>`;
    const close = () => { d.remove(); c.page.focus({ preventScroll: true }); };
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('button')) close(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    c.root.append(d);
    requestAnimationFrame(() => d.querySelector('button').focus());
  }
  function signature(c) {
    if (c.read) read(c);
    let sig = c.page.querySelector('.wd-sig');
    if (!sig) {
      const html = '<p>Kind regards,</p><p class="wd-sig">Alex Morgan</p><p>Alex Morgan<br>Project lead, Harbour Lane Studio<br>alex.morgan@example.com</p>';
      const box = document.createElement('div'); box.innerHTML = html;
      if (c.track) box.querySelectorAll('p').forEach(p => { const ins = document.createElement('ins'); ins.className = 'tc'; ins.append(...p.childNodes); p.append(ins); });
      c.page.append(...box.children);
      sig = c.page.querySelector('.wd-sig');
    }
    // As the recipe says: the text is yours to edit after adding. The name is selected.
    c.page.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(sig); put(r);
    sig.scrollIntoView({ block: 'center', behavior: 'smooth' });
    changed(c);
  }
  function table(c) {
    if (c.read) read(c);
    const r = range(c);
    const t = document.createElement('table');
    t.innerHTML = '<tbody>' + '<tr><td><br></td><td><br></td><td><br></td></tr>'.repeat(3) + '</tbody>';
    const block = r && r.startContainer !== c.page ? (r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer).closest('p, table') : null;
    if (block && c.page.contains(block)) block.after(t); else c.page.append(t);
    if (!t.nextElementSibling) t.after(Object.assign(document.createElement('p'), { innerHTML: '<br>' }));
    c.page.focus({ preventScroll: true });
    const cr = document.createRange(); cr.setStart(t.querySelector('td'), 0); cr.collapse(true); put(cr);
    t.scrollIntoView({ block: 'center', behavior: 'smooth' });
    pill(c, 'A 3x3 table, cursor in the first cell. Type away.');
    changed(c);
  }
  function read(c) {
    c.read = !c.read;
    c.root.classList.toggle('is-read', c.read);
    c.page.contentEditable = String(!c.read);
    c.root.querySelector('.wd-readbtn').setAttribute('aria-pressed', String(c.read));
    if (!c.read) c.page.focus({ preventScroll: true });
  }
  function accept(c) {
    const ins = c.page.querySelectorAll('ins.tc'), del = c.page.querySelectorAll('del.tc'), n = ins.length + del.length;
    if (!n) return pill(c, c.track ? 'No changes to accept yet: type something first.' : 'No tracked changes. Turn on Track changes, then edit.');
    ins.forEach(x => x.replaceWith(...x.childNodes));
    del.forEach(x => x.remove());
    c.page.normalize();
    changed(c);
    pill(c, `Accepted ${n} ${n === 1 ? 'change' : 'changes'}.`);
  }
  function clearFormat(c) {
    if (c.read) read(c);
    let r = range(c);
    if (!r) return pill(c, 'Select some text first.');
    if (r.collapsed) {
      // Nothing selected: the paragraph the cursor is in, as Ctrl+Space in Word.
      const p = (r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer).closest('p, td');
      if (!p || !c.page.contains(p)) return pill(c, 'Select some text first.');
      r = document.createRange(); r.selectNodeContents(p);
    }
    let n = 0;
    c.page.querySelectorAll('b, strong, i, em, u, mark, span, font').forEach(el => { if (r.intersectsNode(el)) { el.replaceWith(...el.childNodes); n++; } });
    c.page.normalize();
    c.page.focus({ preventScroll: true });
    pill(c, n ? 'Formatting cleared: bold, italic, colour and highlight are gone.' : 'Nothing to clear here.');
  }
  // A ring opened by its button gives the window the focus back when it goes; the page takes it, and the
  // selection, back right after.
  const R = fn => c => {
    if (c.hold?.ring && heldOn(c.hold)) put(heldOn(c.hold));
    fn(c);
    c.hold = null;
    const s = sel(), r = s.rangeCount && c.page.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
    requestAnimationFrame(() => { if (c.read || c.root.querySelector('.of-dlg')) return; c.page.focus({ preventScroll: true }); if (r) put(r); });
  };
  function pdf() { OS.toast('Saved as PDF', 'Letter to Jordan Ellis.pdf, 1 page, in Downloads. (Pretend: nothing was written to your PC.)', ICON); }
  function pill(c, text) {
    const p = c.root.querySelector('.of-pill');
    p.textContent = text; p.classList.add('is-on');
    clearTimeout(c.pillT); c.pillT = setTimeout(() => p.classList.remove('is-on'), 2600);
  }

  OS.register({
    id: 'word',
    tint: '#6aa3f8',
    async render(body, c) {
      await css();
      body.innerHTML = `<div class="of wd">
        <div class="wd-doc"><b>Letter to Jordan Ellis.docx</b><small>Saved to this PC (pretend)</small></div>
        <div class="of-tb wd-tb" role="toolbar" aria-label="Home">
          <button type="button" data-cmd="bold" title="Bold (Ctrl+B)" aria-label="Bold"><b>B</b></button><button type="button" data-cmd="italic" title="Italic (Ctrl+I)" aria-label="Italic"><em>I</em></button><button type="button" data-cmd="underline" title="Underline (Ctrl+U)" aria-label="Underline"><u>U</u></button>
          <button type="button" data-act="clear" title="Clear formatting">${svg(I.clear)}Clear</button><i></i>
          <button type="button" data-act="track" aria-pressed="false" title="Track changes (Ctrl+Shift+E)">${svg(I.track)}Track changes</button><button type="button" data-act="accept" title="Accept all changes">${svg(I.accept)}Accept all</button><i></i>
          <button type="button" data-act="table" title="Insert a 3x3 table">${svg(I.table)}Table</button><button type="button" data-act="count" title="Word count (Ctrl+Shift+G)">${svg(I.count)}Word count</button>
        </div>
        <div class="wd-readbar"><b>Read mode</b><button type="button" data-act="read">Edit document</button></div>
        <div class="wd-canvas"><article class="wd-page" contenteditable="true" spellcheck="false" aria-label="Letter">${LETTER()}</article></div>
        <div class="wd-status"><span>Page 1 of 1</span><span class="wd-words"></span><button type="button" class="wd-trk" data-act="track"></button><span>English (United Kingdom)</span><span class="wd-gap"></span><button type="button" class="wd-readbtn" data-act="read" aria-pressed="false">Read mode</button><span>100%</span></div>
        <div class="of-about"><span>The ring here is RadialDeck's Word ring. In Word each slice presses Word's own keys.</span><a href="for/word.html" target="_blank" rel="noopener">The Word ring →</a></div>
        <div class="of-pill" role="status" aria-live="polite"></div></div>`;
      const root = body.querySelector('.wd');
      Object.assign(c, { root, page: root.querySelector('.wd-page'), wordsEl: root.querySelector('.wd-words'), trk: root.querySelector('.wd-trk'), track: false, read: false, hold: null, last: null });
      changed(c);
      c.page.addEventListener('beforeinput', e => beforeInput(c, e));
      c.page.addEventListener('input', () => changed(c));
      // Holding on selected text would start dragging it; here a hold is the ring.
      c.page.addEventListener('dragstart', e => e.preventDefault());
      // A press may become the ring (the desktop opens it after 350 ms still in text, 130 ms elsewhere). Remember
      // the selection it replaced and the spot pressed; while the ring is up, the flick must not drag a selection.
      c.page.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        const at = document.caretRangeFromPoint?.(e.clientX, e.clientY);
        c.hold = { pre: c.last, at: at && c.page.contains(at.startContainer) ? at : c.last, t: performance.now(), x: e.clientX, y: e.clientY, wait: c.read || e.button === 2 ? 130 : 350 };
      });
      c.onMove = e => {
        const h = c.hold;
        if (!h) return;
        if (!h.ring) {
          const late = performance.now() - h.t >= h.wait;
          if (!late && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) { c.hold = null; return; }
          h.ring = late;
        }
        // After the browser has moved the selection with the pointer, and before it paints.
        if (h.ring && heldOn(h)) requestAnimationFrame(() => { if (c.hold === h) put(heldOn(h)); });
      };
      // The desktop runs the slice on the same pointerup, before this.
      c.onUp = () => { c.hold = null; };
      addEventListener('pointermove', c.onMove);
      addEventListener('pointerup', c.onUp);
      c.onSel = () => { const s = sel(); if (s.rangeCount && c.page.contains(s.anchorNode)) c.last = s.getRangeAt(0).cloneRange(); };
      document.addEventListener('selectionchange', c.onSel);
      root.querySelector('.of-tb').addEventListener('mousedown', e => { if (e.target.closest('[data-cmd]')) e.preventDefault(); });
      root.addEventListener('click', e => {
        const b = e.target.closest('button[data-act], button[data-cmd]');
        if (!b) return;
        if (b.dataset.cmd) { document.execCommand(b.dataset.cmd); return changed(c); }
        ({ track, accept, table, count, read, clear: clearFormat })[b.dataset.act](c);
      });
      root.addEventListener('keydown', e => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.shiftKey && e.code === 'KeyE') { e.preventDefault(); track(c); }
        if (ctrl && e.shiftKey && e.code === 'KeyG') { e.preventDefault(); count(c); }
        if (e.key === 'Escape' && c.read) { e.stopPropagation(); read(c); }
      });
    },
    onClose(c) { document.removeEventListener('selectionchange', c.onSel); removeEventListener('pointermove', c.onMove); removeEventListener('pointerup', c.onUp); },
    // RadialDeck's Word ring, labels and wording from the gallery.
    ring: [
      { label: 'Track changes', icon: 'fluent:E768', tint: '#f0a3d8', say: 'Turns Track changes on or off. In Word: Ctrl+Shift+E.', run: R(track) },
      { label: 'Word count', icon: 'fluent:E8A5', tint: '#7cc4ff', say: 'Words, characters, paragraphs and lines. In Word: Ctrl+Shift+G.', run: R(count) },
      { label: 'Signature', icon: '✍', tint: '#fdba74', say: 'Jumps to the end and adds your signature. Edit the text after adding.', run: R(signature) },
      { label: 'To PDF', icon: '📄', tint: '#ff7aa8', say: 'Saves the document as a PDF.', run: R(pdf) },
      { label: 'Table 3x3', icon: '▦', tint: '#5eead4', say: 'Inserts a 3x3 table where the cursor is.', run: R(table) },
      { label: 'Read mode', icon: '📖', tint: '#ffd166', say: 'The page as a book, no ribbon. Again to edit. In Word: Alt W F.', run: R(read) },
      { label: 'Accept all', icon: '✔', tint: '#6ee7a0', say: 'Accepts every tracked change. Review › Accept all.', run: R(accept) },
      { label: 'Clear format', icon: '🧹', tint: '#c4a1ff', say: 'Removes bold, colour and highlight from the selection. In Word: Ctrl+Space.', run: R(clearFormat) },
    ],
  });
})();
