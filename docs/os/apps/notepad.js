/* Notepad: a text window whose ring holds RadialDeck's text tricks. They work as the app's transforms do
   (src/RadialDeck/Actions/TextTransforms.cs), on the selected text, or on the whole note when nothing is selected.
   Ctrl+Z undoes each one. */
(() => {
  const SAMPLE = `Notes from Monday's call

  please send the   offer to the whole team   before friday,
and share the link: https://shop.example.com/offer?id=42&utm_source=newsletter&utm_medium=email&fbclid=IwAR2x9

action items
review the budget
call the supplier
book the meeting room
ask Maria about the slides`;

  // The tracking parameters the app removes (TrackingParam in TextTransforms.cs).
  const TRACKING = /^(utm_[^=]*|fbclid|gclid|dclid|igshid|mc_cid|mc_eid|ref|ref_src|si|feature|yclid|_hsenc|_hsmi|vero_id|wickedid|msclkid)=/i;
  const cleanUrl = url => {
    let u;
    try { u = new URL(url); } catch (_) { return url; }
    if (!u.search) return url;
    const kept = u.search.slice(1).split('&').filter(p => p && !TRACKING.test(p));
    u.search = kept.join('&');
    return u.toString();
  };
  const lines = t => t.replace(/\r\n/g, '\n').split('\n');
  const T = {
    upper: t => t.toUpperCase(),
    lower: t => t.toLowerCase(),
    title: t => t.toLowerCase().replace(/(^|[^\p{L}\p{N}'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()),
    trim: t => t.replace(/\s+/g, ' ').trim(),
    url: t => t.replace(/https?:\/\/[^\s<>"]+/g, m => { const end = m.match(/[.,)>]+$/)?.[0] || ''; return cleanUrl(m.slice(0, m.length - end.length)) + end; }),
    sort: t => lines(t).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('\n'),
    count: t => {
      const words = t.split(/[ \t\r\n]+/).filter(Boolean).length, n = t.length, l = t.length ? lines(t).length : 0;
      return `${words} ${words === 1 ? 'word' : 'words'}, ${n} ${n === 1 ? 'character' : 'characters'}, ${l} ${l === 1 ? 'line' : 'lines'}`;
    },
  };

  // What the ring acts on: the selection, the selection from before a press that just moved the caret, or everything.
  function range(c) {
    const ta = c.ta, s = ta.selectionStart, e = ta.selectionEnd;
    if (e > s) return [s, e];
    if (c.pre && c.pre[1] > c.pre[0]) return c.pre;
    return [0, ta.value.length];
  }
  function put(c, [s, e], text) {
    const ta = c.ta;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(s, e);
    // insertText keeps Ctrl+Z working; setRangeText is the fallback where it is not supported.
    if (!document.execCommand('insertText', false, text)) ta.setRangeText(text, s, e, 'end');
    ta.setSelectionRange(s, s + text.length);
    c.pre = null;
    status(c);
  }
  const apply = (fn, name) => c => {
    if (!c?.ta) return;
    const r = range(c), before = c.ta.value.slice(r[0], r[1]), after = fn(before);
    if (after === before) return OS.toast(name, 'Nothing to change here.', 'os/icons/notepad.svg');
    put(c, r, after);
  };

  function status(c) {
    const ta = c.ta, upto = ta.value.slice(0, ta.selectionStart), ln = upto.split('\n').length, col = upto.length - upto.lastIndexOf('\n');
    const sel = ta.selectionEnd - ta.selectionStart;
    c.pos.textContent = `Ln ${ln}, Col ${col}`;
    c.count.textContent = sel ? `${sel} of ${ta.value.length} characters` : `${ta.value.length} characters`;
  }

  OS.register({
    id: 'notepad',
    tint: '#7cc4ff',
    render(body, c) {
      body.innerHTML = `<div class="np">
        <div class="np-bar"><span class="np-tab">Monday notes.txt</span><span class="np-hint">Select some text, then hold the mouse on it, flick, let go. Or right-click and hold.</span><button class="os-btn np-reset" type="button">Start over</button></div>
        <textarea class="np-text" spellcheck="false" aria-label="Note text"></textarea>
        <div class="np-status"><span class="np-pos"></span><span class="np-count"></span><span>100%</span><span>Windows (CRLF)</span><span>UTF-8</span></div>
      </div>`;
      c.ta = body.querySelector('.np-text');
      c.pos = body.querySelector('.np-pos');
      c.count = body.querySelector('.np-count');
      c.ta.value = SAMPLE;
      // A press moves the caret before anyone knows it is a hold; remember the selection it replaced.
      c.ta.addEventListener('pointerdown', () => { c.pre = [c.ta.selectionStart, c.ta.selectionEnd]; });
      ['input', 'keyup', 'pointerup', 'select', 'focus'].forEach(ev => c.ta.addEventListener(ev, () => status(c)));
      body.querySelector('.np-reset').addEventListener('click', () => { c.ta.value = SAMPLE; c.pre = null; status(c); c.ta.focus(); });
      status(c);
    },
    // The text tricks from the gallery's Clipboard category, labels and descriptions as there.
    ring: [
      { label: 'Paste plain', icon: '📄', tint: '#a5b4fc', say: 'Pastes what you copied without fonts, colours or links.', run: async c => {
        let text = null;
        try { text = await navigator.clipboard.readText(); } catch (_) { }
        if (text === null) return OS.toast('Paste plain', 'This browser keeps the clipboard to itself. Press Ctrl+V: Notepad takes it plain.', 'os/icons/notepad.svg');
        put(c, range(c), text);
      } },
      { label: 'UPPER', icon: 'fluent:E8C8', tint: '#ffd166', say: 'The selected text in capitals.', run: apply(T.upper, 'UPPER') },
      { label: 'Title Case', icon: 'fluent:E8A5', tint: '#fdba74', say: 'First Letter Of Every Word.', run: apply(T.title, 'Title Case') },
      { label: 'Trim spaces', icon: 'fluent:E8A5', tint: '#5eead4', say: 'Collapses whitespace into single spaces. Great for text copied from PDFs.', run: apply(T.trim, 'Trim spaces') },
      { label: 'Count', icon: '🔢', tint: '#c4a1ff', say: 'Shows the count in a balloon.', run: c => OS.toast('Count', T.count(c.ta.value.slice(...range(c))), 'os/icons/notepad.svg') },
      { label: 'Sort lines', icon: 'fluent:E8CB', tint: '#6ee7a0', say: 'Sorts the lines alphabetically.', run: apply(T.sort, 'Sort lines') },
      { label: 'Clean link', icon: '🔗', tint: '#7cc4ff', say: 'Removes utm_, fbclid, gclid… and keeps the clean URL.', run: apply(T.url, 'Clean link') },
      { label: 'lower', icon: 'fluent:E8C8', tint: '#ff7aa8', say: 'The selected text in small letters.', run: apply(T.lower, 'lower') },
    ],
  });

  // For build checks and the console: OSNotepad.T.url('https://x.com/?a=1&utm_source=y') === 'https://x.com/?a=1'
  window.OSNotepad = { T, cleanUrl };
})();
