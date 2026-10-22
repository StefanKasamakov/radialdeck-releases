/* Download: an install card in the manner of a store's, the Microsoft Store first and the installer (.exe) as the
   alternative. download.html itself still just starts the download, as it always did. */
(() => {
  const STORE = 'https://radialdeck.com/store?cid=site';

  OS.register({
    id: 'download',
    tint: '#a5b4fc',
    render(body) {
      body.innerHTML = `<div class="dl-app">
        <div class="dl-card">
          <img class="dl-logo" src="assets/icon.png" alt="" width="72" height="72">
          <div class="dl-id"><h2>RadialDeck</h2><p>Kasa Labs · Free for two rings</p></div>
        </div>
        <a class="store-badge dl-badge" href="${STORE}"><img src="assets/ms-store-badge.svg" alt="Get it from Microsoft" width="200" height="55"></a>
        <button class="os-btn os-btn-primary phone-only" type="button" data-send-pc>Send the link to my PC</button>
        <ul class="dl-points">
          <li><b>From the Microsoft Store.</b> Signed by Microsoft, no SmartScreen prompt, updated by the Store.</li>
          <li><b>Or the installer.</b> The same app; it updates itself. It is not code-signed yet, so Windows may ask first: <b>More info</b>, then <b>Run anyway</b>.</li>
          <li>Windows 10 (version 1809 or later) or Windows 11. No admin rights needed.</li>
        </ul>
        <p class="dl-alt"><a href="download">Download the installer (.exe)</a> · <a href="?app=help#install">Install help</a></p>
      </div>`;
    },
    ring: [
      { label: 'Microsoft Store', icon: '⬇', tint: '#4cc2ff', say: 'Opens RadialDeck in the Microsoft Store.', run: () => location.assign(STORE) },
      { label: 'Installer', icon: '📦', tint: '#a5b4fc', say: 'Downloads RadialDeckSetup.exe.', run: () => location.assign('download') },
      { label: 'Install help', icon: '❓', tint: '#93c5fd', say: 'SmartScreen, admin rights, Store or installer.', run: () => OS.open('help', { hash: 'install' }) },
      { label: 'Pro', icon: '💎', tint: '#c4b5fd', say: 'What Pro adds, and the price.', run: () => OS.open('pro', { hash: 'pricing' }) },
    ],
  });
})();
