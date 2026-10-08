/* Phones and tablets can't run RadialDeck, so there every download button offers to send the link to a PC instead.
   The is-mobile class on <html> is set in the page head (build/phone.py), before anything is drawn. */
(() => {
  if (!document.documentElement.classList.contains('is-mobile')) return;
  const URL_ = 'https://radialdeck.com/';
  const STORE = 'https://apps.microsoft.com/detail/9NDJPDW5DV1N';
  const isGet = a => /apps\.microsoft\.com|(^|\/)download(\.html)?([?#].*)?$/.test(a.getAttribute('href') || '');
  let sheet;

  function build() {
    sheet = document.createElement('dialog');
    sheet.className = 'pc-sheet';
    sheet.setAttribute('aria-labelledby', 'pc-sheet-h');
    const mail = 'mailto:?subject=' + encodeURIComponent('RadialDeck for my PC')
      + '&body=' + encodeURIComponent('Install on the PC: ' + URL_);
    sheet.innerHTML = `
      <h2 id="pc-sheet-h">RadialDeck runs on Windows</h2>
      <p>Send yourself the link and install it on your PC. It takes thirty seconds, and two rings are free.</p>
      <div class="pc-actions">
        ${navigator.share ? '<button class="btn btn-primary btn-lg" data-act="share">Send the link to my PC</button>' : ''}
        <button class="btn ${navigator.share ? 'btn-ghost' : 'btn-primary'} btn-lg" data-act="copy">Copy the link</button>
        <a class="btn btn-ghost btn-lg" href="${mail}">Email it to myself</a>
      </div>
      <p class="pc-more"><a class="pc-store" href="${STORE}">Open the Store page anyway</a><button data-act="close">Close</button></p>`;
    sheet.addEventListener('click', async e => {
      if (e.target === sheet) return sheet.close(); // a tap on the backdrop
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') sheet.close();
      if (act === 'share') { try { await navigator.share({ title: 'RadialDeck', text: 'RadialDeck, for my PC', url: URL_ }); sheet.close(); } catch (_) { } }
      if (act === 'copy') {
        const b = e.target.closest('button');
        try { await navigator.clipboard.writeText(URL_); b.textContent = 'Copied. Paste it on your PC'; }
        catch (_) { b.textContent = URL_; }
      }
    });
    document.body.appendChild(sheet);
  }

  function open(store) {
    if (!sheet) build();
    sheet.querySelector('.pc-store').href = store || STORE;
    sheet.showModal();
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-send-pc]')) { e.preventDefault(); return open(); }
    const a = e.target.closest('a[href]');
    if (a && !a.closest('.pc-sheet') && isGet(a)) { e.preventDefault(); open(/apps\.microsoft\.com/.test(a.href) ? a.href : STORE); }
  });

  // The header button says what it does on a phone.
  document.querySelectorAll('.nav .btn-primary').forEach(b => {
    if (!isGet(b)) return;
    const t = [...b.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim());
    if (t) t.textContent = ' Send to PC ';
  });
})();
