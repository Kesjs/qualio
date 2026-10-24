import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const intakeUrl = JSON.stringify(new URL('/api/feedback/intake', request.url).toString())
  const eventUrl = JSON.stringify(new URL('/api/visitor-events', request.url).toString())
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
    const startHidden = current && current.getAttribute('data-hidden') === 'true';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;width:100%;height:100%;pointer-events:none;' + (startHidden ? 'display:none;' : '');
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
    const eventApiUrl = ${eventUrl};
    const sessionId = window.sessionStorage.getItem('qualio_session_id') || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    window.sessionStorage.setItem('qualio_session_id', sessionId);
    const track = (eventName) => { fetch(eventApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, eventName, sessionId, path: window.location.pathname, referrer: document.referrer, host: window.location.hostname }), keepalive: true }).catch(() => {}); };

    shadow.innerHTML = \`
      <style>
        :host { all: initial; }
        .qualio-button, .qualio-panel, .qualio-panel * { box-sizing: border-box; }
        .qualio-button, .qualio-panel { pointer-events: auto; }
        .qualio-button { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: calc(max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 9px; background: var(--qualio-accent, #c2410c); color: #fff; padding: 11px 16px; font: 600 13px/1.2 system-ui, -apple-system, sans-serif; white-space: nowrap; box-shadow: 0 10px 25px -4px rgba(17,24,39,0.24), 0 4px 6px -2px rgba(17,24,39,0.06); cursor: pointer; transition: transform .15s ease, filter .15s ease; }
        .qualio-button:hover { filter: brightness(.93); transform: translateY(-1px); }
        .qualio-button:active { transform: translateY(0); }
        .qualio-button.qualio-pulse { animation: qualio-btn-pulse 1.8s ease-in-out infinite; }
        @keyframes qualio-btn-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 10px 25px -4px rgba(17,24,39,0.24), 0 0 0 0 rgba(194,65,12,0.6); } 50% { transform: scale(1.05); box-shadow: 0 14px 28px -4px rgba(17,24,39,0.28), 0 0 0 12px rgba(194,65,12,0); } }
        .qualio-button-icon { flex-shrink: 0; width: 15px; height: 15px; }
        .qualio-button:focus-visible, .qualio-panel button:focus-visible, .qualio-panel textarea:focus-visible, .qualio-panel input:focus-visible { outline: 2px solid #f7b08a; outline-offset: 2px; }
        .qualio-panel { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: calc(54px + max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); width: min(360px, calc(100vw - 32px)); max-height: calc(100vh - 96px); max-height: calc(var(--qualio-viewport-height, 100dvh) - 96px); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; scroll-padding-block: 16px; border: 1px solid #e5e7eb; border-radius: 11px; background: #fff; padding: 18px; box-shadow: 0 20px 45px -10px rgba(17,24,39,0.22), 0 1px 3px 0 rgba(17,24,39,0.08); color: #111827; font: 14px/1.45 system-ui, -apple-system, sans-serif; }
        .qualio-panel[hidden] { display: none; }
        .qualio-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .qualio-panel h2 { margin: 0 0 6px; font-size: 16px; font-weight: 600; line-height: 1.25; color: #111827; }
        .qualio-panel p { margin: 0 0 14px; color: #6b7280; font-size: 13px; }
        .qualio-close { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 6px; background: transparent; color: #6b7280; padding: 0; cursor: pointer; transition: background .15s, color .15s; }
        .qualio-close:hover { background: #f3f4f6; color: #111827; }
        .qualio-panel label { display: block; margin: 10px 0 0; color: #374151; font-size: 12px; font-weight: 500; }
        .qualio-panel textarea, .qualio-panel input { display: block; width: 100%; margin-top: 5px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: #111827; padding: 9px 11px; font: inherit; font-size: 13px; }
        .qualio-panel textarea { resize: vertical; }
        .qualio-select-wrap { position: relative; margin-top: 10px; }
        .qualio-select-btn { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; margin-top: 5px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: #111827; padding: 9px 11px; font: inherit; font-size: 13px; text-align: left; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease; }
        .qualio-select-btn:hover { border-color: #9ca3af; }
        .qualio-select-btn:focus-visible { outline: 2px solid #f7b08a; outline-offset: 2px; }
        .qualio-select-chevron { width: 16px; height: 16px; color: #6b7280; transition: transform .15s ease; flex-shrink: 0; }
        .qualio-select-btn[aria-expanded="true"] .qualio-select-chevron { transform: rotate(180deg); }
        .qualio-select-menu { position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 60; max-height: 190px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.1); }
        .qualio-select-menu[hidden] { display: none; }
        .qualio-select-opt { display: flex; width: 100%; align-items: center; justify-content: space-between; border: 0; border-radius: 5px; background: transparent; color: #374151; padding: 7px 10px; font: inherit; font-size: 13px; text-align: left; cursor: pointer; transition: background .12s, color .12s; }
        .qualio-select-opt:hover, .qualio-select-opt:focus-visible { background: #f3f4f6; color: #111827; outline: none; }
        .qualio-select-opt.is-active { font-weight: 600; color: #111827; background: #f9fafb; }
        .qualio-select-check { width: 15px; height: 15px; color: var(--qualio-accent, #ee6018); flex-shrink: 0; }
        .qualio-submit { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 96px; margin-top: 14px; border: 0; border-radius: 6px; background: #111827; color: #fff; padding: 10px 14px; font: 600 13px system-ui, -apple-system, sans-serif; cursor: pointer; transition: filter .15s ease; }
        .qualio-submit:hover:not(:disabled) { filter: brightness(1.2); }
        .qualio-submit:disabled { cursor: wait; opacity: .6; }
        .qualio-submit-arrow { width: 14px; height: 14px; flex-shrink: 0; }
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
        .qualio-success-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 8px; background: #ecfdf3; color: #16803c; animation: qualio-success-in .28s ease-out both; }
        .qualio-success-icon svg { width: 24px; height: 24px; }
        .qualio-success strong { color: #111827; font-size: 15px; }
        .qualio-success p { margin: 0; color: #6b7280; font-size: 13px; }
        @keyframes qualio-success-in { from { transform: scale(.75); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes qualio-panel-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .qualio-panel:not([hidden]) { animation: qualio-panel-in .18s cubic-bezier(.16, 1, .3, 1) both; }
        @media (max-width: 480px) {
          .qualio-button { right: max(16px, env(safe-area-inset-right)); bottom: calc(max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); }
          .qualio-panel { right: max(16px, env(safe-area-inset-right)); bottom: calc(54px + max(20px, env(safe-area-inset-bottom)) + var(--qualio-keyboard-inset, 0px)); max-height: calc(100svh - 96px); max-height: calc(var(--qualio-viewport-height, 100dvh) - 96px); }
          .qualio-panel textarea, .qualio-panel input, .qualio-select-btn, .qualio-select-opt { font-size: 16px; }
        }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      </style>
      <button class="qualio-button" type="button" aria-expanded="false" aria-controls="qualio-feedback-panel">
        <svg class="qualio-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="qualio-button-label"></span>
      </button>
      <section class="qualio-panel" id="qualio-feedback-panel" role="dialog" aria-modal="true" aria-labelledby="qualio-feedback-title" hidden>
        <div class="qualio-panel-header"><div><h2 id="qualio-feedback-title"></h2><p class="qualio-intro"></p></div><button class="qualio-close" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
        <form>
          <label><span class="qualio-content-label"></span><textarea name="content" rows="4" required maxlength="2000"></textarea></label>
          <div class="qualio-select-wrap">
            <span class="qualio-rating-label" style="display:block;color:#374151;font-size:12px;font-weight:500">Note (facultative)</span>
            <input type="hidden" name="rating" value="">
            <button type="button" class="qualio-select-btn" aria-haspopup="listbox" aria-expanded="false">
              <span class="qualio-select-val">— Sans note</span>
              <svg class="qualio-select-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
            </button>
            <div class="qualio-select-menu" hidden role="listbox">
              <button type="button" role="option" data-value="" data-label="— Sans note" class="qualio-select-opt is-active"><span>— Sans note</span><svg class="qualio-select-check" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
              <button type="button" role="option" data-value="5" data-label="5 / 5 — Excellent" class="qualio-select-opt"><span>5 / 5 — Excellent</span><svg class="qualio-select-check" hidden viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
              <button type="button" role="option" data-value="4" data-label="4 / 5 — Très bien" class="qualio-select-opt"><span>4 / 5 — Très bien</span><svg class="qualio-select-check" hidden viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
              <button type="button" role="option" data-value="3" data-label="3 / 5 — Moyen" class="qualio-select-opt"><span>3 / 5 — Moyen</span><svg class="qualio-select-check" hidden viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
              <button type="button" role="option" data-value="2" data-label="2 / 5 — À améliorer" class="qualio-select-opt"><span>2 / 5 — À améliorer</span><svg class="qualio-select-check" hidden viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
              <button type="button" role="option" data-value="1" data-label="1 / 5 — Décevant" class="qualio-select-opt"><span>1 / 5 — Décevant</span><svg class="qualio-select-check" hidden viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg></button>
            </div>
          </div>
          <label><span class="qualio-name-label"></span><input name="authorName" maxlength="160" autocomplete="name"></label>
          <label><span class="qualio-email-label"></span><input name="authorEmail" type="email" maxlength="320" autocomplete="email"></label>
          <label aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden"><span>Website</span><input name="honeypot" tabindex="-1" autocomplete="off"></label>
          <button class="qualio-submit" type="submit"><span class="qualio-submit-label"></span><svg class="qualio-submit-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg><span class="qualio-submit-dots" hidden aria-hidden="true"><i></i><i></i><i></i></span></button>
          <div class="qualio-status" role="status" aria-live="polite"></div>
        </form>
        <div class="qualio-success" hidden role="status" aria-live="polite"><div class="qualio-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6" /></svg></div><strong class="qualio-success-title"></strong><p class="qualio-success-copy"></p></div>
      </section>
    \`;

    const button = shadow.querySelector('.qualio-button');
    const buttonLabel = shadow.querySelector('.qualio-button-label');
    const panel = shadow.querySelector('.qualio-panel');
    const close = shadow.querySelector('.qualio-close');
    const form = shadow.querySelector('form');
    const submit = shadow.querySelector('.qualio-submit');
    const submitLabel = shadow.querySelector('.qualio-submit-label');
    const submitArrow = shadow.querySelector('.qualio-submit-arrow');
    const submitDots = shadow.querySelector('.qualio-submit-dots');
    const status = shadow.querySelector('.qualio-status');
    const success = shadow.querySelector('.qualio-success');
    if (!button || !buttonLabel || !panel || !close || !form || !submit || !submitLabel || !submitDots || !status || !success) return;
    if (requestedPosition === 'left') {
      button.style.right = 'auto'; button.style.left = 'max(16px, env(safe-area-inset-left))';
      panel.style.right = 'auto'; panel.style.left = 'max(16px, env(safe-area-inset-left))';
    }

    const applyLanguage = () => {
      const copy = { button: 'Laisser un avis', title: 'Votre avis compte', intro: 'Dites-nous ce qui fonctionne ou ce qui pourrait être amélioré.', close: 'Fermer', content: 'Votre avis', contentPlaceholder: 'Écrivez votre avis…', name: 'Votre nom (facultatif)', email: 'Votre email (facultatif)', submit: 'Envoyer', sending: 'Envoi', success: 'Merci pour votre avis', successCopy: 'Votre message a bien été envoyé.' };
      buttonLabel.textContent = requestedLabel || copy.button;
      button.setAttribute('aria-label', requestedLabel || copy.button);
      shadow.querySelector('#qualio-feedback-title').textContent = requestedTitle || copy.title;
      shadow.querySelector('.qualio-intro').textContent = requestedIntro || copy.intro;
      close.setAttribute('aria-label', copy.close);
      shadow.querySelector('.qualio-content-label').textContent = copy.content;
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

    const selectBtn = shadow.querySelector('.qualio-select-btn');
    const selectVal = shadow.querySelector('.qualio-select-val');
    const selectMenu = shadow.querySelector('.qualio-select-menu');
    const ratingInput = shadow.querySelector('input[name="rating"]');
    const selectOpts = shadow.querySelectorAll('.qualio-select-opt');

    if (selectBtn && selectMenu && ratingInput) {
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = selectMenu.hidden;
        selectMenu.hidden = !willOpen;
        selectBtn.setAttribute('aria-expanded', String(willOpen));
      });
      selectOpts.forEach((opt) => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.getAttribute('data-value') || '';
          const lbl = opt.getAttribute('data-label') || '— Sans note';
          ratingInput.value = val;
          selectVal.textContent = lbl;
          selectOpts.forEach((o) => {
            const isMatch = o === opt;
            o.classList.toggle('is-active', isMatch);
            const chk = o.querySelector('.qualio-select-check');
            if (chk) chk.hidden = !isMatch;
          });
          selectMenu.hidden = true;
          selectBtn.setAttribute('aria-expanded', 'false');
          selectBtn.focus();
        });
      });
      shadow.addEventListener('click', (e) => {
        if (!selectBtn.contains(e.target) && !selectMenu.contains(e.target)) {
          selectMenu.hidden = true;
          selectBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    let openedAt = 0;
    const setOpen = (open) => {
      if (selectMenu) {
        selectMenu.hidden = true;
        if (selectBtn) selectBtn.setAttribute('aria-expanded', 'false');
      }
      if (open && !success.hidden) {
        success.hidden = true;
        form.hidden = false;
        status.textContent = '';
        submitLabel.textContent = applyLanguage().submit;
        if (submitArrow) submitArrow.hidden = false;
        submitDots.hidden = true;
      }
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) openedAt = Date.now();
      if (open) shadow.querySelector('textarea')?.focus();
    };
    button.addEventListener('click', () => { const nextOpen = panel.hidden; setOpen(nextOpen); if (nextOpen) track('widget_opened'); });
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('pointerdown', (event) => {
      if (panel.hidden) return;
      if (!host.contains(event.target)) setOpen(false);
    });
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
      if (submitArrow) submitArrow.hidden = true;
      submitDots.hidden = false;
      status.textContent = '';
      try {
        track('feedback_submitted');
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, content: data.get('content'), rating: data.get('rating'), authorName: data.get('authorName'), authorEmail: data.get('authorEmail'), sourceUrl: window.location.href, honeypot: data.get('honeypot') }) });
        if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || 'Votre avis n’a pas pu être envoyé.'); }
        form.reset();
        if (ratingInput) ratingInput.value = '';
        if (selectVal) selectVal.textContent = '— Sans note';
        if (selectOpts) {
          selectOpts.forEach((o, i) => {
            o.classList.toggle('is-active', i === 0);
            const chk = o.querySelector('.qualio-select-check');
            if (chk) chk.hidden = i !== 0;
          });
        }
        form.hidden = true;
        success.hidden = false;
        window.setTimeout(() => setOpen(false), 1300);
      } catch (error) {
        status.classList.add('error');
        status.textContent = error instanceof Error ? error.message : 'Votre avis n’a pas pu être envoyé. Réessayez.';
      } finally {
        submit.disabled = false;
        submitLabel.textContent = applyLanguage().submit;
        if (submitArrow) submitArrow.hidden = false;
        submitDots.hidden = true;
      }
    });
    document.body.appendChild(host);
    window.qualioWidget = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen(panel.hidden),
      show: () => { host.style.display = 'block'; },
      hide: () => { host.style.display = 'none'; },
      highlight: () => {
        host.style.display = 'block';
        button.classList.add('qualio-pulse');
        const stopPulse = () => { button.classList.remove('qualio-pulse'); button.removeEventListener('click', stopPulse); };
        button.addEventListener('click', stopPulse);
        setTimeout(() => button.classList.remove('qualio-pulse'), 8000);
      },
    };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();`

  return new Response(script, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
