/* Code: a small code editor (file tree, tabs, an editor with colours, a terminal) whose ring holds the gallery's
   VS Code recipes: command palette, quick open, format document, toggle comment, find in files, sidebar, zen mode
   and the terminal. Each one does what it does there, on these files. */
(() => {
  const FILES = {
    'src/ring.js': `// The ring: eight slices, one flick.
import { Spring } from './spring.js';

const LABELS = ['Copy', 'Paste', 'Undo', 'Redo', 'Save', 'Find', 'Close', 'Snip'];

export function slices(n = 8) {
const step = 360 / n;
    return Array.from({ length: n }, (_, i) => {
  const angle = i * step;
        return { angle, label: LABELS[i] ?? \`Slice \${i + 1}\` };
  });
}

// Which slice a flick points at; -1 while the pointer is still in the hub.
export function pick(dx, dy, n = 8) {
if (Math.hypot(dx, dy) < 24) return -1;
      const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
  return Math.round(deg / (360 / n)) % n;
}

export function open(el, at) {
    const spring = new Spring(0.34, 0.78);
  el.style.transform = \`translate(\${at.x}px, \${at.y}px)\`;
      spring.target = 1;
  return spring;
}
`,
    'src/spring.js': `// A spring, the SwiftUI way: response is the period in seconds, damping a fraction of critical.
export class Spring {
  constructor(response, damping, value = 0) {
    const w = 2 * Math.PI / response;
    this.k = w * w;
    this.c = 2 * damping * w;
    this.value = this.target = value;
    this.vel = 0;
  }

  step(dt) {
    this.vel += (-this.k * (this.value - this.target) - this.c * this.vel) * dt;
    this.value += this.vel * dt;
  }
}
`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Ring demo</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<!-- Hold the mouse, flick, let go. -->
<div class="ring" id="ring"></div>
<script type="module" src="src/ring.js"></script>
</body>
</html>
`,
    'styles.css': `/* The ring sits under the pointer. */
.ring {
  position: fixed;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: rgba(20, 22, 32, 0.6);
  backdrop-filter: blur(14px);
}
`,
    'package.json': `{
  "name": "ring-demo",
  "version": "0.3.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "test": "node --test"
  }
}
`,
    'README.md': `# Ring demo

A pie menu in 60 lines. Hold, flick, let go.

- \`npm run dev\` starts it
- \`npm test\` runs the tests
`,
  };
  const LANG = { js: 'JavaScript', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown' };
  const ext = f => f.split('.').pop();
  const esc = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);
  const style = href => document.querySelector(`link[href="${href}"]`) ? Promise.resolve() : new Promise(ok => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = ok; document.head.append(l); });
  const ICON = 'os/icons/code.svg';
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const P = {
    files: '<path d="M15 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5M4 7v13a2 2 0 0 0 2 2h10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    branch: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-11 5.5"/>',
    run: '<path d="M7 4v16l12-8z"/>',
    ext: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="m14 7 3-3 3 3-3 3z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    palette: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="m17 15 3 3-3 3"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
  };

  // ---- Colours: one small tokenizer per language ----
  const KW = 'import|export|from|const|let|var|function|return|if|else|for|of|in|new|class|extends|constructor|this|null|undefined|true|false|await|async|typeof|while|break|continue|default';
  const RULES = {
    js: [['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//], ['str', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/], ['kw', new RegExp(`\\b(?:${KW})\\b`)], ['num', /\b\d+(?:\.\d+)?\b/], ['fn', /\b[A-Za-z_$][\w$]*(?=\()/], ['cls', /\b[A-Z][\w$]*\b/]],
    css: [['com', /\/\*[\s\S]*?\*\//], ['str', /'[^'\n]*'|"[^"\n]*"/], ['prop', /[\w-]+(?=\s*:)/], ['num', /#[0-9a-fA-F]{3,8}\b|-?\b\d+(?:\.\d+)?(?:px|%|em|rem|s|ms|vh|vw|deg)?\b/], ['sel', /[.#]?[\w-]+(?=[^{}]*\{)/]],
    html: [['com', /<!--[\s\S]*?-->/], ['tag', /<\/?[\w-]+|\/?>/], ['str', /"[^"\n]*"|'[^'\n]*'/], ['attr', /\b[\w-]+(?==)/]],
    json: [['prop', /"(?:\\.|[^"\\\n])*"(?=\s*:)/], ['str', /"(?:\\.|[^"\\\n])*"/], ['num', /-?\b\d+(?:\.\d+)?\b/], ['kw', /\b(?:true|false|null)\b/]],
    md: [['kw', /^#{1,6} [^\n]*/m], ['str', /`[^`\n]*`/], ['fn', /^\s*[-*] /m]],
  };
  function colour(text, lang) {
    const rules = RULES[lang] || [];
    if (!rules.length) return esc(text);
    const re = new RegExp(rules.map(([, r]) => `(${r.source})`).join('|'), 'gm');
    let out = '', last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.slice(1).findIndex(g => g !== undefined);
      out += esc(text.slice(last, m.index)) + `<span class="tk-${rules[i][0]}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  // ---- Format document: re-indent by braces (JS, CSS, JSON) or by tags (HTML) ----
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
  function format(text, lang) {
    const lines = text.replace(/\s+$/, '').split('\n');
    let depth = 0, inBlock = false;
    const out = lines.map(raw => {
      const line = raw.trim();
      if (!line) return '';
      let d = depth;
      if (lang === 'html') {
        if (/^<\//.test(line)) d = Math.max(0, depth - 1);
        const opens = [...line.matchAll(/<([\w-]+)[^>]*?(\/?)>/g)].filter(m => !VOID.test(m[1]) && !m[2] && m[1].toLowerCase() !== 'html').length;
        const closes = [...line.matchAll(/<\/([\w-]+)>/g)].filter(m => m[1].toLowerCase() !== 'html').length;
        depth = Math.max(0, depth + opens - closes);
        return '  '.repeat(/^<\/?(html|head|body)\b/i.test(line) ? 0 : d) + line;
      }
      // Count braces outside strings and comments.
      const code = inBlock && !line.includes('*/') ? '' : line.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/.*$|\/\*.*?\*\//g, '');
      if (/^\/\*/.test(line) && !line.includes('*/')) inBlock = true;
      if (inBlock && line.includes('*/')) inBlock = false;
      const lead = (code.match(/^[}\])]+/) || [''])[0].length;
      d = Math.max(0, depth - lead);
      depth = Math.max(0, depth + (code.match(/[{[(]/g) || []).length - (code.match(/[}\])]/g) || []).length);
      return '  '.repeat(d) + line;
    });
    return out.join('\n') + '\n';
  }
  const MARK = { js: ['// ', ''], css: ['/* ', ' */'], html: ['<!-- ', ' -->'], json: null, md: null };
  function toggleComment(text, s, e, lang) {
    const mark = MARK[lang];
    if (!mark) return null;
    const a = text.lastIndexOf('\n', s - 1) + 1, bEnd = text.indexOf('\n', Math.max(s, e - (e > s && text[e - 1] === '\n' ? 1 : 0)));
    const b = bEnd < 0 ? text.length : bEnd;
    const lines = text.slice(a, b).split('\n');
    const [open, close] = mark, o = open.trim(), cl = close.trim();
    const used = lines.filter(l => l.trim());
    const all = used.length && used.every(l => l.trim().startsWith(o) && (!cl || l.trim().endsWith(cl)));
    const indent = Math.min(...used.map(l => l.match(/^\s*/)[0].length));
    const next = lines.map(l => {
      if (!l.trim()) return l;
      if (all) { let t = l.replace(new RegExp(`^(\\s*)${o.replace(/[*/]/g, '\\$&')} ?`), '$1'); if (cl) t = t.replace(new RegExp(` ?${cl.replace(/[*/]/g, '\\$&')}\\s*$`), ''); return t; }
      return l.slice(0, indent) + open + l.slice(indent) + close;
    }).join('\n');
    return { text: text.slice(0, a) + next + text.slice(b), a, b: a + next.length };
  }

  // ---- The editor ----
  function editor(c) {
    const f = c.file, ta = c.ta;
    ta.value = c.docs[f];
    c.lang = ext(f);
    paint(c);
    ta.scrollTop = 0; ta.scrollLeft = 0; sync(c);
    c.body.querySelector('.cd-crumbs').innerHTML = f.split('/').map(p => `<span>${esc(p)}</span>`).join(svg(P.chevron));
    c.body.querySelector('.cd-lang').textContent = LANG[c.lang] || 'Plain Text';
    tree(c); tabs(c); status(c);
  }
  function paint(c) {
    c.hl.innerHTML = colour(c.ta.value, c.lang) + '\n';
    const n = c.ta.value.split('\n').length;
    if (c.gutter.childElementCount !== n) c.gutter.innerHTML = Array.from({ length: n }, (_, i) => `<i>${i + 1}</i>`).join('');
  }
  function sync(c) { c.hl.style.transform = `translate(${-c.ta.scrollLeft}px, ${-c.ta.scrollTop}px)`; c.gutter.style.transform = `translateY(${-c.ta.scrollTop}px)`; }
  function status(c) {
    const ta = c.ta, upto = ta.value.slice(0, ta.selectionStart), ln = upto.split('\n').length, col = upto.length - upto.lastIndexOf('\n');
    const sel = ta.selectionEnd - ta.selectionStart;
    c.body.querySelector('.cd-pos').textContent = `Ln ${ln}, Col ${col}${sel ? ` (${sel} selected)` : ''}`;
    c.gutter.querySelectorAll('.is-on').forEach(i => i.classList.remove('is-on'));
    c.gutter.children[ln - 1]?.classList.add('is-on');
  }
  // Replaces the whole text in one step Ctrl+Z can take back.
  function put(c, text, s, e) {
    const ta = c.ta;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(0, ta.value.length);
    if (!document.execCommand('insertText', false, text)) ta.value = text;
    ta.setSelectionRange(s, e);
    c.docs[c.file] = ta.value;
    c.dirty.add(c.file);
    paint(c); status(c); tabs(c);
  }
  function selection(c) {
    const ta = c.ta, s = ta.selectionStart, e = ta.selectionEnd;
    if (e === s && c.pre && c.pre[1] > c.pre[0]) return c.pre;
    return [s, e];
  }

  function tree(c) {
    const files = Object.keys(c.docs).sort((a, b) => (b.includes('/') - a.includes('/')) || a.localeCompare(b));
    const icon = f => `<b class="fi fi-${ext(f)}">${{ js: 'JS', html: '&lt;&gt;', css: '#', json: '{}', md: 'M↓' }[ext(f)] || ''}</b>`;
    let html = '<div class="cd-folder">' + svg(P.chevron) + 'RING-DEMO</div>', inSrc = false;
    for (const f of files) {
      if (f.startsWith('src/') && !inSrc) { html += '<div class="cd-dir">' + svg(P.chevron) + 'src</div>'; inSrc = true; }
      html += `<button type="button" class="cd-file${f === c.file ? ' is-on' : ''}${f.includes('/') ? ' is-in' : ''}" data-file="${f}">${icon(f)}${esc(f.split('/').pop())}${c.dirty.has(f) ? '<i class="cd-dot"></i>' : ''}</button>`;
    }
    c.body.querySelector('.cd-tree').innerHTML = html;
  }
  function tabs(c) {
    c.body.querySelector('.cd-tabs').innerHTML = c.open.map(f => `<div class="cd-tab${f === c.file ? ' is-on' : ''}" data-file="${f}"><b class="fi fi-${ext(f)}">${{ js: 'JS', html: '&lt;&gt;', css: '#', json: '{}', md: 'M↓' }[ext(f)]}</b>${esc(f.split('/').pop())}<button type="button" class="cd-tabx" aria-label="Close">${c.dirty.has(f) ? '<i class="cd-dot"></i>' : svg(P.close)}</button></div>`).join('');
  }
  function openFile(c, f) {
    if (c.file) c.docs[c.file] = c.ta.value;
    if (!c.open.includes(f)) c.open.push(f);
    c.file = f; c.pre = null;
    editor(c);
  }

  // ---- Command palette and quick open: one box, ">" for commands, like the real one ----
  const COMMANDS = [
    ['Format Document', 'Shift+Alt+F', c => formatDoc(c)],
    ['Toggle Line Comment', 'Ctrl+/', c => comment(c)],
    ['Go to File...', 'Ctrl+P', c => palette(c, '')],
    ['Search: Find in Files', 'Ctrl+Shift+F', c => findInFiles(c)],
    ['View: Toggle Primary Side Bar Visibility', 'Ctrl+B', c => sidebar(c)],
    ['View: Toggle Zen Mode', 'Ctrl+K Z', c => zen(c)],
    ['View: Toggle Terminal', 'Ctrl+`', c => terminal(c)],
    ['File: Save', 'Ctrl+S', c => save(c)],
    ['Developer: Reload Window', '', c => reset(c)],
  ];
  function palette(c, start = '>') {
    const box = c.body.querySelector('.cd-pal'), q = box.querySelector('input');
    box.hidden = false;
    q.value = start;
    q.placeholder = start ? 'Type the name of a command to run.' : 'Search files by name (append : to go to a line or > to run a command)';
    list(c);
    q.focus();
  }
  function list(c) {
    const box = c.body.querySelector('.cd-pal'), q = box.querySelector('input').value, cmd = q.startsWith('>'), words = q.replace(/^>/, '').trim().toLowerCase();
    const items = cmd
      ? COMMANDS.filter(([t]) => t.toLowerCase().includes(words)).map(([t, k], i) => `<button type="button" class="cd-pi" data-cmd="${COMMANDS.findIndex(x => x[0] === t)}"><span>${esc(t)}</span><kbd>${esc(k)}</kbd></button>`)
      : Object.keys(c.docs).filter(f => f.toLowerCase().includes(words)).map(f => `<button type="button" class="cd-pi" data-file="${f}"><b class="fi fi-${ext(f)}">${{ js: 'JS', html: '&lt;&gt;', css: '#', json: '{}', md: 'M↓' }[ext(f)]}</b><span>${esc(f.split('/').pop())}</span><small>${esc(f.includes('/') ? f.split('/')[0] : '')}</small></button>`);
    box.querySelector('.cd-plist').innerHTML = items.join('') || `<p class="cd-pnone">No matching ${cmd ? 'commands' : 'files'}</p>`;
    box.querySelector('.cd-pi')?.classList.add('is-on');
  }
  function pick(c, b) {
    closePalette(c);
    if (b.dataset.file) openFile(c, b.dataset.file); else COMMANDS[+b.dataset.cmd][2](c);
  }
  function closePalette(c) { c.body.querySelector('.cd-pal').hidden = true; }

  function formatDoc(c) {
    const before = c.ta.value, after = format(before, c.lang);
    if (after === before) return OS.toast('Format Document', 'Already formatted.', ICON);
    const [s] = selection(c), line = before.slice(0, s).split('\n').length;
    const at = after.split('\n').slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
    put(c, after, at, at);
    flash(c);
  }
  function comment(c) {
    const [s, e] = selection(c), r = toggleComment(c.ta.value, s, e, c.lang);
    if (!r) return OS.toast('Toggle Line Comment', `${LANG[c.lang]} has no line comments.`, ICON);
    put(c, r.text, r.a, r.b);
  }
  function sidebar(c, show) { c.root.classList.toggle('no-side', show === undefined ? undefined : !show); }
  function zen(c) {
    const on = c.root.classList.toggle('is-zen');
    if (on) OS.toast('Zen mode', 'Only the code. Pick Zen again, or press Esc twice, to come back.', ICON);
    c.ta.focus();
  }
  function terminal(c, show) {
    const on = c.root.classList.toggle('has-term', show);
    if (on) { c.term.querySelector('input').focus(); c.term.querySelector('.cd-out').scrollTop = 1e6; } else c.ta.focus();
  }
  function save(c) { c.docs[c.file] = c.ta.value; c.dirty.delete(c.file); tabs(c); tree(c); OS.toast('Saved', c.file, ICON); }
  function reset(c) { c.docs = { ...FILES }; c.dirty.clear(); c.open = ['src/ring.js']; c.file = null; openFile(c, 'src/ring.js'); }
  function flash(c) { c.ed.classList.remove('is-flash'); void c.ed.offsetWidth; c.ed.classList.add('is-flash'); }

  function findInFiles(c, word) {
    c.docs[c.file] = c.ta.value;
    sidebar(c, true);
    c.root.classList.add('is-search');
    const [s, e] = selection(c), sel = c.ta.value.slice(s, e).trim();
    const q = c.body.querySelector('.cd-sq');
    q.value = word ?? (sel && !sel.includes('\n') ? sel : q.value || 'Spring');
    results(c);
    q.focus(); q.select();
  }
  function results(c) {
    const q = c.body.querySelector('.cd-sq').value, out = c.body.querySelector('.cd-sres');
    if (!q) { out.innerHTML = ''; return; }
    let count = 0, files = 0;
    const html = Object.entries(c.docs).map(([f, text]) => {
      const hits = text.split('\n').map((l, i) => [l, i]).filter(([l]) => l.toLowerCase().includes(q.toLowerCase()));
      if (!hits.length) return '';
      count += hits.length; files++;
      return `<div class="cd-sf"><b class="fi fi-${ext(f)}">${{ js: 'JS', html: '&lt;&gt;', css: '#', json: '{}', md: 'M↓' }[ext(f)]}</b>${esc(f.split('/').pop())}<small>${esc(f.includes('/') ? f.split('/')[0] : '')}</small><em>${hits.length}</em></div>`
        + hits.map(([l, i]) => { const at = l.toLowerCase().indexOf(q.toLowerCase()), t = l.trim(), off = l.length - l.trimStart().length; return `<button type="button" class="cd-sl" data-file="${f}" data-line="${i}" data-col="${at}">${esc(t.slice(0, at - off))}<mark>${esc(l.substr(at, q.length))}</mark>${esc(t.slice(at - off + q.length))}</button>`; }).join('');
    }).join('');
    out.innerHTML = `<p class="cd-scount">${count} result${count === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}</p>` + html;
  }

  // ---- The terminal: a few commands that answer like the real ones ----
  const PROMPT = 'PS C:\\dev\\ring-demo> ';
  function run(c, cmd) {
    const out = c.term.querySelector('.cd-out'), say = t => out.insertAdjacentHTML('beforeend', `<div>${esc(t)}</div>`);
    say(PROMPT + cmd);
    const k = cmd.trim().toLowerCase();
    if (!k) { /* a new prompt */ }
    else if (k === 'clear' || k === 'cls') out.innerHTML = '';
    else if (k === 'npm test' || k === 'npm run test') ['', '> ring-demo@0.3.0 test', '> node --test', '', '✔ slices() makes eight slices (1.2ms)', '✔ pick() is -1 in the hub (0.3ms)', '✔ pick() finds the slice a flick points at (0.4ms)', 'ℹ tests 3', 'ℹ pass 3', 'ℹ fail 0'].forEach(say);
    else if (k === 'npm run dev') ['', '> ring-demo@0.3.0 dev', '> vite', '', '  VITE v6.3.5  ready in 312 ms', '', '  ➜  Local:   http://localhost:5173/', '  ➜  press h + enter to show help'].forEach(say);
    else if (k === 'git status') ['On branch main', 'Changes not staged for commit:', ...[...c.dirty].map(f => `        modified:   ${f}`), ...(c.dirty.size ? [] : ['nothing to commit, working tree clean'])].forEach(say);
    else if (k === 'ls' || k === 'dir') ['', '    Directory: C:\\dev\\ring-demo', '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----', ...Object.keys(c.docs).filter(f => !f.includes('/')).map(f => `-a---          21/10/2026    09:41    ${String(c.docs[f].length).padStart(11)} ${f}`), 'd----          21/10/2026    09:41                src'].forEach(say);
    else if (k === 'help') say('Try: npm test, npm run dev, git status, ls, clear');
    else say(`${cmd.trim().split(' ')[0]}: The term '${cmd.trim().split(' ')[0]}' is not recognized as a name of a cmdlet, function, script file, or executable program.`);
    out.scrollTop = 1e6;
  }

  OS.register({
    id: 'code',
    tint: '#4cc2ff',
    async render(body, c) {
      await style('os/apps/code.css');
      body.innerHTML = `<div class="cd has-term os-dark">
        <nav class="cd-act" aria-label="Views">
          <button type="button" class="is-on" data-view="files" title="Explorer (Ctrl+Shift+E)">${svg(P.files)}</button>
          <button type="button" data-view="search" title="Search (Ctrl+Shift+F)">${svg(P.search)}</button>
          <button type="button" data-view="git" title="Source Control (Ctrl+Shift+G)">${svg(P.branch)}</button>
          <button type="button" data-view="run" title="Run and Debug (Ctrl+Shift+D)">${svg(P.run)}</button>
          <button type="button" data-view="ext" title="Extensions (Ctrl+Shift+X)">${svg(P.ext)}</button>
          <span></span>
          <button type="button" data-view="palette" title="Manage">${svg(P.gear)}</button>
        </nav>
        <aside class="cd-side">
          <div class="cd-sv cd-sv-files"><h3>Explorer</h3><div class="cd-tree"></div></div>
          <div class="cd-sv cd-sv-search"><h3>Search</h3><input class="cd-sq" type="search" placeholder="Search" aria-label="Search in files" spellcheck="false"><div class="cd-sres"></div></div>
        </aside>
        <div class="cd-main">
          <div class="cd-tabs"></div>
          <div class="cd-crumbs"></div>
          <div class="cd-ed">
            <div class="cd-gutter" aria-hidden="true"></div>
            <div class="cd-code"><pre class="cd-hl" aria-hidden="true"></pre><textarea class="cd-ta" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Code" wrap="off"></textarea></div>
          </div>
          <section class="cd-term" aria-label="Terminal">
            <div class="cd-termbar"><span>Problems</span><span>Output</span><span>Debug console</span><span class="is-on">Terminal</span><button type="button" class="cd-termx" aria-label="Close the terminal">${svg(P.close)}</button></div>
            <div class="cd-out"><div>Windows PowerShell</div><div>Try npm test, or npm run dev.</div><div>&nbsp;</div></div>
            <form class="cd-in"><label>${esc(PROMPT)}</label><input type="text" spellcheck="false" autocomplete="off" aria-label="Terminal input"></form>
          </section>
        </div>
        <footer class="cd-status"><span class="cd-br">${svg(P.branch)}main*</span><span>⊗ 0 ⚠ 0</span><span class="cd-fill"></span><span class="cd-pos"></span><span>Spaces: 2</span><span>UTF-8</span><span>LF</span><span class="cd-lang"></span></footer>
        <div class="cd-pal" hidden><input type="text" spellcheck="false" autocomplete="off" aria-label="Command palette"><div class="cd-plist" role="listbox"></div></div>
      </div>`;
      c.root = body.querySelector('.cd');
      c.ta = body.querySelector('.cd-ta'); c.hl = body.querySelector('.cd-hl'); c.gutter = body.querySelector('.cd-gutter');
      c.ed = body.querySelector('.cd-ed'); c.term = body.querySelector('.cd-term');
      c.docs = { ...FILES }; c.dirty = new Set(); c.open = ['src/ring.js', 'index.html']; c.file = null;
      if (OS.phone) c.root.classList.add('no-side');
      const ta = c.ta;
      ta.addEventListener('input', () => { c.docs[c.file] = ta.value; if (!c.dirty.has(c.file)) { c.dirty.add(c.file); tabs(c); tree(c); } paint(c); status(c); });
      ta.addEventListener('scroll', () => sync(c));
      ta.addEventListener('keydown', () => { c.pre = null; });
      let pressed = false;
      ta.addEventListener('pointerdown', () => { c.pre = [ta.selectionStart, ta.selectionEnd]; pressed = true; });
      // A drag under the held ring is a flick, not a new selection: before the slice runs (on the desktop's
      // pointerup), the selection from before the press comes back.
      c.up = () => { if (pressed && OS.ring.held && c.pre) ta.setSelectionRange(...c.pre); pressed = false; };
      addEventListener('pointerup', c.up, true);
      ['keyup', 'pointerup', 'select', 'focus'].forEach(ev => ta.addEventListener(ev, () => status(c)));
      // Tab indents, as an editor's does.
      ta.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.ctrlKey) { e.preventDefault(); document.execCommand('insertText', false, '  '); } });
      body.querySelector('.cd-tree').addEventListener('click', e => { const b = e.target.closest('[data-file]'); if (b) openFile(c, b.dataset.file); });
      body.querySelector('.cd-tabs').addEventListener('click', e => {
        const t = e.target.closest('.cd-tab');
        if (!t) return;
        if (e.target.closest('.cd-tabx')) {
          c.open = c.open.filter(f => f !== t.dataset.file);
          if (!c.open.length) c.open = ['README.md'];
          if (t.dataset.file === c.file) { c.docs[c.file] = ta.value; c.file = null; openFile(c, c.open[0]); } else tabs(c);
        } else openFile(c, t.dataset.file);
      });
      body.querySelector('.cd-act').addEventListener('click', e => {
        const b = e.target.closest('[data-view]');
        if (!b) return;
        const v = b.dataset.view;
        if (v === 'palette') return palette(c);
        if (v === 'search') return findInFiles(c);
        if (v === 'files') { const same = !c.root.classList.contains('is-search') && !c.root.classList.contains('no-side'); c.root.classList.remove('is-search'); return sidebar(c, !same); }
        OS.toast({ git: 'Source control', run: 'Run and debug', ext: 'Extensions' }[v], 'Not in this little editor. The ring has the eight that are.', ICON);
      });
      body.querySelector('.cd-sq').addEventListener('input', () => results(c));
      body.querySelector('.cd-sres').addEventListener('click', e => {
        const b = e.target.closest('.cd-sl');
        if (!b) return;
        openFile(c, b.dataset.file);
        const lines = ta.value.split('\n'), at = lines.slice(0, +b.dataset.line).join('\n').length + (+b.dataset.line ? 1 : 0) + +b.dataset.col;
        ta.focus(); ta.setSelectionRange(at, at + body.querySelector('.cd-sq').value.length);
        ta.scrollTop = Math.max(0, +b.dataset.line * 20 - 80); sync(c); status(c);
      });
      const pal = body.querySelector('.cd-pal'), pq = pal.querySelector('input');
      pq.addEventListener('input', () => list(c));
      pq.addEventListener('keydown', e => {
        const items = [...pal.querySelectorAll('.cd-pi')], i = items.findIndex(x => x.classList.contains('is-on'));
        if (e.key === 'Escape') { e.stopPropagation(); closePalette(c); ta.focus(); }
        if (e.key === 'Enter' && items[i]) { e.preventDefault(); pick(c, items[i]); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          items[i]?.classList.remove('is-on');
          const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
          n?.classList.add('is-on'); n?.scrollIntoView({ block: 'nearest' });
        }
      });
      pq.addEventListener('blur', () => setTimeout(() => { if (!pal.contains(document.activeElement)) closePalette(c); }, 150));
      pal.addEventListener('click', e => { const b = e.target.closest('.cd-pi'); if (b) pick(c, b); });
      body.querySelector('.cd-termx').addEventListener('click', () => terminal(c, false));
      body.querySelector('.cd-in').addEventListener('submit', e => { e.preventDefault(); const i = e.currentTarget.querySelector('input'); run(c, i.value); i.value = ''; });
      let escs = 0;
      body.addEventListener('keydown', e => {
        const k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape' && c.root.classList.contains('is-zen')) { e.preventDefault(); if (++escs >= 2) { escs = 0; zen(c); } return; }
        escs = 0;
        const act = ctrl && e.shiftKey && k === 'p' ? () => palette(c) : ctrl && !e.shiftKey && k === 'p' ? () => palette(c, '')
          : e.shiftKey && e.altKey && k === 'f' ? () => formatDoc(c) : ctrl && (k === '/' || e.code === 'Slash') ? () => comment(c)
          : ctrl && !e.shiftKey && k === 'b' ? () => sidebar(c) : ctrl && (e.code === 'Backquote') ? () => terminal(c)
          : ctrl && e.shiftKey && k === 'f' ? () => findInFiles(c) : ctrl && k === 's' ? () => save(c) : null;
        if (act) { e.preventDefault(); e.stopPropagation(); act(); }
      });
      openFile(c, 'src/ring.js');
      if (OS.phone) c.root.classList.remove('has-term');
    },
    onClose(c) { removeEventListener('pointerup', c.up, true); },
    // The gallery's VS Code recipes, labels as there.
    ring: [
      { label: 'Palette', icon: 'fluent:E943', tint: '#7cc4ff', say: 'Opens the command palette (Ctrl+Shift+P).', run: c => palette(c) },
      { label: 'Quick open', icon: 'fluent:E8E5', tint: '#5eead4', say: 'Go to file (Ctrl+P).', run: c => palette(c, '') },
      { label: 'Format', icon: 'fluent:E943', tint: '#6ee7a0', say: 'Formats the whole document (Shift+Alt+F).', run: c => formatDoc(c) },
      { label: 'Comment', icon: 'fluent:E8BD', tint: '#ffd166', say: 'Toggles a line comment on the selected lines (Ctrl+/).', run: c => comment(c) },
      { label: 'Terminal', icon: '⌨', tint: '#fdba74', say: 'Toggles the integrated terminal (Ctrl+`).', run: c => terminal(c) },
      { label: 'Find in files', icon: '🔎', tint: '#ff7aa8', say: 'Searches all files for the selected word (Ctrl+Shift+F).', run: c => findInFiles(c) },
      { label: 'Sidebar', icon: 'fluent:E700', tint: '#c4a1ff', say: 'Toggles the sidebar (Ctrl+B).', run: c => sidebar(c) },
      { label: 'Zen', icon: 'fluent:E943', tint: '#a5b4fc', say: 'Zen mode: only the code (Ctrl+K Z).', run: c => zen(c) },
    ],
  });

  // For checks and the console: OSCode.format(text, 'js'), OSCode.toggleComment(text, s, e, 'js')
  window.OSCode = { format, toggleComment, colour };
})();
