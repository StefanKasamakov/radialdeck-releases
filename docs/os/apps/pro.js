/* Pro: RadialDeck's product page, in the manner of a store listing. Content: build/os/apps/pro.html
   (inline in pro.html and index.html). The ring gets it, compares the plans, or shares the page. */
(() => {
  const STORE = 'https://radialdeck.com/store?cid=site';
  const go = (c, id) => OS.reveal(c.body.querySelector('#' + CSS.escape(id)));

  OS.register({
    id: 'pro',
    tint: '#c4b5fd',
    render(body, c) {
      // Screenshots: a scroll-snap strip with previous / next buttons.
      const strip = body.querySelector('.st-shots');
      if (strip) {
        strip.insertAdjacentHTML('afterend', '<div class="st-nav"><button class="os-btn" type="button" data-step="-1" aria-label="Previous screenshot">‹</button><button class="os-btn" type="button" data-step="1" aria-label="Next screenshot">›</button></div>');
        strip.nextElementSibling.addEventListener('click', e => {
          const b = e.target.closest('[data-step]');
          if (b) strip.scrollBy({ left: +b.dataset.step * strip.clientWidth * .8, behavior: RingLive.reduce ? 'auto' : 'smooth' });
        });
      }
    },
    onOpen(c, args) { if (args.hash) requestAnimationFrame(() => go(c, args.hash)); },
    ring: [
      { label: 'Get it free', icon: '⬇', tint: '#4cc2ff', say: 'Opens RadialDeck in the Microsoft Store.', run: () => location.assign(STORE) },
      { label: 'Compare plans', icon: 'fluent:E8FD', tint: '#c4b5fd', say: 'Free, Pro and Team side by side.', run: c => go(c, 'pricing') },
      { label: 'Reviews & FAQ', icon: '⭐', tint: '#ffd166', say: 'Where to read reviews, and the questions people ask before buying.', run: c => go(c, 'reviews') },
      { label: 'Share', icon: '🔗', tint: '#6ee7a0', say: 'Copies the link to this page.', run: () => OS.share('pro.html', 'RadialDeck Pro') },
    ],
  });
})();
