/* RadialDeck theme studio: build a ring theme in the browser and leave with a file the app can read.
   The preview is the shared renderer from ring.js, so what you see here is what Windows draws. */
(() => {
  const { I, buildRing, themeById, THEMES, themeRing, sliceAt } = window.RDRing;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEMES_REPO = 'StefanKasamakov/radialdeck-themes';

  // ---- Colour helpers: the page works in rgba(), the app's files are #AARRGGBB -----------
  const parse = (c) => {
    const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : { r: 0, g: 0, b: 0, a: 0 };
  };
  const rgba = ({ r, g, b, a }) => `rgba(${r},${g},${b},${+a.toFixed(3)})`;
  const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  const toHex = (c) => { const { r, g, b } = parse(c); return `#${hex2(r)}${hex2(g)}${hex2(b)}`; };
  const toArgb = (c) => { const { r, g, b, a } = parse(c); return `#${hex2(a * 255)}${hex2(r)}${hex2(g)}${hex2(b)}`; };
  const withHex = (c, hex) => {
    const { a } = parse(c);
    return rgba({ r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16), a });
  };
  const withAlpha = (c, a) => rgba({ ...parse(c), a });

  // ---- State: a whole theme, both variants, so the exported file is always complete -----
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let theme = clone(themeById('glass'));
  theme.name = 'My theme';
  theme.author = '';
  let mode = 'dark';
  const V = () => theme[mode];

  const RING = {
    hub: 'Windows',
    slices: [
      ['Lock', I.lock, ''], ['Snip', I.scissors, ''], ['Terminal', I.terminal, ''], ['Servers', I.server, ''],
      ['Settings', I.monitor, ''], ['Media', I.youtube, ''], ['Portals', I.globe, ''], ['Power', I.power, ''],
    ],
  };

  const ring = document.getElementById('studio-ring');
  const stage = document.getElementById('studio-stage');
  let hot = 2;

  // The slices and labels never change here, only their colours, so after the first build a redraw
  // is just new CSS variables and new <defs>. Dragging a colour picker fires far faster than the
  // screen refreshes, so the work is coalesced into one frame.
  function rebuild() {
    buildRing(ring.querySelector('.ring-svg'), ring.querySelector('.ring-labels'), RING);
    ring.querySelector('.ring-hub span').textContent = RING.hub;
    highlight(hot);
  }

  let frame = 0;
  function draw() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      themeRing(ring, V());
      stage.classList.toggle('is-light', mode === 'light');
      document.getElementById('studio-name-out').textContent = `${theme.name || 'Untitled'} · ${mode}`;
      if (!document.getElementById('studio-json-box').hasAttribute('hidden')) {
        refreshJson();
      }
    });
  }

  function highlight(i) {
    ring.querySelectorAll('.is-hot').forEach((e) => e.classList.remove('is-hot'));
    hot = i;
    if (i < 0) return;
    ring.querySelector(`.slice[data-i="${i}"]`)?.classList.add('is-hot');
    ring.querySelector(`.ring-label[data-i="${i}"]`)?.classList.add('is-hot');
  }

  ring.addEventListener('pointermove', (e) => {
    const i = sliceAt(ring, e.clientX, e.clientY, RING.slices.length);
    if (i >= 0 && i !== hot) highlight(i);
  });

  // ---- Controls -------------------------------------------------------------------------
  // [field, label, hint, hasAlpha]
  const COLOURS = [
    ['sliceTop', 'Slice, top', 'The gradient every slice is filled with.', true],
    ['sliceBottom', 'Slice, bottom', '', true],
    ['sliceStroke', 'Slice outline', 'What separates one slice from the next.', true],
    ['hoverTop', 'Highlight, top', 'The slice you are pointing at.', true],
    ['hoverBottom', 'Highlight, bottom', '', true],
    ['hoverStroke', 'Highlight outline', '', true],
    ['hub', 'Centre', 'The disc in the middle. Release here to cancel.', true],
    ['label', 'Label, active', 'Text on the slice you are pointing at.', false],
    ['labelDim', 'Label, resting', '', true],
    ['labelEmpty', 'Label, empty slice', 'Slices with nothing on them yet.', true],
    ['shadow', 'Shadow', 'Cast under the whole ring, not per slice.', false],
  ];
  const PATTERNS = ['none', 'pixels', 'gloss', 'stripes', 'dots', 'scanlines', 'grid'];
  const FONTS = [['', 'Default (Segoe UI)'], ['Segoe UI Black', 'Segoe UI Black'], ['Consolas', 'Consolas'], ['Georgia', 'Georgia'], ['Comic Sans MS', 'Comic Sans MS']];

  const panel = document.getElementById('studio-controls');

  function row(label, hint, control) {
    const el = document.createElement('div');
    el.className = 'ctl';
    el.innerHTML = `<label>${label}${hint ? `<small>${hint}</small>` : ''}</label>`;
    el.appendChild(control);
    return el;
  }

  function colourControl(field, hasAlpha) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl-colour';
    const swatch = document.createElement('input');
    swatch.type = 'color';
    swatch.value = toHex(V()[field]);
    swatch.addEventListener('input', () => { V()[field] = withHex(V()[field], swatch.value); draw(); });
    wrap.appendChild(swatch);

    if (hasAlpha) {
      const alpha = document.createElement('input');
      alpha.type = 'range';
      alpha.min = '0';
      alpha.max = '100';
      alpha.value = String(Math.round(parse(V()[field]).a * 100));
      alpha.title = 'Opacity';
      const pct = document.createElement('span');
      pct.className = 'ctl-pct';
      pct.textContent = alpha.value + '%';
      alpha.addEventListener('input', () => { V()[field] = withAlpha(V()[field], +alpha.value / 100); pct.textContent = alpha.value + '%'; draw(); });
      wrap.append(alpha, pct);
      wrap._sync = () => {
        swatch.value = toHex(V()[field]);
        alpha.value = String(Math.round(parse(V()[field]).a * 100));
        pct.textContent = alpha.value + '%';
      };
    } else {
      wrap._sync = () => { swatch.value = toHex(V()[field]); };
    }

    return wrap;
  }

  function select(options, get, set) {
    const el = document.createElement('select');
    el.innerHTML = options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    el.value = get();
    el.addEventListener('change', () => { set(el.value); draw(); });
    el._sync = () => { el.value = get(); };
    return el;
  }

  function slider(min, max, step, get, set, format) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl-slider';
    const el = document.createElement('input');
    el.type = 'range';
    el.min = String(min); el.max = String(max); el.step = String(step);
    el.value = String(get());
    const out = document.createElement('span');
    out.textContent = format(get());
    el.addEventListener('input', () => { set(+el.value); out.textContent = format(+el.value); draw(); });
    wrap.append(el, out);
    wrap._sync = () => { el.value = String(get()); out.textContent = format(get()); };
    return wrap;
  }

  function checkbox(get, set, text) {
    const label = document.createElement('label');
    label.className = 'ctl-check';
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = get();
    el.addEventListener('change', () => { set(el.checked); draw(); });
    label.append(el, document.createTextNode(' ' + text));
    label._sync = () => { el.checked = get(); };
    return label;
  }

  const syncs = [];
  function build() {
    panel.innerHTML = '';
    syncs.length = 0;

    const group = (title) => {
      const h = document.createElement('h3');
      h.className = 'ctl-group';
      h.textContent = title;
      panel.appendChild(h);
    };

    group('Colours');
    for (const [field, label, hint, hasAlpha] of COLOURS) {
      const c = colourControl(field, hasAlpha);
      syncs.push(c._sync);
      panel.appendChild(row(label, hint, c));
    }

    group('Surface');
    const pat = select(PATTERNS.map((p) => [p, p]), () => V().pattern, (v) => { V().pattern = v; });
    syncs.push(pat._sync);
    panel.appendChild(row('Pattern', 'Drawn over every slice. Pixels for a blocky look, gloss for the Windows 7 shine.', pat));

    const patCol = colourControl('patternColor', true);
    syncs.push(patCol._sync);
    panel.appendChild(row('Pattern colour', 'Opacity is what makes a pattern subtle or loud.', patCol));

    const stroke = slider(0, 6, 0.5, () => V().strokeWidth, (v) => { V().strokeWidth = v; }, (v) => `${v} px`);
    syncs.push(stroke._sync);
    panel.appendChild(row('Outline width', '', stroke));

    const shadow = slider(0, 1, 0.05, () => V().shadowOpacity, (v) => { V().shadowOpacity = v; }, (v) => `${Math.round(v * 100)}%`);
    syncs.push(shadow._sync);
    panel.appendChild(row('Shadow strength', '', shadow));

    group('Glow');
    const glowOn = checkbox(() => !!V().glow, (on) => { V().glow = on ? (V().glow || V().hoverTop) : ''; build(); }, 'Glow around the highlighted slice');
    syncs.push(glowOn._sync);
    panel.appendChild(glowOn);

    if (V().glow) {
      const glowCol = colourControl('glow', true);
      syncs.push(glowCol._sync);
      panel.appendChild(row('Glow colour', '', glowCol));
      const glowR = slider(4, 60, 2, () => V().glowRadius, (v) => { V().glowRadius = v; }, (v) => `${v} px`);
      syncs.push(glowR._sync);
      panel.appendChild(row('Glow size', '', glowR));
    }

    group('Text');
    const font = select(FONTS, () => V().font || '', (v) => { V().font = v; });
    syncs.push(font._sync);
    panel.appendChild(row('Font', 'Use one Windows ships with, or the labels fall back to Segoe UI on other machines.', font));

    const size = slider(0, 20, 1, () => V().labelSize, (v) => { V().labelSize = v; }, (v) => (v ? `${v} px` : 'automatic'));
    syncs.push(size._sync);
    panel.appendChild(row('Label size', '0 lets the ring decide.', size));

    const upper = checkbox(() => V().labelUppercase, (v) => { V().labelUppercase = v; }, 'UPPERCASE LABELS');
    syncs.push(upper._sync);
    panel.appendChild(upper);
  }

  const syncAll = () => syncs.forEach((f) => f && f());

  // ---- Mode, base theme, name -----------------------------------------------------------
  document.querySelectorAll('#studio-mode button').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    document.querySelectorAll('#studio-mode button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    build();
    draw();
  }));

  const baseBox = document.getElementById('studio-base');
  baseBox.innerHTML = THEMES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  baseBox.addEventListener('change', () => {
    const base = clone(themeById(baseBox.value));
    theme = { ...base, id: theme.id, name: theme.name, author: theme.author };
    build();
    draw();
  });

  const nameBox = document.getElementById('studio-name');
  nameBox.addEventListener('input', () => { theme.name = nameBox.value; refreshName(); draw(); });
  const authorBox = document.getElementById('studio-author');
  authorBox.addEventListener('input', () => { theme.author = authorBox.value; draw(); });

  // ---- Export ---------------------------------------------------------------------------
  // The id is the file name and the value that lands in config.json. Letters from any alphabet are
  // fine on Windows and in git, so a Bulgarian or Japanese name keeps its name instead of vanishing.
  const slug = () => (theme.name || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 40) || 'my-theme';

  const variantJson = (v) => ({
    sliceTop: toArgb(v.sliceTop), sliceBottom: toArgb(v.sliceBottom), sliceStroke: toArgb(v.sliceStroke),
    hoverTop: toArgb(v.hoverTop), hoverBottom: toArgb(v.hoverBottom), hoverStroke: toArgb(v.hoverStroke),
    hub: toArgb(v.hub), label: toArgb(v.label), labelDim: toArgb(v.labelDim), labelEmpty: toArgb(v.labelEmpty),
    shadow: toArgb(v.shadow),
    strokeWidth: v.strokeWidth, shadowOpacity: v.shadowOpacity,
    pattern: v.pattern, patternColor: toArgb(v.patternColor),
    glow: v.glow ? toArgb(v.glow) : '', glowRadius: v.glowRadius,
    font: v.font || '', labelSize: v.labelSize, labelUppercase: !!v.labelUppercase,
  });

  const fileJson = () => JSON.stringify({
    id: slug(),
    name: theme.name || 'My theme',
    author: theme.author || 'Anonymous',
    dark: variantJson(theme.dark),
    light: variantJson(theme.light),
  }, null, 2);

  const out = document.getElementById('studio-json');
  const fileName = document.getElementById('studio-filename');
  const refreshJson = () => { out.textContent = fileJson(); };
  const refreshName = () => { fileName.textContent = slug() + '.json'; };

  document.getElementById('studio-download').addEventListener('click', () => {
    const blob = new Blob([fileJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    say('Saved. Drop it in %APPDATA%\\RadialDeck\\themes and reopen Settings.');
  });

  document.getElementById('studio-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(fileJson());
      say('JSON copied.');
    } catch {
      say('Could not copy; the JSON is shown below, select it by hand.');
    }
  });

  document.getElementById('studio-share').addEventListener('click', () => {
    const url = `https://github.com/${THEMES_REPO}/new/main?filename=themes/${slug()}.json&value=${encodeURIComponent(fileJson())}`;
    if (url.length > 7500) {
      say('This theme is too long for a pre-filled link. Download the file and attach it to a pull request instead.');
      return;
    }
    window.open(url, '_blank', 'noopener');
    say('GitHub opened with the file ready. Commit it as a pull request and it joins the gallery.');
  });

  const status = document.getElementById('studio-status');
  let statusTimer;
  function say(text) {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 6000);
  }

  document.getElementById('studio-toggle-json').addEventListener('click', (e) => {
    const box = document.getElementById('studio-json-box');
    const open = box.hasAttribute('hidden');
    box.toggleAttribute('hidden', !open);
    e.target.textContent = open ? 'Hide the file' : 'Show the file';
    if (open) refreshJson();
  });

  // ---- The gallery ----------------------------------------------------------------------
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = THEMES.map((t) => `
    <figure class="gal">
      <img src="assets/themes/${t.id}-dark.png" alt="${t.name}, dark" loading="lazy" width="356" height="356">
      <figcaption><b>${t.name}</b><code>${t.id}</code></figcaption>
      <button class="gal-use" data-id="${t.id}">Start from this</button>
    </figure>`).join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.gal-use');
    if (!b) return;
    baseBox.value = b.dataset.id;
    baseBox.dispatchEvent(new Event('change'));
    document.getElementById('studio').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  // Community themes come from the public repository. No backend, no accounts: a theme is a file
  // in a pull request. If GitHub cannot be reached the section simply invites you to be the first.
  const community = document.getElementById('community-grid');
  const builtIn = new Set(THEMES.map((t) => t.id));
  fetch(`https://api.github.com/repos/${THEMES_REPO}/contents/themes`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((files) => {
      const ids = files
        .filter((f) => f.name.endsWith('.json'))
        .map((f) => f.name.replace(/\.json$/, ''))
        .filter((id) => !builtIn.has(id));
      if (!ids.length) return;
      document.getElementById('community').classList.add('has-themes');
      community.innerHTML = ids.map((id) => `
        <figure class="gal">
          <img src="https://raw.githubusercontent.com/${THEMES_REPO}/main/previews/${id}-dark.png" alt="${id}" loading="lazy" width="356" height="356">
          <figcaption><b>${id}</b><code>community</code></figcaption>
          <a class="gal-use" href="https://github.com/${THEMES_REPO}/blob/main/themes/${id}.json">Get the file</a>
        </figure>`).join('');
    })
    .catch(() => { /* offline or rate-limited: the invitation below stands on its own */ });

  build();
  themeRing(ring, V());
  rebuild();
  draw();
  nameBox.value = theme.name;
  refreshName();
})();
