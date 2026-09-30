// Icon studio: draws a slice icon on a canvas and hands it over as a PNG. Nothing leaves the browser
// except when the visitor chooses to open GitHub; community icons are read from a public repository.
(() => {
  const REPO = 'StefanKasamakov/radialdeck-themes';
  const SIZE = 256;

  const $ = (id) => document.getElementById(id);
  const big = $('icon-canvas');
  const smallDark = $('icon-dark');
  const smallLight = $('icon-light');
  const status = $('icon-status');

  const EMOJI = ['🚀', '⚡', '🔥', '⭐', '✅', '⚙️', '🔧', '🔑', '🛡️', '📁', '📋', '✂️', '✉️', '📅', '📞', '💬', '🔍', '🌐', '💾',
    '💻', '🖨️', '🎮', '🎧', '🎵', '📷', '🎨', '📝', '📊', '💰', '🏢', '🏗️', '🏠', '🚗', '🤖', '🧠', '💡', '🎯', '☕', '👋', '🙏'];
  // The same code points as the application's own symbol picker.
  const SYMBOLS = ['E8B7', 'E8E5', 'E8A5', 'E74E', 'E8C8', 'E77F', 'E756', 'E713', 'E90F', 'E7BA', 'E715', 'E787', 'E77B', 'E716',
    'E717', 'E8BD', 'E724', 'E721', 'E710', 'E74D', 'E72E', 'E8D7', 'E72D', 'E71B', 'E774', 'E768', 'E769', 'E767', 'E720', 'E722',
    'E91B', 'E7F4', 'E80F', 'E734', 'EB51', 'E718', 'E7E7', 'E72C', 'E8B5', 'E898', 'E7B8', 'E706', 'E8E2', 'E943', 'ECAA', 'E9D9',
    'E8C9', 'E83D', 'E968', 'E8A4', 'E82D'];

  const state = {
    kind: 'letters',
    text: 'RD',
    font: '700 {s}px Outfit',
    emoji: '🚀',
    symbol: 'E8B7',
    picture: null,
    shape: 'round',
    bg1: '#3b82f6',
    bg2: '#8b5cf6',
    gradient: true,
    fg: '#ffffff',
    scale: 0.58,
    outline: false,
  };

  // Whether the Windows symbol font is installed here: a private-use code point measures the same as the
  // fallback when it is not.
  const symbolFont = (() => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '40px monospace';
    const fallback = c.measureText('').width;
    for (const f of ['Segoe Fluent Icons', 'Segoe MDL2 Assets']) {
      c.font = `40px "${f}", monospace`;
      if (Math.abs(c.measureText('').width - fallback) > 0.5) return f;
    }
    return null;
  })();

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shapePath(ctx, s) {
    const inset = s * 0.04;
    const w = s - inset * 2;
    if (state.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w / 2, 0, Math.PI * 2);
      return true;
    }
    if (state.shape === 'round') { roundedRect(ctx, inset, inset, w, w, w * 0.22); return true; }
    if (state.shape === 'squircle') { roundedRect(ctx, inset, inset, w, w, w * 0.36); return true; }
    return false;
  }

  function draw(canvas) {
    const s = canvas.width;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, s, s);

    if (shapePath(ctx, s)) {
      if (state.gradient) {
        const g = ctx.createLinearGradient(0, 0, s, s);
        g.addColorStop(0, state.bg1);
        g.addColorStop(1, state.bg2);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = state.bg1;
      }
      ctx.fill();
      if (state.outline) {
        ctx.lineWidth = Math.max(1, s * 0.025);
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.stroke();
      }
    }

    const mark = s * state.scale;
    ctx.fillStyle = state.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state.kind === 'picture') {
      if (!state.picture) return;
      const img = state.picture;
      const k = Math.min(mark / img.width, mark / img.height);
      const w = img.width * k;
      const h = img.height * k;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      return;
    }

    let text;
    let font;
    if (state.kind === 'emoji') {
      text = state.emoji || '🚀';
      font = `${mark * 0.9}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    } else if (state.kind === 'symbol') {
      text = String.fromCharCode(parseInt(state.symbol, 16));
      font = `${mark}px "${symbolFont || 'Segoe Fluent Icons'}"`;
    } else {
      text = (state.text || '?').trim().slice(0, 3);
      // Longer text gets a smaller size so three letters sit in the same box as one.
      const size = mark * (text.length <= 1 ? 1 : text.length === 2 ? 0.78 : 0.6);
      font = state.font.replace('{s}', size.toFixed(1));
    }
    ctx.font = font;
    // Centre on the glyphs' real ink, not the font's line box, so letters do not sit high.
    const m = ctx.measureText(text);
    const up = m.actualBoundingBoxAscent || 0;
    const down = m.actualBoundingBoxDescent || 0;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, s / 2, s / 2 + (up - down) / 2);
  }

  function slug() {
    const name = ($('icon-name').value || 'My icon').trim().toLowerCase();
    return name.replace(/[^a-z0-9Ѐ-ӿ]+/g, '-').replace(/^-+|-+$/g, '') || 'my-icon';
  }

  function render() {
    draw(big);
    draw(smallDark);
    draw(smallLight);
    const label = ($('icon-name').value || 'My slice').trim();
    $('icon-label-dark').textContent = label;
    $('icon-label-light').textContent = label;
    $('icon-filename').textContent = `${slug()}.png`;
    $('icon-scale-out').textContent = `${Math.round(state.scale * 100)}%`;
  }

  function download(then) {
    big.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${slug()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      status.textContent = `Saved ${slug()}.png. Drop it on the icon window in RadialDeck.`;
      if (then) then();
    }, 'image/png');
  }

  // ---- controls ------------------------------------------------------------------------------
  document.querySelectorAll('.icon-tabs button').forEach((b) => b.addEventListener('click', () => {
    state.kind = b.dataset.kind;
    document.querySelectorAll('.icon-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('.icon-pane').forEach((p) => { p.hidden = p.dataset.pane !== state.kind; });
    render();
  }));

  const bind = (id, key, map = (v) => v, ev = 'input') => $(id).addEventListener(ev, (e) => {
    state[key] = map(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    render();
  });
  bind('icon-text', 'text');
  bind('icon-font', 'font', String, 'change');
  bind('icon-emoji', 'emoji');
  bind('icon-shape', 'shape', String, 'change');
  bind('icon-bg1', 'bg1');
  bind('icon-bg2', 'bg2');
  bind('icon-gradient', 'gradient', Boolean, 'change');
  bind('icon-fg', 'fg');
  bind('icon-scale', 'scale', (v) => Number(v) / 100);
  bind('icon-outline', 'outline', Boolean, 'change');
  $('icon-name').addEventListener('input', render);

  const emojiPicks = $('emoji-picks');
  emojiPicks.innerHTML = EMOJI.map((e) => `<button type="button" data-e="${e}" aria-label="${e}">${e}</button>`).join('');
  emojiPicks.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.emoji = b.dataset.e;
    $('icon-emoji').value = state.emoji;
    render();
  });

  const symbolPicks = $('symbol-picks');
  if (symbolFont) {
    symbolPicks.innerHTML = SYMBOLS.map((c) => `<button type="button" data-c="${c}" aria-pressed="${c === state.symbol}" aria-label="symbol ${c}">&#x${c};</button>`).join('');
    symbolPicks.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.symbol = b.dataset.c;
      symbolPicks.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
  } else {
    $('symbol-note').textContent = 'The Windows symbols draw only on a Windows PC, because their font ships with Windows. On this device, use letters, an emoji or your own picture.';
    $('tab-symbol').disabled = true;
    $('tab-symbol').style.opacity = '.45';
  }

  $('icon-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => { state.picture = img; render(); };
    img.src = URL.createObjectURL(file);
  });

  $('icon-download').addEventListener('click', () => download());
  $('icon-share').addEventListener('click', () => download(() => {
    status.textContent = `Saved ${slug()}.png. On the GitHub page that opened, drag it in and choose Propose changes.`;
    window.open(`https://github.com/${REPO}/upload/main/icons`, '_blank', 'noopener');
  }));

  // Web fonts arrive after the first paint; draw again once they have.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();

  // ---- community icons ---------------------------------------------------------------------
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grid = $('community-grid');
  fetch(`https://api.github.com/repos/${REPO}/contents/icons`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((files) => {
      const icons = files.filter((f) => /\.(png|ico|jpe?g|gif|bmp)$/i.test(f.name));
      if (!icons.length) return;
      document.getElementById('community').classList.add('has-themes');
      grid.innerHTML = icons.map((f) => {
        const name = esc(f.name.replace(/\.[^.]+$/, ''));
        const raw = `https://raw.githubusercontent.com/${REPO}/main/icons/${encodeURIComponent(f.name)}`;
        return `<figure class="gal icon-gal">
          <img src="${raw}" alt="${name}" loading="lazy" width="170" height="170">
          <figcaption><b>${name}</b><code>community</code></figcaption>
          <button class="gal-use" type="button" data-src="${raw}" data-name="${esc(f.name)}">Download</button>
        </figure>`;
      }).join('');
    })
    .catch(() => { /* offline or rate-limited: the invitation below stands on its own */ });

  // A cross-origin link cannot force a download, so fetch it and hand over a local copy.
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-src]');
    if (!b) return;
    fetch(b.dataset.src).then((r) => r.blob()).then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = b.dataset.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });
})();
