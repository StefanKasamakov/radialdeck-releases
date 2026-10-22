/* Start here: what a first-time visitor needs, on every page (eager).
   - The "Start here" window: what RadialDeck is, the gesture in three tiny live demos, where to get it. It opens by
     itself once, on the first visit to the home page; after that it is a desktop icon and a taskbar button.
   - The 30-second tour (RDGuide.tour): drives the real ring on the desktop, in Excel and in File Explorer.
   - A first-time hint on every window: how to open that window's ring, and what is Pro on a real PC.
   - The trick of the day: a small card on the desktop that opens the Tricks app (os/apps/tricks.json).
   - RDGuide.tryRing('excel:Paste values'): opens an app with its ring and lights that slice (Tricks' "Try it").
   All of it is desktop only; the phone home screen has its own first screen. */
(() => {
  const STORE = 'https://radialdeck.com/store?cid=start';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('rd-os:' + k)); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem('rd-os:' + k, JSON.stringify(v)); } catch (_) { } },
  };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const sleep = ms => new Promise(ok => setTimeout(ok, ms));
  const $ = (s, r = document) => r.querySelector(s);
  // The programs on this desktop that stand for real ones (a ring per program is Pro on a real PC).
  const PROGRAMS = new Set(['excel', 'outlook', 'word', 'teams', 'cad', 'photo', 'code', 'terminal', 'browser', 'explorer', 'notepad', 'music']);
  const NO_HINT = new Set(['welcome', 'download', 'privacy', 'terms', 'refund', 'bin']);

  // The window opens on the right on a wide screen, so the ring and the headline stay in view beside it.
  if (!OS.phone && innerWidth >= 1100 && !store.get('win:welcome')) {
    const h = Math.min(664, innerHeight - 48 - 24);
    store.set('win:welcome', { x: innerWidth - 440 - 24, y: 12, w: 440, h, max: false });
  }

  // A tiny ring for the three steps: 8 slices in a 64 x 64 box.
  function mini(step) {
    const p = (r, a) => [32 + r * Math.cos(a), 32 + r * Math.sin(a)].map(v => v.toFixed(2)).join(' ');
    const slices = Array.from({ length: 8 }, (_, i) => {
      const a0 = (i * 45 - 90 - 21) * Math.PI / 180, a1 = (i * 45 - 90 + 21) * Math.PI / 180;
      return `<path class="${i === 1 ? 'wl-hot' : ''}" d="M${p(12, a0)} L${p(28, a0)} A28 28 0 0 1 ${p(28, a1)} L${p(12, a1)} A12 12 0 0 0 ${p(12, a0)}Z"/>`;
    }).join('');
    return `<svg class="wl-mini wl-${step}" viewBox="0 0 64 64" aria-hidden="true"><g class="wl-ring">${slices}</g><circle class="wl-dot" cx="32" cy="32" r="3.6"/></svg>`;
  }

  const appBtn = id => { const a = OS.apps.get(id); return a ? `<button class="wl-app" type="button" data-app-open="${id}"><img src="${esc(a.icon)}" alt="" width="20" height="20">${esc(a.title)}</button>` : ''; };

  OS.register({
    id: 'welcome',
    tint: '#fdba74',
    render(body) {
      body.innerHTML = `<div class="wl">
        <header class="wl-head"><img src="assets/icon.png" alt="" width="48" height="48"><div><h2>RadialDeck</h2><p>A radial menu for Windows 10 and 11</p></div></header>
        <p class="wl-lead">Hold the mouse, flick toward an action, let go. A ring of actions opens right under your pointer, and it changes with the program you are in.</p>
        <p class="wl-note">This page is a pretend Windows desktop. <b>The ring on it is real.</b> Try it anywhere.</p>
        <ol class="wl-steps">
          <li>${mini('hold')}<b>Hold</b><span>Press and hold a mouse button, anywhere.</span></li>
          <li>${mini('flick')}<b>Flick</b><span>Move toward an action. It lights up.</span></li>
          <li>${mini('go')}<b>Let go</b><span>It runs. That is the whole gesture.</span></li>
        </ol>
        <div class="wl-apps"><p><b>It knows your app.</b> Open one, then hold the mouse inside it:</p><div>${['excel', 'outlook', 'explorer', 'cad'].map(appBtn).join('')}</div></div>
        <div class="wl-cta">
          <button class="os-btn os-btn-primary" type="button" data-tour>${OS.svg(OS.icons.ring)}Take the 30-second tour</button>
          <a class="store-badge" href="${STORE}"><img src="assets/ms-store-badge.svg" alt="Get it free from Microsoft" width="140" height="40"></a>
        </div>
        <p class="wl-links"><a href="features.html">See what it does</a><a href="tricks.html">Tricks people miss</a><a href="pro.html">Free or Pro?</a></p>
        <ul class="wl-facts"><li><b>1,400+</b>ready-made actions</li><li><b>38</b>themes</li><li><b>14</b>languages</li><li><b>No</b>account, no telemetry</li></ul>
        <p class="wl-fine">Free for two rings, forever. Pro is 24 € a year, with a 14-day trial.</p>
      </div>`;
      body.querySelector('.wl-apps').addEventListener('click', e => { const b = e.target.closest('[data-app-open]'); if (b) OS.open(b.dataset.appOpen); });
    },
    ring: [
      { label: 'Tour', icon: 'ring', tint: '#fdba74', say: 'Thirty seconds: the ring on the desktop, in Excel and in File Explorer.', run: () => tour() },
      { label: 'Get it free', icon: 'download', tint: '#4cc2ff', say: 'RadialDeck in the Microsoft Store. Free for two rings.', run: () => location.assign(STORE) },
      { label: 'What it does', icon: 'zap', tint: '#7cc4ff', say: 'Every feature, each with a demo.', run: () => OS.open('features') },
      { label: 'Tricks', icon: 'hand', tint: '#f9a8d4', say: 'Shortcuts most people never find, one flick away.', run: () => OS.open('tricks') },
      { label: 'Excel', icon: 'img:assets/apps/excel.png', tint: '#6ee7a0', say: "Open Excel and hold the mouse in it: Excel's ring.", run: () => OS.open('excel') },
      { label: 'Explorer', icon: 'file', tint: '#ffd166', say: 'Files get their own ring: shrink, convert, copy the path.', run: () => OS.open('explorer') },
      { label: 'Pro', icon: 'shield', tint: '#c4b5fd', say: 'What is free, what Pro adds, and the price.', run: () => OS.open('pro') },
      { label: 'Close', icon: 'close', tint: '#ff6b6b', say: 'Closes this window. Start here stays on the desktop.', run: c => c?.close() },
    ],
  });

  // ---- Open an app with its ring, one slice lit (Tricks' "Try it", the tour) ----
  const sliceOf = label => label ? OS.ring.slices.findIndex(s => s.label === label) : -1;
  function minimizeAll() { document.querySelectorAll('.win:not(.is-min):not(.is-closing)').forEach(w => OS.minimize(w.dataset.app)); }
  async function tryRing(spec) {
    const [id, label] = spec.split(':');
    if (id === 'desktop') {
      minimizeAll();
      await sleep(450);
      const i = sliceOf(label);
      if (i >= 0) OS.ring.setHot(i);
      return;
    }
    const c = await OS.open(id);
    if (!c) return;
    await sleep(450);
    c.el.querySelector('.win-ringbtn')?.click();
    if (label) { await sleep(420); const i = sliceOf(label); if (i >= 0) OS.ring.setHot(i); }
  }
  // Closes a ring opened by a button (sticky), the way Esc does.
  const escRing = () => dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  // ---- The tour: about 30 seconds, the real ring, Skip or Esc any time ----
  let touring = false;
  async function tour() {
    if (touring || OS.phone) return;
    touring = true;
    store.set('toured', 1);
    const card = document.createElement('div');
    card.className = 'gd-tour';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Tour');
    card.dataset.noRing = '';
    card.innerHTML = `<div class="gd-dots">${'<i></i>'.repeat(5)}</div><p class="gd-text" aria-live="polite"></p><div class="gd-btns"><button class="os-btn gd-skip" type="button">Skip tour</button></div>`;
    document.body.append(card);
    requestAnimationFrame(() => card.classList.add('is-on'));
    let stop = false;
    const wait = async ms => { await sleep(ms); if (stop) throw new Error('stopped'); };
    const say = (n, text) => { card.querySelector('.gd-text').innerHTML = text; card.querySelectorAll('.gd-dots i').forEach((d, i) => d.classList.toggle('is-on', i <= n)); };
    const quit = e => { if (e.type === 'click' || (e.key === 'Escape' && e.isTrusted)) stop = true; };
    card.querySelector('.gd-skip').addEventListener('click', quit);
    addEventListener('keydown', quit);
    const done = () => { removeEventListener('keydown', quit); card.classList.remove('is-on'); setTimeout(() => card.remove(), 300); touring = false; };
    try {
      OS.close('welcome'); minimizeAll();
      say(0, '<b>This is the ring.</b> On your PC it opens right where your mouse is, over any program.');
      await wait(900);
      for (let i = 0; i < 8; i++) { OS.ring.setHot(i); await wait(260); }
      say(1, '<b>Flick to an action and let go: it runs.</b> Here, Screen text copies the words on your screen.');
      OS.ring.setHot(6); await wait(1600);
      OS.ring.fire(6); await wait(1800);
      OS.ring.setHot(-1);
      say(2, "<b>The same gesture in Excel brings Excel's ring.</b> AutoSum adds up the selected cells.");
      await tryRing('excel:AutoSum'); await wait(1700);
      if (OS.ring.hot >= 0) OS.ring.fire(OS.ring.hot);
      await wait(1600);
      say(3, '<b>In File Explorer it works on the file you selected.</b> A PDF gets Shrink PDF, a photo gets Convert, any file gets Copy path.');
      const x = await OS.open('explorer');
      await wait(600);
      // Select a PDF the way a click does (Explorer selects on pointerdown), then open the ring over it.
      const f = [...x.el.querySelectorAll('.xp-f')].find(e => /\.pdf/i.test(e.textContent)) || x.el.querySelector('.xp-f');
      if (f) {
        const b = f.getBoundingClientRect(), o = { bubbles: true, button: 0, clientX: b.x + 12, clientY: b.y + 12, pointerId: 9 };
        f.dispatchEvent(new PointerEvent('pointerdown', o)); dispatchEvent(new PointerEvent('pointerup', o));
      }
      await wait(400);
      x.el.querySelector('.win-ringbtn')?.click();
      await wait(500);
      for (let i = 0; i < Math.min(8, OS.ring.slices.length); i++) { OS.ring.setHot(i); await wait(260); }
      const shrink = OS.ring.slices.findIndex(s => /shrink|compress/i.test(s.label));
      if (shrink >= 0) OS.ring.setHot(shrink);
      await wait(1600); escRing();
      say(4, '<b>Your turn:</b> hold the mouse anywhere, flick, let go. Free gives you two rings and almost every action; Pro adds a ring per program, macros and the drop ring.');
      card.querySelector('.gd-btns').innerHTML = `<a class="os-btn os-btn-primary" href="${STORE}">Get it free · Microsoft Store</a><button class="os-btn gd-skip" type="button">Done</button>`;
      touring = false;
      await new Promise(ok => { card.querySelector('.gd-skip').addEventListener('click', ok); addEventListener('keydown', e => { if (e.key === 'Escape' && e.isTrusted) ok(); }, { once: true }); });
    } catch (_) {
      if (OS.ring.held || document.activeElement === OS.ring.el) escRing();
      OS.ring.setHot(-1);
    }
    done();
  }
  document.addEventListener('click', e => { const t = e.target.closest('[data-tour]'); if (t) { e.preventDefault(); tour(); } });

  // ---- The first time a window opens: how to reach its ring here, and what that is on a real PC ----
  addEventListener('os:open', e => {
    const c = e.detail;
    if (OS.phone || touring || NO_HINT.has(c.id) || store.get('hint:' + c.id)) return;
    store.set('hint:' + c.id, 1);
    const pro = PROGRAMS.has(c.id) ? ` <span class="gd-pro">On your PC, a ring for each program is <span class="tag tag-pro">Pro</span>. Free gives you two rings.</span>` : '';
    c.el.insertAdjacentHTML('beforeend', `<div class="gd-hint" role="note" data-no-ring>
      <span class="gd-hint-ico">${OS.svg(OS.icons.ring)}</span>
      <p><b>This window has its own ring.</b> Hold the mouse anywhere in it, flick, let go.${pro}</p>
      <button class="os-btn gd-show" type="button">Show me</button>
      <button class="gd-x" type="button" aria-label="Got it" title="Got it">${OS.svg(OS.icons.close)}</button></div>`);
    const hint = c.el.querySelector('.gd-hint');
    const off = () => { hint.classList.add('is-off'); setTimeout(() => hint.remove(), 250); };
    hint.querySelector('.gd-x').addEventListener('click', off);
    hint.querySelector('.gd-show').addEventListener('click', () => { off(); c.el.querySelector('.win-ringbtn')?.click(); });
    c.el.querySelector('.win-ringbtn')?.addEventListener('click', off, { once: true });
    setTimeout(() => hint.isConnected && off(), 20000);
  });

  // ---- The trick of the day: bottom right, under the reels, out of the ring's and the icons' way ----
  async function trickOfTheDay() {
    const day = new Date().toISOString().slice(0, 10);
    if (OS.phone || store.get('tod-off') === day) return;
    const list = await fetch('os/apps/tricks.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (!list?.length) return;
    const t = list[Math.floor(Date.now() / 864e5) % list.length];
    const el = document.createElement('aside');
    el.className = 'gd-tod';
    el.setAttribute('aria-label', 'Trick of the day');
    el.dataset.noRing = '';
    el.innerHTML = `<button class="gd-tod-open" type="button"><small>Trick of the day</small><b>${esc(t.title)}</b><span>${esc(t.problem)}</span><em>See the trick →</em></button>`
      + `<button class="gd-x" type="button" aria-label="Hide until tomorrow" title="Hide until tomorrow">${OS.svg(OS.icons.close)}</button>`;
    el.querySelector('.gd-tod-open').addEventListener('click', () => OS.open('tricks', { hash: 't-' + t.id }));
    el.querySelector('.gd-x').addEventListener('click', () => { store.set('tod-off', day); el.remove(); });
    document.body.append(el);
  }

  // ---- First visit to the home page: Start here opens by itself, once. A deep link came for something else. ----
  addEventListener('load', () => setTimeout(() => {
    trickOfTheDay();
    if (OS.phone || store.get('seen')) return;
    if (document.body.dataset.open || new URLSearchParams(location.search).get('app') || location.hash) return;
    store.set('seen', 1);
    OS.open('welcome');
  }, 600));

  window.RDGuide = { tour, tryRing };
})();
