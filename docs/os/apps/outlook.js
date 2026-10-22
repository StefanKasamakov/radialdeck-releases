/* Outlook: a pretend inbox in the new Outlook's look. Its ring is RadialDeck's Outlook ring from the gallery
   (recipes ol-* / x-outlook-new-*, labels as there): in the real app each slice presses Outlook's own shortcut,
   here it does the same thing to this inbox. Nothing is sent anywhere. */
(() => {
  const ICON = 'assets/apps/outlook.png';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const css = () => document.querySelector('link[href="os/apps/office.css"]') ? null
    : new Promise(ok => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'os/apps/office.css', onload: ok, onerror: ok })));
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    reply: '<path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    replyAll: '<path d="M7 17 2 12l5-5M12 17l-5-5 5-5"/><path d="M22 18v-2a4 4 0 0 0-4-4H7"/>',
    forward: '<path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    newMail: '<path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7M19 16v6M16 19h6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    sent: '<path d="m22 2-7 20-4-9-9-4z"/>',
    draft: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
  };
  const ME = { name: 'Alex Morgan', addr: 'alex.morgan@example.com' };
  const hue = s => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  const initials = s => s.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = name => `<span class="of-av" style="--h:${hue(name)}">${esc(initials(name))}</span>`;
  const first = s => s.split(/\s+/)[0];
  const ago = min => new Date(Date.now() - min * 60000);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  function when(d) {
    const now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, now)) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (sameDay(d, y)) return 'Yesterday';
    return d.toLocaleDateString([], now - d < 6 * 864e5 ? { weekday: 'short' } : { day: 'numeric', month: 'short' });
  }
  const full = d => d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // A believable morning. People, firms and addresses are made up; example.com is reserved for exactly this.
  const SEED = [
    ['Dana Whitfield', 'Q4 budget review: numbers for Thursday', 14, true, ['priya.nair@example.com', 'marco.bellini@example.com'],
      'Hi Alex,\n\nCould you send me the final travel and software numbers before Thursday\'s review? I\'d like the whole picture on one page.\n\nIf anything is still open, a rough figure is fine. We can fix it in the sheet afterwards.\n\nThanks,\nDana', 'Q4 budget.xlsx'],
    ['Sam Okafor', 'Team offsite: pick a date', 52, true, ['dana.whitfield@example.com', 'lena.hoffmann@example.com'],
      'Hi all,\n\nThree dates work for the venue: 12, 19 or 26 November. Reply with the ones you can make and I\'ll book the one most of us can do.\n\nLunch is included, the train is on the team budget.\n\nSam'],
    ['Priya Nair', 'Re: Slides for the client workshop', 95, false, ['dana.whitfield@example.com'],
      'Alex,\n\nI\'ve added the timeline and the two case studies. Slide 7 still needs the new pricing; could you drop it in when you have a minute?\n\nThe deck is in the shared folder as Workshop v4.\n\nPriya'],
    ['Facilities', 'Heating maintenance on Friday', 160, false, [],
      'Hello everyone,\n\nThe heating on floors 2 and 3 will be off on Friday from 07:00 to 11:00 for maintenance. Meeting rooms 2A and 3C will be cold until noon.\n\nThank you for your patience,\nFacilities team'],
    ['Marco Bellini', 'Lunch next week?', 60 * 20, true, [],
      'Hey Alex,\n\nIt\'s been a while. Lunch next Tuesday or Wednesday? The new place by the station has a terrace that is still open.\n\nMarco'],
    ['Build server', 'Nightly build passed (#1287)', 60 * 26, false, [],
      'Build #1287 on main passed in 6 min 12 s.\n\n214 tests, 0 failures, 2 skipped.\n\nThis message was sent automatically.'],
    ['Lena Hoffmann', 'Contract draft v3, comments welcome', 60 * 30, false, ['legal@example.com'],
      'Hi Alex,\n\nAttached is version 3 of the service contract. I changed the payment terms to 30 days and added the notice period we talked about.\n\nComments by Monday would be great.\n\nBest,\nLena', 'Service contract v3.docx'],
    ['Accounts payable', 'Invoice INV-2209 approved', 60 * 50, false, [],
      'Invoice INV-2209 (office supplies, €412.80) was approved and will be paid on the next run.\n\nNo action is needed from you.\n\nAccounts payable'],
    ['IT Helpdesk', 'Your password expires in 5 days', 60 * 74, false, [],
      'Hello Alex,\n\nYour password expires in 5 days. Change it any time from the company portal.\n\nIT will never ask for your password by e-mail.\n\nIT Helpdesk'],
  ];
  const seed = () => SEED.map(([from, subject, min, unread, cc, body, attach], i) => ({
    id: i + 1, folder: 'inbox', from, addr: from.toLowerCase().replace(/\s+/g, '.') + '@example.com', subject, time: ago(min), unread, cc, body, attach,
  }));
  const FOLDERS = [['inbox', 'Inbox', I.inbox], ['drafts', 'Drafts', I.draft], ['sent', 'Sent Items', I.sent], ['archive', 'Archive', I.archive], ['deleted', 'Deleted Items', I.trash]];
  // The calendar: days from today, then [start hour, length in hours, title, where].
  const EVENTS = {
    '-1': [[10, 1, 'Supplier call', 'Teams']], 0: [[9.5, .25, 'Daily stand-up', 'Teams'], [11, 1, 'Budget prep', 'Room 2A'], [15, .5, '1:1 with Dana', 'Teams']],
    1: [[9.5, .25, 'Daily stand-up', 'Teams'], [10, 2, 'Client workshop', 'Room 3C']], 2: [[14, 1.5, 'Q4 budget review', 'Room 2A']],
    3: [[9.5, .25, 'Daily stand-up', 'Teams'], [16, 1, 'Offsite planning', 'Teams']], 6: [[12, 1, 'Lunch with Marco', 'By the station']], 9: [[13, 1, 'Contract sign-off', 'Teams']],
  };

  // ---- Drawing ----
  const $ = (c, s) => c.root.querySelector(s);
  const cur = c => c.mails.find(m => m.id === c.sel && m.folder === c.folder) || null;
  const shown = c => {
    const q = c.q.trim().toLowerCase();
    return c.mails.filter(m => m.folder === c.folder && (!q || `${m.from} ${m.subject} ${m.body}`.toLowerCase().includes(q))).sort((a, b) => b.time - a.time);
  };
  function folders(c) {
    $(c, '.ol-folders').innerHTML = `<button class="ol-new" type="button" data-act="new">${svg(I.newMail)}New mail</button>`
      + FOLDERS.map(([id, label, icon]) => {
        const n = id === 'inbox' ? c.mails.filter(m => m.folder === 'inbox' && m.unread).length : 0;
        return `<button type="button" data-folder="${id}" aria-current="${c.folder === id}">${svg(icon)}${label}${n ? `<b>${n}</b>` : ''}</button>`;
      }).join('');
  }
  function list(c) {
    const items = shown(c), name = FOLDERS.find(f => f[0] === c.folder)[1];
    $(c, '.ol-lhead').innerHTML = `<span>${c.q ? 'Results' : name}</span><small>${items.length} ${items.length === 1 ? 'item' : 'items'}</small>`;
    $(c, '.ol-items').innerHTML = items.map(m => `<div class="ol-item${m.unread ? ' is-unread' : ''}${m.id === c.sel ? ' is-sel' : ''}" role="option" tabindex="${m.id === c.sel ? 0 : -1}" aria-selected="${m.id === c.sel}" data-id="${m.id}">
        ${av(m.folder === 'sent' ? m.toName || '?' : m.from)}<div class="ol-it"><div class="ol-row"><span class="ol-from">${esc(m.folder === 'sent' ? 'To: ' + (m.toName || '') : m.from)}</span><time>${when(m.time)}</time></div>
        <div class="ol-subj">${m.replied ? `<span class="ol-tag" title="${m.replied}">${svg(m.replied === 'Forwarded' ? I.forward : I.reply)}</span>` : ''}${m.attach ? `<span class="ol-tag">${svg(I.clip)}</span>` : ''}${esc(m.subject)}</div>
        <div class="ol-prev">${esc(m.body.replace(/\s+/g, ' ').slice(0, 96))}</div></div></div>`).join('')
      || `<p class="ol-empty">${c.q ? 'No results. Try another word.' : 'Nothing in this folder.'}</p>`;
  }
  function read(c) {
    const pane = $(c, '.ol-read');
    if (c.compose) return compose(c, pane);
    const m = cur(c);
    pane.innerHTML = m ? `<article class="ol-msg">
        <div class="ol-mtop"><button class="ol-back" type="button" aria-label="Back to the list">${svg(I.back)}</button><h3>${esc(m.subject)}</h3></div>
        <div class="ol-mhead">${av(m.folder === 'sent' ? ME.name : m.from)}<div><b>${esc(m.folder === 'sent' ? ME.name : m.from)}</b> <small>${esc(m.folder === 'sent' ? 'To: ' + (m.toName || '') : `To: You${m.cc.length ? '; ' + m.cc.join('; ') : ''}`)}</small></div><time>${full(m.time)}</time></div>
        <div class="ol-acts"><button type="button" data-act="reply">${svg(I.reply)}Reply</button><button type="button" data-act="all">${svg(I.replyAll)}Reply all</button><button type="button" data-act="forward">${svg(I.forward)}Forward</button></div>
        ${m.attach ? `<div class="ol-att">${svg(I.clip)}${esc(m.attach)}</div>` : ''}
        <div class="ol-mbody">${m.body.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</div></article>`
      : `<div class="ol-none"><div>${svg(I.mail)}<p>Select an item to read.<br>Then hold the mouse anywhere, flick to Reply, let go.</p></div></div>`;
  }
  function compose(c, pane) {
    const d = c.compose;
    pane.innerHTML = `<form class="ol-compose" autocomplete="off">
        <div class="ol-cbar"><button class="ol-back" type="button" aria-label="Back to the list">${svg(I.back)}</button><button class="os-btn ol-send" type="submit">${svg(I.send)}Send</button><button class="os-btn" type="button" data-act="discard">Discard</button><small>Draft</small></div>
        <label class="ol-field"><span>To</span><input class="ol-to" name="to" aria-label="To"></label>
        <label class="ol-field"><span>Cc</span><input class="ol-cc" name="cc" aria-label="Cc"></label>
        <input class="ol-subjin" name="subject" placeholder="Add a subject" aria-label="Subject">
        <textarea class="ol-body" name="body" aria-label="Message" spellcheck="false"></textarea></form>`;
    const f = pane.querySelector('form');
    f.to.value = d.to; f.cc.value = d.cc; f.subject.value = d.subject; f.body.value = d.body;
    f.addEventListener('input', () => Object.assign(d, { to: f.to.value, cc: f.cc.value, subject: f.subject.value, body: f.body.value }));
    f.addEventListener('submit', e => { e.preventDefault(); send(c); });
    f.body.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); send(c); } });
    const el = d.focus === 'to' ? f.to : f.body;
    requestAnimationFrame(() => { el.focus({ preventScroll: true }); if (el === f.body) { f.body.setSelectionRange(d.caret, d.caret); f.body.scrollTop = 0; } });
  }
  function all(c) { folders(c); list(c); read(c); c.root.classList.toggle('is-reading', !!c.compose || c.reading); }

  // ---- What the ring does ----
  function pick(c, id, open) {
    c.sel = id; c.reading = !!open;
    if (!c.compose) read(c);
    list(c);
    c.root.classList.toggle('is-reading', !!c.compose || c.reading);
  }
  function need(c) {
    if (c.view !== 'mail') view(c, 'mail');
    const m = cur(c);
    if (!m) OS.toast('Outlook', 'Pick a message in the list first.', ICON);
    return m;
  }
  function reply(c, kind, template) {
    const m = need(c);
    if (!m) return;
    const sent = m.folder === 'sent';
    const quote = `\n\n\n________________________________\nFrom: ${sent ? ME.name : `${m.from} <${m.addr}>`}\nSent: ${full(m.time)}\nTo: ${sent ? m.toName : ME.name}\nSubject: ${m.subject}\n\n${m.body}`;
    const pre = kind === 'forward' ? 'FW: ' : 'RE: ';
    const subject = /^(re|fw):/i.test(m.subject) ? m.subject : pre + m.subject;
    const to = kind === 'forward' ? '' : sent ? m.toName : m.addr;
    const cc = kind === 'all' ? m.cc.join('; ') : '';
    // Reply + template: the text RadialDeck pastes, with the sender's first name filled in.
    const by = new Date(Date.now() + 2 * 864e5).toLocaleDateString([], { weekday: 'long' });
    const tpl = template ? `Hi ${first(sent ? m.toName : m.from)},\n\nThanks for your message. I'm on it and will get back to you by ${by}.\n\nBest regards,\n${first(ME.name)}` : '';
    c.compose = { kind, ref: m.id, to, cc, subject, body: tpl + quote, caret: tpl.length, focus: kind === 'forward' ? 'to' : 'body' };
    all(c);
  }
  function newMail(c) {
    if (c.view !== 'mail') view(c, 'mail');
    c.compose = { kind: 'new', to: '', cc: '', subject: '', body: `\n\n${first(ME.name)}`, caret: 0, focus: 'to' };
    all(c);
  }
  function send(c) {
    const d = c.compose;
    if (!d) return OS.toast('Send', 'Nothing to send yet: start a reply or a new mail.', ICON);
    if (!d.to.trim()) { $(c, '.ol-to')?.focus(); return OS.toast('Add a recipient', 'Type a name or address in To, then send.', ICON); }
    const ref = c.mails.find(m => m.id === d.ref);
    if (ref) ref.replied = d.kind === 'forward' ? 'Forwarded' : 'Replied';
    c.mails.push({ id: ++c.n, folder: 'sent', from: ME.name, addr: ME.addr, toName: d.to.trim(), cc: [], subject: d.subject.trim() || '(no subject)', time: new Date(), unread: false, body: d.body.trim() });
    c.compose = null;
    all(c);
    OS.toast('Sent', 'Nothing left this page: the inbox is pretend.', ICON);
  }
  function markRead(c) {
    const m = need(c);
    if (!m) return;
    m.unread = !m.unread;
    folders(c); list(c);
  }
  function archive(c) {
    const m = need(c);
    if (!m) return;
    if (m.folder === 'archive') return OS.toast('Archive', 'This one is already in Archive.', ICON);
    const items = shown(c), i = items.indexOf(m);
    m.folder = 'archive';
    const next = items[i + 1] || items[i - 1];
    c.sel = next ? next.id : null; c.reading = false;
    all(c);
    OS.toast('Archived', `"${m.subject}" moved to Archive.`, ICON);
  }
  function view(c, v) {
    c.view = v;
    c.root.classList.toggle('is-cal', v === 'cal');
    c.root.querySelectorAll('.ol-rail button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    if (v === 'cal') calendar(c);
  }
  function inbox(c) { c.folder = 'inbox'; c.q = ''; $(c, '.ol-search input').value = ''; view(c, 'mail'); all(c); }
  function calendar(c) {
    const day = c.day, y = day.getFullYear(), mo = day.getMonth(), today = new Date();
    const start = new Date(y, mo, 1); start.setDate(1 - (start.getDay() + 6) % 7);
    const off = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 864e5);
    let days = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      days += `<button type="button" data-day="${d.toDateString()}" class="${d.getMonth() !== mo ? 'is-out' : ''}${sameDay(d, today) ? ' is-today' : ''}${EVENTS[off(d)] ? ' has-ev' : ''}" aria-pressed="${sameDay(d, day)}" aria-label="${d.toDateString()}">${d.getDate()}</button>`;
    }
    const evs = EVENTS[off(day)] || [];
    $(c, '.ol-cal').innerHTML = `<div class="ol-month"><h4>${day.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h4>
        <div class="ol-days">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => `<span>${d}</span>`).join('')}${days}</div></div>
      <div class="ol-agenda"><h4>${day.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
        <div class="ol-hours">${Array.from({ length: 11 }, (_, h) => `<div>${String(h + 8).padStart(2, '0')}:00</div>`).join('')}
        ${evs.map(([h, len, t, where]) => `<div class="ol-ev" style="top:${(h - 8) * 44 + 1}px;height:${Math.max(22, len * 44 - 3)}px"><b>${esc(t)}</b><small>${esc(where)}</small></div>`).join('')}</div>
        ${evs.length ? '' : '<p class="ol-empty">Nothing planned. Enjoy the quiet.</p>'}</div>`;
  }

  OS.register({
    id: 'outlook',
    tint: '#479ef5',
    async render(body, c) {
      await css();
      Object.assign(c, { mails: seed(), n: 100, folder: 'inbox', sel: 1, view: 'mail', q: '', compose: null, reading: false, day: new Date() });
      body.innerHTML = `<div class="of ol">
        <div class="ol-top"><span class="ol-brand">Outlook</span><label class="ol-search">${svg(OS.icons.search)}<input type="search" placeholder="Search" aria-label="Search mail (Ctrl+E)"></label></div>
        <div class="ol-main">
          <nav class="ol-rail" aria-label="Apps"><button type="button" data-view="mail" aria-pressed="true" title="Mail (Ctrl+1)" aria-label="Mail">${svg(I.mail)}</button><button type="button" data-view="cal" aria-pressed="false" title="Calendar (Ctrl+2)" aria-label="Calendar">${svg(I.calendar)}</button></nav>
          <nav class="ol-folders" aria-label="Folders"></nav>
          <section class="ol-list" aria-label="Messages"><div class="ol-lhead"></div><div class="ol-items" role="listbox" aria-label="Messages"></div></section>
          <section class="ol-read" aria-label="Reading pane"></section>
          <section class="ol-cal" aria-label="Calendar"></section>
        </div>
        <div class="of-about"><span>The ring here is RadialDeck's Outlook ring. In Outlook each slice presses Outlook's own shortcut.</span><a href="for/outlook.html" target="_blank" rel="noopener">The Outlook ring →</a></div></div>`;
      c.root = body.querySelector('.ol');
      all(c);
      const items = $(c, '.ol-items');
      // A press selects at once, so a hold on a message acts on that message.
      items.addEventListener('pointerdown', e => { const it = e.target.closest('.ol-item'); if (it && e.pointerType === 'mouse' && +it.dataset.id !== c.sel) pick(c, +it.dataset.id); });
      items.addEventListener('click', e => { const it = e.target.closest('.ol-item'); if (it) pick(c, +it.dataset.id, true); });
      items.addEventListener('keydown', e => {
        const all_ = shown(c), i = all_.findIndex(m => m.id === c.sel);
        const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (step) { e.preventDefault(); const m = all_[Math.max(0, Math.min(all_.length - 1, i + step))]; if (m) { pick(c, m.id); items.querySelector(`[data-id="${m.id}"]`)?.focus(); } }
        if (e.key === 'Enter' && c.sel) pick(c, c.sel, true);
        if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); archive(c); }
      });
      c.root.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.folder) { c.folder = b.dataset.folder; c.sel = shown(c)[0]?.id ?? null; c.reading = false; return all(c); }
        if (b.dataset.view) return b.dataset.view === 'cal' ? view(c, 'cal') : inbox(c);
        if (b.dataset.day) { c.day = new Date(b.dataset.day); return calendar(c); }
        if (b.classList.contains('ol-back')) { c.reading = false; c.compose = null; return all(c); }
        ({ new: () => newMail(c), reply: () => reply(c, 'reply'), all: () => reply(c, 'all'), forward: () => reply(c, 'forward'), discard: () => { c.compose = null; all(c); } })[b.dataset.act]?.();
      });
      const q = $(c, '.ol-search input');
      q.addEventListener('input', () => { c.q = q.value; if (c.view !== 'mail') view(c, 'mail'); list(c); });
      q.addEventListener('keydown', e => { if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; c.q = ''; list(c); } });
      // Outlook's own keys for search: Ctrl+E and Alt+Q.
      c.root.addEventListener('keydown', e => { if ((e.ctrlKey && e.key.toLowerCase() === 'e') || (e.altKey && e.key.toLowerCase() === 'q')) { e.preventDefault(); q.focus(); q.select(); } });
    },
    // RadialDeck's Outlook ring (the gallery's "outlook" pack). Two slices follow what is on screen, as the
    // keys do in Outlook: New mail is Send while a draft is open, Calendar is Inbox while the calendar is.
    ring: c => [
      { label: 'Reply', icon: '↩', tint: '#7cc4ff', say: 'A nested ring: point at it and Reply, Reply all and Template come out as bubbles (Pro).', children: [
        { label: 'Reply', icon: '↩', tint: '#7cc4ff', say: 'Opens a reply to the selected mail, quoted. In Outlook: Ctrl+R.', run: c => reply(c, 'reply') },
        { label: 'Reply all', icon: '↩↩', tint: '#93c5fd', say: 'Replies to everyone on the mail. In Outlook: Ctrl+Shift+R.', run: c => reply(c, 'all') },
        { label: 'Reply + template', icon: '📋', tint: '#fdba74', say: 'Opens a reply and pastes your text. Edit the text after adding.', run: c => reply(c, 'reply', true) },
      ] },
      { label: 'Forward', icon: '➡', tint: '#a5b4fc', say: 'Forwards the mail with its text. In Outlook: Ctrl+F.', run: c => reply(c, 'forward') },
      c?.compose
        ? { label: 'Send', icon: '🚀', tint: '#6ee7a0', say: 'Sends the open message. In Outlook: Ctrl+Enter.', run: send }
        : { label: 'New mail', icon: '✉', tint: '#6ee7a0', say: 'A new, empty message. In Outlook: Ctrl+N.', run: newMail },
      { label: 'Mark read', icon: '✓', tint: '#5eead4', say: 'Marks the selected mail read, or unread again. In Outlook: Ctrl+Q.', run: markRead },
      c?.view === 'cal'
        ? { label: 'Inbox', icon: '📥', tint: '#ffd166', say: 'Back to the inbox. In Outlook: Ctrl+1.', run: inbox }
        : { label: 'Calendar', icon: '📅', tint: '#ffd166', say: 'Goes to the calendar. In Outlook: Ctrl+2.', run: c => view(c, 'cal') },
      { label: 'Archive', icon: '🗄', tint: '#c4a1ff', say: 'Moves the selected mail to Archive. In Outlook: Backspace in the list.', run: archive },
    ],
  });
})();
