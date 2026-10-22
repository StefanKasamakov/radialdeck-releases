/* Teams: a pretend meeting. Its ring is RadialDeck's Teams ring from the gallery (teams-*, x-microsoft-teams-*):
   mute, camera, raise hand, share screen, leave, new chat, search, admit from the lobby. No camera or microphone
   is touched: "camera on" is a drawing. */
(() => {
  const ICON = 'assets/apps/teams.png';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const css = () => document.querySelector('link[href="os/apps/office.css"]') ? null
    : new Promise(ok => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'os/apps/office.css', onload: ok, onerror: ok })));
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    micOff: '<path d="M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 5.1 2.1M19 10v2a7 7 0 0 1-.1 1.2M5 10v2a7 7 0 0 0 12 5M12 19v3M2 2l20 20"/>',
    cam: '<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    camOff: '<path d="M10.7 6H14a2 2 0 0 1 2 2v3.3l1 1L22 8v8M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M2 2l20 20"/>',
    hand: OS.icons.hand,
    share: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M9 10l3-3 3 3M12 7v6"/>',
    leave: '<path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-3.3-2.6M5.2 13.2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9M22 2 2 22"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h8M16 6h6M19 3v6"/>',
    search: OS.icons.search,
    admit: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    people: OS.icons.users,
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    teams: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    close: OS.icons.close,
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  };
  const hue = s => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  const initials = s => s.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = name => `<span class="of-av" style="--h:${hue(name)}">${esc(initials(name))}</span>`;
  // Made-up colleagues. One is already talking, one waits in the lobby.
  const PEOPLE = [['Dana Whitfield', true], ['Priya Nair', false, true], ['Marco Bellini', true], ['Lena Hoffmann', false], ['Jonas Berg', true]];
  const LOBBY = 'Sam Okafor';

  function tile(name, { muted, talk, you } = {}) {
    return `<div class="tm-tile${talk ? ' is-talk' : ''}${you ? ' is-you' : ''}" data-name="${esc(name)}">${av(name)}<div class="tm-cam"></div>
      <span class="tm-hand">${svg(I.hand)}</span><span class="tm-name">${muted ? svg(I.micOff) : ''}${esc(you ? 'You' : name)}</span></div>`;
  }
  function you(c) {
    const t = c.root.querySelector('.is-you');
    t.classList.toggle('is-cam', c.cam);
    t.classList.toggle('is-hand', c.hand);
    t.querySelector('.tm-name').innerHTML = (c.muted ? svg(I.micOff) : '') + 'You';
    const set = (act, on, icon, label) => { const b = c.root.querySelector(`.tm-bar [data-act="${act}"]`); b.setAttribute('aria-pressed', String(on)); b.innerHTML = svg(icon) + label; };
    set('mute', !c.muted, c.muted ? I.micOff : I.mic, 'Mic');
    set('cam', c.cam, c.cam ? I.cam : I.camOff, 'Camera');
    set('hand', c.hand, I.hand, c.hand ? 'Lower' : 'Raise');
    set('share', c.sharing, I.share, c.sharing ? 'Stop' : 'Share');
    // Who raised a hand goes first, as in Teams.
    if (c.hand) t.parentElement.prepend(t);
  }
  function pill(c, text) {
    const p = c.root.querySelector('.of-pill');
    p.textContent = text; p.classList.add('is-on');
    clearTimeout(c.pillT); c.pillT = setTimeout(() => p.classList.remove('is-on'), 2400);
  }
  const live = c => { if (c.left) { pill(c, 'You left this meeting. Rejoin first.'); return false; } return true; };

  // ---- What the ring does ----
  function mute(c) { if (!live(c)) return; c.muted = !c.muted; you(c); pill(c, c.muted ? 'Your mic is off.' : 'Your mic is on.'); }
  function cam(c) { if (!live(c)) return; c.cam = !c.cam; you(c); pill(c, c.cam ? 'Your camera is on (a drawing: no camera is used).' : 'Your camera is off.'); }
  function hand(c) { if (!live(c)) return; c.hand = !c.hand; you(c); pill(c, c.hand ? 'You raised your hand.' : 'You lowered your hand.'); }
  function share(c) {
    if (!live(c)) return;
    c.sharing = !c.sharing;
    c.root.classList.toggle('is-sharing', c.sharing);
    you(c);
    pill(c, c.sharing ? 'You are presenting your screen.' : 'You stopped presenting.');
  }
  function leave(c) {
    if (c.left) return pill(c, 'You already left. Rejoin to go back in.');
    c.left = true; c.sharing = false;
    c.root.classList.remove('is-sharing');
    c.root.querySelector('.tm-left p').textContent = `Meeting time ${clock(c)}`;
    c.root.classList.add('is-left');
    c.root.querySelector('.tm-left button').focus();
  }
  function rejoin(c) { c.left = false; c.root.classList.remove('is-left'); you(c); pill(c, 'You are back in the meeting.'); }
  function chat(c) {
    const side = c.root.querySelector('.tm-side');
    side.hidden = false;
    // After the ring has gone home (it gives the window its focus back first).
    requestAnimationFrame(() => side.querySelector('.tm-to input').focus());
  }
  function search(c) {
    const q = c.root.querySelector('.tm-search input');
    requestAnimationFrame(() => { q.focus(); q.select(); hits(c); });
  }
  function hits(c) {
    const q = c.root.querySelector('.tm-search input'), box = c.root.querySelector('.tm-hits'), t = q.value.trim().toLowerCase();
    const names = [...PEOPLE.map(p => p[0]), LOBBY].filter(n => !t || n.toLowerCase().includes(t));
    box.hidden = document.activeElement !== q;
    box.innerHTML = names.length ? names.map(n => `<div>${av(n)}${esc(n)}</div>`).join('') : '<p>No people match. Messages and files are not searched in this pretend Teams.</p>';
  }
  function admit(c) {
    if (!live(c)) return;
    if (!c.lobby) return pill(c, 'Nobody is waiting in the lobby.');
    c.lobby = false;
    c.root.querySelector('.tm-lobby').hidden = true;
    c.root.querySelector('.tm-tiles').insertAdjacentHTML('beforeend', tile(LOBBY));
    pill(c, `${LOBBY} joined.`);
  }
  const clock = c => { const s = Math.floor((Date.now() - c.t0) / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

  OS.register({
    id: 'teams',
    tint: '#7f85f5',
    async render(body, c) {
      await css();
      Object.assign(c, { muted: false, cam: false, hand: false, sharing: false, left: false, lobby: true, t0: Date.now() - (12 * 60 + 4) * 1000 });
      body.innerHTML = `<div class="of tm">
        <div class="tm-top"><b>Teams</b><label class="tm-search">${svg(I.search)}<input type="search" placeholder="Search people" aria-label="Search (Ctrl+E)"><div class="tm-hits" hidden></div></label></div>
        <div class="tm-main">
          <nav class="tm-rail" aria-hidden="true"><span>${svg(I.bell)}Activity</span><span>${svg(I.chat)}Chat</span><span>${svg(I.teams)}Teams</span><span class="is-on">${svg(I.calendar)}Calendar</span></nav>
          <section class="tm-meet os-dark" aria-label="Meeting">
            <div class="tm-bar"><h3>Weekly design sync<small class="tm-clock">12:04</small></h3>
              <button type="button" class="tm-opt" data-act="chat">${svg(I.chat)}Chat</button><button type="button" class="tm-opt" data-act="people">${svg(I.people)}People</button>
              <button type="button" data-act="hand">${svg(I.hand)}Raise</button><button type="button" data-act="cam">${svg(I.camOff)}Camera</button><button type="button" data-act="mute">${svg(I.mic)}Mic</button><button type="button" data-act="share">${svg(I.share)}Share</button>
              <button type="button" class="tm-leave" data-act="leave">${svg(I.leave)}Leave</button></div>
            <div class="tm-lobby"><span><b>${LOBBY}</b> is waiting in the lobby.</span><button type="button" data-act="admit">Admit</button></div>
            <div class="tm-stage">
              <div class="tm-share" aria-label="Your shared screen"><header><span>You're presenting: Q4 roadmap</span><button type="button" data-act="share">Stop presenting</button></header>
                <div class="tm-slide"><h4>Q4 roadmap: what ships when</h4><div class="tm-bars"><i style="height:45%"></i><i style="height:70%"></i><i style="height:55%"></i><i style="height:90%"></i><i style="height:62%"></i></div></div></div>
              <div class="tm-tiles">${tile('Alex Morgan', { you: true })}${PEOPLE.map(([n, m, t]) => tile(n, { muted: m, talk: t })).join('')}</div>
            </div>
            <div class="tm-left"><h3>You left the meeting</h3><p></p><button class="os-btn" type="button" data-act="rejoin">Rejoin</button></div>
          </section>
          <aside class="tm-side" hidden aria-label="New chat"><header><span>New chat</span><button type="button" data-act="closechat" aria-label="Close">${svg(I.close)}</button></header>
            <label class="tm-to"><span>To:</span><input placeholder="Enter a name" aria-label="To"></label>
            <div class="tm-chat"><em>Messages you send here stay on this page.</em></div>
            <form class="tm-say"><input placeholder="Type a message" aria-label="Message"><button type="submit" aria-label="Send">${svg(I.send)}</button></form></aside>
        </div>
        <div class="of-about"><span>The ring here is RadialDeck's Teams ring. In Teams each slice presses Teams' own keys.</span><a href="for/teams.html" target="_blank" rel="noopener">The Teams ring →</a></div>
        <div class="of-pill" role="status" aria-live="polite"></div></div>`;
      c.root = body.querySelector('.tm');
      you(c);
      c.tick = setInterval(() => { if (!c.left) c.root.querySelector('.tm-clock').textContent = clock(c); }, 1000);
      c.root.addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        ({ mute, cam, hand, share, leave, rejoin, chat, admit,
          people: () => pill(c, `${c.root.querySelectorAll('.tm-tile').length} people in the meeting${c.lobby ? ', 1 in the lobby' : ''}.`),
          closechat: () => { c.root.querySelector('.tm-side').hidden = true; } })[b.dataset.act](c);
      });
      c.root.querySelector('.tm-say').addEventListener('submit', e => {
        e.preventDefault();
        const inp = e.target.querySelector('input'), log = c.root.querySelector('.tm-chat');
        if (!inp.value.trim()) return;
        log.querySelector('em')?.remove();
        log.insertAdjacentHTML('beforeend', `<p>${esc(inp.value.trim())}</p>`);
        inp.value = '';
      });
      const q = c.root.querySelector('.tm-search input');
      q.addEventListener('input', () => hits(c));
      q.addEventListener('focus', () => hits(c));
      q.addEventListener('blur', () => setTimeout(() => { c.root.querySelector('.tm-hits').hidden = true; }, 150));
      q.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); q.value = ''; q.blur(); } });
      // Teams' own keys, the ones the ring presses in the real app.
      c.root.addEventListener('keydown', e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        const fn = e.shiftKey ? { KeyM: mute, KeyO: cam, KeyK: hand, KeyH: leave }[e.code] : e.code === 'KeyE' ? search : null;
        if (fn) { e.preventDefault(); fn(c); }
      });
    },
    onClose(c) { clearInterval(c.tick); },
    // RadialDeck's Teams ring. Mute and Camera show the state they will switch from.
    ring: c => [
      { label: 'Mute', icon: '🎙', tint: '#ff6b6b', say: 'Mutes or unmutes your mic. In Teams: Ctrl+Shift+M.', run: mute },
      { label: 'Camera', icon: '📷', tint: '#7cc4ff', say: 'Camera on or off. In Teams: Ctrl+Shift+O.', run: cam },
      { label: 'Raise hand', icon: '✋', tint: '#ffd166', say: 'Raises or lowers your hand. In Teams: Ctrl+Shift+K.', run: hand },
      { label: 'Share screen', icon: '🖥', tint: '#5eead4', say: 'Starts or stops sharing your screen.', run: share },
      { label: 'Leave', icon: '🚪', tint: '#ff7a7a', say: 'Leaves the meeting. In Teams: Ctrl+Shift+H.', run: leave },
      { label: 'New chat', icon: 'fluent:E710', tint: '#a5b4fc', say: 'Starts a new chat.', run: chat },
      { label: 'Search', icon: '🔍', tint: '#c4a1ff', say: 'Goes to the search box. In Teams: Ctrl+E.', run: search },
      { label: 'Admit', icon: 'fluent:E8FB', tint: '#6ee7a0', say: 'Lets in the people waiting in the lobby.', run: admit },
    ],
  });
})();
