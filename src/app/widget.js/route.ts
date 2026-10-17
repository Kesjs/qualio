import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const intakeUrl = JSON.stringify(new URL('/api/feedback/intake', request.url).toString())
  const script = `(() => {
  const current = document.currentScript;
  const key = current && current.getAttribute('data-key');
  if (!key || window.__qualioWidgetLoaded) return;
  window.__qualioWidgetLoaded = true;

  const mount = () => {
    if (!document.body || document.querySelector('[data-qualio-widget]')) return;

    const host = document.createElement('div');
    host.setAttribute('data-qualio-widget', '');
    const requestedPosition = current && current.getAttribute('data-position') === 'left' ? 'left' : 'right';
    const requestedAccent = current && /^#[0-9a-f]{6}$/i.test(current.getAttribute('data-accent') || '') ? current.getAttribute('data-accent') : '#ee6018';
    const requestedLabel = current && current.getAttribute('data-label') ? current.getAttribute('data-label') : '';
    const requestedTitle = current && current.getAttribute('data-title') ? current.getAttribute('data-title') : '';
    const requestedIntro = current && current.getAttribute('data-intro') ? current.getAttribute('data-intro') : '';
    const requestedQuestion = current && current.getAttribute('data-question') ? current.getAttribute('data-question') : '';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;width:100%;height:100%;pointer-events:none;';
    host.style.setProperty('--qualio-accent', requestedAccent);
    const syncViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      host.style.setProperty('--qualio-viewport-height', String(viewport.height) + 'px');
      host.style.setProperty('--qualio-keyboard-inset', String(keyboardInset) + 'px');
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    const shadow = host.attachShadow({ mode: 'open' });
    const apiUrl = ${intakeUrl};

    shadow.innerHTML = \`
      <style>
        :host { all: initial; }
        .qualio-button, .qualio-panel, .qualio-panel * { box-sizing: border-box; }
        .qualio-button, .qualio-panel { pointer-events: auto; }
        .qualio-button { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: calc(max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); border: 0; border-radius: 999px; background: var(--qualio-accent, #ee6018); color: #fff; padding: 13px 17px; font: 600 13px/1.2 system-ui, sans-serif; white-space: nowrap; box-shadow: 0 12px 30px #11182733; cursor: pointer; }
        .qualio-button:hover { filter: brightness(.92); }
        .qualio-button:focus-visible, .qualio-panel button:focus-visible, .qualio-panel textarea:focus-visible, .qualio-panel input:focus-visible { outline: 3px solid #f7b08a; outline-offset: 2px; }
        .qualio-panel { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: calc(58px + max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); width: min(360px, calc(100vw - 32px)); max-height: calc(100vh - 96px); max-height: calc(var(--qualio-viewport-height, 100dvh) - 96px); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; scroll-padding-block: 16px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; padding: 18px; box-shadow: 0 20px 60px #11182722; color: #111827; font: 14px/1.45 system-ui, sans-serif; }
        .qualio-panel[hidden] { display: none; }
        .qualio-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .qualio-panel h2 { margin: 0 0 6px; font-size: 17px; line-height: 1.25; }
        .qualio-panel p { margin: 0 0 14px; color: #6b7280; font-size: 13px; }
        .qualio-close { border: 0; background: transparent; color: #6b7280; padding: 0 4px; font-size: 22px; line-height: 1; cursor: pointer; }
        .qualio-panel label { display: block; margin: 10px 0 0; color: #374151; font-size: 12px; font-weight: 600; }
        .qualio-panel textarea, .qualio-panel input, .qualio-panel select { display: block; width: 100%; margin-top: 6px; border: 1px solid #d1d5db; border-radius: 9px; background: #fff; color: #111827; padding: 10px; font: inherit; }
        .qualio-panel textarea { resize: vertical; }
        .qualio-submit { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 92px; margin-top: 14px; border: 0; border-radius: 9px; background: #111827; color: #fff; padding: 10px 13px; font: 600 13px system-ui, sans-serif; cursor: pointer; }
        .qualio-submit:disabled { cursor: wait; opacity: .6; }
        .qualio-submit-dots { display: none; gap: 3px; align-items: center; }
        .qualio-submit-dots:not([hidden]) { display: inline-flex; }
        .qualio-submit-dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: qualio-dot 1s infinite ease-in-out; }
        .qualio-submit-dots i:nth-child(2) { animation-delay: .12s; }
        .qualio-submit-dots i:nth-child(3) { animation-delay: .24s; }
        @keyframes qualio-dot { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-3px); opacity: 1; } }
        .qualio-status { min-height: 18px; margin-top: 10px; color: #b42318; font-size: 12px; }
        .qualio-status.error { color: #b42318; }
        .qualio-success { display: grid; justify-items: center; gap: 10px; padding: 22px 8px 10px; text-align: center; }
        .qualio-success[hidden] { display: none; }
        .qualio-success-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: #ecfdf3; color: #16803c; animation: qualio-success-in .28s ease-out both; }
        .qualio-success-icon svg { width: 25px; height: 25px; }
        .qualio-success strong { color: #111827; font-size: 15px; }
        .qualio-success p { margin: 0; color: #6b7280; font-size: 13px; }
        @keyframes qualio-success-in { from { transform: scale(.65); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @media (max-width: 480px) { .qualio-button { right: max(16px, env(safe-area-inset-right)); bottom: calc(max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); } .qualio-panel { right: max(16px, env(safe-area-inset-right)); bottom: calc(58px + max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); max-height: calc(100svh - 96px); max-height: calc(var(--qualio-viewport-height, 100dvh) - 96px); } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      </style>
      <button class="qualio-button" type="button" aria-expanded="false" aria-controls="qualio-feedback-panel"></button>
      <section class="qualio-panel" id="qualio-feedback-panel" role="dialog" aria-modal="true" aria-labelledby="qualio-feedback-title" hidden>
        <div class="qualio-panel-header"><div><h2 id="qualio-feedback-title"></h2><p class="qualio-intro"></p></div><button class="qualio-close" type="button"></button></div>
        <form>
          <label><span class="qualio-content-label"></span><textarea name="content" rows="4" required maxlength="2000"></textarea></label>
          <label><span class="qualio-rating-label">Note (facultative)</span><select name="rating"><option value="">—</option><option value="1">1 / 5</option><option value="2">2 / 5</option><option value="3">3 / 5</option><option value="4">4 / 5</option><option value="5">5 / 5</option></select></label>
          <label><span class="qualio-name-label"></span><input name="authorName" maxlength="160" autocomplete="name"></label>
          <label><span class="qualio-email-label"></span><input name="authorEmail" type="email" maxlength="320" autocomplete="email"></label>
          <label aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden"><span>Website</span><input name="honeypot" tabindex="-1" autocomplete="off"></label>
          <button class="qualio-submit" type="submit"><span class="qualio-submit-label"></span><span class="qualio-submit-dots" hidden aria-hidden="true"><i></i><i></i><i></i></span></button>
          <div class="qualio-status" role="status" aria-live="polite"></div>
        </form>
        <div class="qualio-success" hidden role="status" aria-live="polite"><div class="qualio-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6" /></svg></div><strong class="qualio-success-title"></strong><p class="qualio-success-copy"></p></div>
      </section>
    \`;

    const button = shadow.querySelector('.qualio-button');
    const panel = shadow.querySelector('.qualio-panel');
    const close = shadow.querySelector('.qualio-close');
    const form = shadow.querySelector('form');
    const submit = shadow.querySelector('.qualio-submit');
    const submitLabel = shadow.querySelector('.qualio-submit-label');
    const submitDots = shadow.querySelector('.qualio-submit-dots');
    const status = shadow.querySelector('.qualio-status');
    const success = shadow.querySelector('.qualio-success');
    if (!button || !panel || !close || !form || !submit || !submitLabel || !submitDots || !status || !success) return;
    if (requestedPosition === 'left') {
      button.style.right = 'auto'; button.style.left = 'max(16px, env(safe-area-inset-left))';
      panel.style.right = 'auto'; panel.style.left = 'max(16px, env(safe-area-inset-left))';
    }

    const applyLanguage = () => {
      const copy = { button: 'Laisser un avis', title: 'Votre avis compte', intro: 'Dites-nous ce qui fonctionne ou ce qui pourrait être amélioré.', close: 'Fermer', content: 'Votre avis', contentPlaceholder: 'Écrivez votre avis…', name: 'Votre nom (facultatif)', email: 'Votre email (facultatif)', submit: 'Envoyer', sending: 'Envoi', success: 'Merci pour votre avis', successCopy: 'Votre message a bien été envoyé.' };
      button.textContent = requestedLabel || copy.button;
      button.setAttribute('aria-label', copy.button);
      shadow.querySelector('#qualio-feedback-title').textContent = requestedTitle || copy.title;
      shadow.querySelector('.qualio-intro').textContent = requestedIntro || copy.intro;
      close.textContent = '×';
      close.setAttribute('aria-label', copy.close);
      shadow.querySelector('.qualio-content-label').textContent = requestedQuestion || copy.content;
      shadow.querySelector('textarea').setAttribute('placeholder', copy.contentPlaceholder);
      shadow.querySelector('.qualio-name-label').textContent = copy.name;
      shadow.querySelector('.qualio-email-label').textContent = copy.email;
      submitLabel.textContent = copy.submit;
      shadow.querySelector('.qualio-success-title').textContent = copy.success;
      shadow.querySelector('.qualio-success-copy').textContent = (current && current.getAttribute('data-thank-you') || '').slice(0, 200) || copy.successCopy;
      return copy;
    };
    applyLanguage();
    const languageObserver = new MutationObserver(() => applyLanguage());
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    let openedAt = 0;
    const setOpen = (open) => {
      if (open && !success.hidden) {
        success.hidden = true;
        form.hidden = false;
        status.textContent = '';
        submitLabel.textContent = applyLanguage().submit;
        submitDots.hidden = true;
      }
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) openedAt = Date.now();
      if (open) shadow.querySelector('textarea')?.focus();
    };
    button.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
      if (panel.hidden) return;
      if (event.key === 'Escape') { setOpen(false); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(shadow.querySelectorAll('button, textarea, input')).filter((element) => !element.hasAttribute('disabled') && !element.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && shadow.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && shadow.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (Date.now() - openedAt < 1800) {
        status.classList.add('error');
        status.textContent = 'Prenez un instant pour écrire votre avis.';
        return;
      }
      const data = new FormData(form);
      submit.disabled = true;
      status.classList.remove('error');
      const copy = applyLanguage();
      submitLabel.textContent = copy.sending;
      submitDots.hidden = false;
      status.textContent = '';
      try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, content: data.get('content'), rating: data.get('rating'), authorName: data.get('authorName'), authorEmail: data.get('authorEmail'), sourceUrl: window.location.href, honeypot: data.get('honeypot') }) });
        if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || 'Votre avis n’a pas pu être envoyé.'); }
        form.reset();
        form.hidden = true;
        success.hidden = false;
        window.setTimeout(() => setOpen(false), 1300);
      } catch (error) {
        status.classList.add('error');
        status.textContent = error instanceof Error ? error.message : 'Votre avis n’a pas pu être envoyé. Réessayez.';
      } finally {
        submit.disabled = false;
        submitLabel.textContent = applyLanguage().submit;
        submitDots.hidden = true;
      }
    });
    document.body.appendChild(host);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();`

  return new Response(script, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
