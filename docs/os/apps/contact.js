/* Contact: a mail compose window. It sends exactly what contact.html always sent: the form's fields as JSON to
   /api/contact (the keys Worker), with the same checks. Content: build/os/apps/contact.html. */
(() => {
  function topic(c, t) {
    const sel = c.body.querySelector('select[name="topic"]');
    if (sel && t && sel.querySelector(`option[value="${CSS.escape(t)}"]`)) sel.value = t;
  }

  OS.register({
    id: 'contact',
    tint: '#5eead4',
    render(body, c) {
      const f = body.querySelector('#contact-form');
      if (!f) return;
      const status = f.querySelector('.ct-status'), go = f.querySelector('.ct-send');
      const say = (text, ok) => { status.textContent = text; status.className = 'ct-status ' + (ok ? 'ok' : 'err'); };
      c.send = () => f.requestSubmit();
      f.addEventListener('submit', async e => {
        e.preventDefault();
        if (!f.email.checkValidity() || !f.email.value) { f.email.focus(); return say('Please check your e-mail address.', false); }
        if (f.message.value.trim().length < 5) { f.message.focus(); return say('Please write a few words.', false); }
        go.disabled = true; say('Sending…', true);
        try {
          const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(f))) });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error);
          f.reset(); say('Thank you. Your message is on its way and we will answer by e-mail.', true);
        } catch (err) {
          say((err && err.message) || 'The message could not be sent. Please try again in a minute, or write to hello@radialdeck.com.', false);
        } finally { go.disabled = false; }
      });
    },
    onOpen(c, args) { topic(c, args.params?.topic); },
    ring: c => [
      { label: 'Send', icon: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', tint: '#4cc2ff', say: 'Sends the message. A person answers by e-mail.', run: () => c.send?.() },
      { label: 'Team licences', icon: 'users', tint: '#fcd34d', say: 'Topic: team or company licences.', run: () => topic(c, 'team') },
      { label: 'Support', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>', tint: '#93c5fd', say: 'Topic: support or a bug.', run: () => topic(c, 'support') },
      { label: 'Share a ring', icon: 'ring', tint: '#99f6e4', say: 'Topic: share a ring. Paste its link in the message.', run: () => topic(c, 'ring') },
      { label: 'Privacy', icon: 'shield', tint: '#6ee7a0', say: 'What happens to your message.', run: () => OS.open('privacy') },
    ],
  });
})();
