/* Documents: the privacy policy, the terms and the refund policy, each a page on a document viewer's desk.
   Content: build/os/apps/<id>.html, the full text of each page (privacy.html, terms.html, refund.html). */
(() => {
  const DOCS = [['privacy', 'Privacy', 'privacy.html', 'shield'], ['terms', 'Terms', 'terms.html', 'file'], ['refund', 'Refunds', 'refund.html', 'back']];
  const PRINT = '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>';

  // Print just the document: its text in a frame of its own, so the desktop stays out of it.
  function print(c) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
    document.body.append(f);
    f.contentDocument.write(`<!doctype html><title>${c.app.title}</title><style>body{font:14px/1.6 "Segoe UI",system-ui,sans-serif;max-width:720px;margin:24px auto;color:#000}a{color:#000}</style>${c.body.querySelector('.dc-paper').innerHTML}`);
    f.contentDocument.close();
    f.contentWindow.focus(); f.contentWindow.print();
    setTimeout(() => f.remove(), 1000);
  }

  for (const [id] of DOCS) {
    OS.register({
      id,
      tint: '#cbd5e1',
      render(body, c) {
        const app = body.querySelector('.dc-app');
        if (!app) return;
        app.insertAdjacentHTML('afterbegin', `<div class="dc-bar">${DOCS.map(([d, label, url]) => `<a href="${url}"${d === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}`
          + `<button class="os-btn dc-print" type="button">${OS.svg(PRINT)}Print</button></div>`);
        app.querySelector('.dc-print').addEventListener('click', () => print(c));
      },
      ring: [
        ...DOCS.map(([d, label, url, icon]) => ({ label, icon, tint: '#cbd5e1', say: `Opens ${url}.`, run: () => OS.open(d) })),
        { label: 'Print', icon: PRINT, tint: '#a5b4fc', say: 'Prints this document, without the desktop around it.', run: print },
        { label: 'Copy link', icon: 'link', tint: '#6ee7a0', say: 'Copies the link to this document.', run: c => OS.share(c.app.url, c.app.title) },
        { label: 'Contact', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', tint: '#5eead4', say: 'A question about this? Write to us.', run: () => OS.open('contact') },
      ],
    });
  }
})();
