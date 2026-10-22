/* Terminal: a pretend Windows Terminal with tabs and panes, for the gallery's Windows Terminal recipes (New tab,
   Split, Close pane) and Paste plain. A few harmless commands work (help, dir, cd, cls, echo…); dir and cd walk
   the same folders as File Explorer (window.OSFiles). Nothing runs on any real computer. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const F = () => window.OSFiles;
  let T = null, seq = 0;
  const pane = cwd => ({ id: ++seq, lines: [], cwd: cwd || '', hist: [], hi: 0, input: '' });
  const tab = cwd => { const p = pane(cwd); greet(p); return { id: ++seq, root: { p }, active: p }; };
  function greet(p) { p.lines.push('<span class="wt-dim">PowerShell · a pretend one: nothing here runs on your PC.</span>', '<span class="wt-dim">Type <b>help</b>. Or hold the mouse anywhere in this window: the ring.</span>', ''); }
  const where = p => [F()?.HOME || 'C:\\Users\\you', p.cwd].filter(Boolean).join('\\');
  const prompt = p => `PS ${esc(where(p))}&gt; `;

  // ---- Commands ----
  const pad = (s, n, right) => right ? String(s).padStart(n) : String(s).padEnd(n);
  function dir(p) {
    const items = F() ? F().list(p.cwd) : [];
    const out = ['', `    Directory: ${esc(where(p))}`, '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----'];
    items.forEach(x => {
      const dt = new Date(x.t), when = `${dt.toLocaleDateString('en-US')} ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      out.push(`${x.dir ? 'd----' : '-a---'}${pad(when, 25, true)} ${pad(x.dir ? '' : Math.round(x.size), 14, true)} ${x.dir ? '<span class="wt-dir">' + esc(x.name) + '</span>' : esc(x.name)}`);
    });
    if (!items.length) out.push('(empty)');
    return out.concat('');
  }
  function cd(p, arg) {
    arg = (arg || '').trim().replace(/^["']|["']$/g, '');
    if (!arg || arg === '~') { p.cwd = ''; return []; }
    const home = (F()?.HOME || '').toLowerCase();
    let parts = arg.toLowerCase().startsWith(home) ? arg.slice(home.length).split('\\').filter(Boolean) : [...(p.cwd ? p.cwd.split('\\') : []), ...arg.split(/[\\/]/).filter(Boolean)];
    const out = [];
    for (const s of parts) {
      if (s === '.') continue;
      if (s === '..') { out.pop(); continue; }
      const here = F()?.list(out.join('\\')).find(x => x.dir && x.name.toLowerCase() === s.toLowerCase());
      if (!here) return [`<span class="wt-err">Set-Location: Cannot find path '${esc(arg)}' because it does not exist.</span>`];
      out.push(here.name);
    }
    p.cwd = out.join('\\');
    return [];
  }
  const NOTES = ['Shopping: milk, coffee, batteries', 'Call the bank on Tuesday', 'Ring idea: Shrink PDF + Mail file'];
  function run(p, line) {
    const [cmd0, ...rest] = line.trim().split(/\s+/), cmd = (cmd0 || '').toLowerCase(), arg = rest.join(' ');
    switch (cmd) {
      case '': return [];
      case 'help': case 'get-help': return ['Commands that work here:', '  dir, ls        what is in this folder', '  cd <folder>    go to a folder (cd .. goes up)', '  cls, clear     clear the screen',
        '  echo <text>    print text', '  type <file>    print a text file', '  whoami, date   who and when', '  explorer .     open this folder in File Explorer', '  notepad        open Notepad', '  exit           close this pane', ''];
      case 'dir': case 'ls': case 'gci': case 'get-childitem': return dir(p);
      case 'cd': case 'chdir': case 'set-location': case 'sl': return cd(p, arg);
      case 'cls': case 'clear': case 'clear-host': p.lines = []; return null;
      case 'echo': case 'write-output': case 'write-host': return [esc(arg.replace(/^["']|["']$/g, ''))];
      case 'whoami': return ['desktop\\you'];
      case 'date': case 'get-date': return ['', new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }), ''];
      case 'ver': return ['', 'Microsoft Windows [Version 10.0.26100]', ''];
      case 'pwd': case 'get-location': return ['', 'Path', '----', esc(where(p)), ''];
      case 'type': case 'cat': case 'get-content': {
        const fl = F()?.list(p.cwd).find(x => x.name.toLowerCase() === arg.toLowerCase().replace(/^\.\\/, ''));
        if (!fl) return [`<span class="wt-err">Get-Content: Cannot find path '${esc(where(p))}\\${esc(arg)}' because it does not exist.</span>`];
        return /\.txt$/i.test(fl.name) ? NOTES.map(esc) : [`<span class="wt-dim">${esc(fl.name)} is not text. This terminal shows .txt files only.</span>`];
      }
      case 'explorer': case 'ii': case 'start': case 'invoke-item': OS.open('explorer', { cwd: p.cwd }); return [];
      case 'notepad': OS.open('notepad'); return [];
      case 'exit': closePane(); return null;
      case 'radialdeck': return ['RadialDeck: a radial menu for Windows 10 and 11. Free for two rings.', 'Hold the mouse anywhere, flick, let go.', ''];
      default: return [`<span class="wt-err">${esc(cmd0)}: The term '${esc(cmd0)}' is not recognized as a name of a cmdlet, function, script file, or executable program.</span>`, `<span class="wt-err">Check the spelling of the name, or type <b>help</b>.</span>`, ''];
    }
  }

  // ---- Tabs and panes ----
  const tabNow = () => T.tabs[T.cur];
  function panes(n, out = []) { if (n.p) out.push(n.p); else { panes(n.a, out); panes(n.b, out); } return out; }
  function html(n) {
    if (n.p) {
      const p = n.p, on = p === tabNow().active;
      return `<div class="wt-pane${on ? ' is-on' : ''}" data-p="${p.id}"><div class="wt-out">${p.lines.map(l => `<div>${l || '&nbsp;'}</div>`).join('')}<div class="wt-line"><span>${prompt(p)}</span><input class="wt-in" value="${esc(p.input)}" spellcheck="false" autocomplete="off" aria-label="Command"></div></div></div>`;
    }
    return `<div class="wt-split is-${n.dir}">${html(n.a)}${html(n.b)}</div>`;
  }
  function draw(focus = true) {
    if (!T) return;
    T.tabsEl.innerHTML = T.tabs.map((t, i) => `<div class="wt-tab${i === T.cur ? ' is-on' : ''}" data-t="${i}"><img src="assets/apps/windows-terminal.png" alt=""><span>${esc(where(t.active).split('\\').pop() || 'PowerShell')}</span><button type="button" class="wt-x" data-x="${i}" aria-label="Close tab">${OS.svg(OS.icons.close)}</button></div>`).join('')
      + `<button type="button" class="wt-plus" aria-label="New tab">${OS.svg('<path d="M12 5v14M5 12h14"/>')}</button>`;
    T.view.innerHTML = html(tabNow().root);
    T.view.querySelectorAll('.wt-out').forEach(o => { o.scrollTop = o.scrollHeight; });
    if (focus) T.view.querySelector('.wt-pane.is-on .wt-in')?.focus({ preventScroll: true });
  }
  function newTab(cwd) { T.tabs.push(tab(cwd ?? tabNow()?.active.cwd ?? '')); T.cur = T.tabs.length - 1; draw(); }
  function split(dir) {
    const t = tabNow(), p = t.active, np = pane(p.cwd);
    (function swap(n) { if (n.p === p) { n.dir = dir; n.a = { p }; n.b = { p: np }; delete n.p; return true; } return !n.p && (swap(n.a) || swap(n.b)); })(t.root);
    t.active = np;
    draw();
  }
  function closePane() {
    const t = tabNow(), p = t.active;
    if (t.root.p === p) { // the last pane: the tab goes; the last tab: the window
      T.tabs.splice(T.cur, 1);
      if (!T.tabs.length) return T.close();
      T.cur = Math.min(T.cur, T.tabs.length - 1);
      return draw();
    }
    (function cut(n) {
      for (const k of ['a', 'b']) if (n[k]?.p === p) { const keep = n[k === 'a' ? 'b' : 'a']; Object.keys(n).forEach(x => delete n[x]); Object.assign(n, keep); return true; }
      return !n.p && (cut(n.a) || cut(n.b));
    })(t.root);
    t.active = panes(t.root)[0];
    draw();
  }
  async function pastePlain() {
    let text = null;
    try { text = await navigator.clipboard.readText(); } catch (_) { }
    if (text === null) return OS.toast('Paste plain', 'This browser keeps the clipboard to itself. Press Ctrl+V in the terminal.', 'assets/apps/windows-terminal.png');
    const p = tabNow().active;
    p.input += text.replace(/\s*\r?\n\s*/g, ' ').trim();
    draw();
  }

  OS.register({
    id: 'terminal',
    tint: '#c4a1ff',
    render(body, c) {
      T = c;
      body.innerHTML = '<div class="wt os-dark"><div class="wt-tabs" role="tablist"></div><div class="wt-view"></div></div>';
      c.tabsEl = body.querySelector('.wt-tabs'); c.view = body.querySelector('.wt-view');
      c.tabs = [tab(c.args.cwd)]; c.cur = 0;
      c.tabsEl.addEventListener('click', e => {
        const x = e.target.closest('[data-x]');
        if (x) { T.cur = +x.dataset.x; return closeTabAt(+x.dataset.x); }
        if (e.target.closest('.wt-plus')) return newTab();
        const t = e.target.closest('[data-t]');
        if (t) { T.cur = +t.dataset.t; draw(); }
      });
      c.view.addEventListener('pointerdown', e => {
        const el = e.target.closest('.wt-pane');
        if (!el) return;
        const p = panes(tabNow().root).find(x => x.id === +el.dataset.p);
        if (p && p !== tabNow().active) { tabNow().active = p; c.view.querySelectorAll('.wt-pane').forEach(x => x.classList.toggle('is-on', x === el)); }
      });
      // A click (not a hold) puts the caret in the pane, as in a real terminal.
      c.view.addEventListener('click', e => { if (!getSelection().toString()) e.target.closest('.wt-pane')?.querySelector('.wt-in')?.focus({ preventScroll: true }); });
      c.view.addEventListener('input', e => { if (e.target.matches('.wt-in')) tabNow().active.input = e.target.value; });
      c.view.addEventListener('keydown', e => {
        if (!e.target.matches('.wt-in')) return;
        const p = tabNow().active;
        if (e.key === 'Enter') {
          const line = e.target.value;
          p.lines.push(`${prompt(p)}${esc(line)}`);
          if (line.trim()) { p.hist.push(line); p.hi = p.hist.length; }
          p.input = '';
          const out = run(p, line);
          if (out) p.lines.push(...out);
          if (T && T.tabs.length) draw();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          p.hi = Math.max(0, Math.min(p.hist.length, p.hi + (e.key === 'ArrowUp' ? -1 : 1)));
          e.target.value = p.input = p.hist[p.hi] || '';
        } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); p.lines = []; draw(); }
      });
      draw();
    },
    onOpen(c, args) { if (args.cwd != null && c.tabs && args.cwd !== tabNow().active.cwd) newTab(args.cwd); },
    onClose() { T = null; },
    // The gallery's Windows Terminal recipes, and Paste plain from Clipboard.
    ring: [
      { label: 'New tab', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 9v6M9 12h6"/>', tint: '#7cc4ff', say: 'Open new tab.', run: () => newTab() },
      { label: 'Split', icon: 'snapRight', tint: '#c4a1ff', say: 'A nested ring: point at it and right / down come out as bubbles (Pro).', children: [
        { label: 'Split right', icon: 'snapRight', tint: '#c4a1ff', say: 'Split pane vertically: a new pane on the right.', run: () => split('row') },
        { label: 'Split down', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/><path d="M3 12h18v8H3z" fill="currentColor" fill-opacity=".35"/>', tint: '#fdba74', say: 'Split pane horizontally: a new pane below.', run: () => split('col') },
      ] },
      { label: 'Clear', icon: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21M22 21H7M5 11l9 9"/>', tint: '#5eead4', say: 'Clears the pane (cls).', run: () => { tabNow().active.lines = []; draw(); } },
      { label: 'Full screen', icon: 'maximize', tint: '#ffd166', say: 'Toggle full screen.', run: c => c?.el.querySelector('.win-max')?.click() },
      { label: 'Close pane', icon: 'close', tint: '#ff6b6b', say: 'Close current pane/tab.', run: () => closePane() },
      { label: 'Paste plain', icon: 'clipboard', tint: '#a5b4fc', say: 'Pastes what you copied without fonts, colours or links.', run: pastePlain },
    ],
  });
  function closeTabAt(i) { T.cur = i; const t = tabNow(); t.active = t.root.p || panes(t.root)[0]; t.root = { p: t.active }; closePane(); }
})();
