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
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483646;width:0;height:0;';
    const shadow = host.attachShadow({ mode: 'open' });
    const apiUrl = ${intakeUrl};

    shadow.innerHTML = \`
      <style>
        :host { all: initial; }
        .qualio-button, .qualio-panel, .qualio-panel * { box-sizing: border-box; }
        .qualio-button { position: absolute; right: 0; bottom: 0; border: 0; border-radius: 999px; background: #ee6018; color: #fff; padding: 13px 17px; font: 600 13px/1.2 system-ui, sans-serif; white-space: nowrap; box-shadow: 0 12px 30px #ee601844; cursor: pointer; }
        .qualio-button:hover { background: #d95514; }
        .qualio-button:focus-visible, .qualio-panel button:focus-visible, .qualio-panel textarea:focus-visible, .qualio-panel input:focus-visible { outline: 3px solid #f7b08a; outline-offset: 2px; }
        .qualio-panel { position: absolute; right: 0; bottom: 58px; width: min(360px, calc(100vw - 32px)); border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; padding: 18px; box-shadow: 0 20px 60px #11182722; color: #111827; font: 14px/1.45 system-ui, sans-serif; }
        .qualio-panel[hidden] { display: none; }
        .qualio-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .qualio-panel h2 { margin: 0 0 6px; font-size: 17px; line-height: 1.25; }
        .qualio-panel p { margin: 0 0 14px; color: #6b7280; font-size: 13px; }
        .qualio-close { border: 0; background: transparent; color: #6b7280; padding: 0 4px; font-size: 22px; line-height: 1; cursor: pointer; }
        .qualio-panel label { display: block; margin: 10px 0 0; color: #374151; font-size: 12px; font-weight: 600; }
        .qualio-panel textarea, .qualio-panel input { display: block; width: 100%; margin-top: 6px; border: 1px solid #d1d5db; border-radius: 9px; background: #fff; color: #111827; padding: 10px; font: inherit; }
        .qualio-panel textarea { resize: vertical; }
        .qualio-submit { margin-top: 14px; border: 0; border-radius: 9px; background: #111827; color: #fff; padding: 10px 13px; font: 600 13px system-ui, sans-serif; cursor: pointer; }
        .qualio-submit:disabled { cursor: wait; opacity: .6; }
        .qualio-status { min-height: 18px; margin-top: 10px; color: #166534; font-size: 12px; }
        .qualio-status.error { color: #b42318; }
        @media (max-width: 480px) { .qualio-button { right: 0; bottom: 0; } .qualio-panel { right: 0; bottom: 58px; } }
      </style>
      <button class="qualio-button" type="button" aria-expanded="false" aria-controls="qualio-feedback-panel">Partager mon retour</button>
      <section class="qualio-panel" id="qualio-feedback-panel" role="dialog" aria-modal="false" aria-labelledby="qualio-feedback-title" hidden>
        <div class="qualio-panel-header"><div><h2 id="qualio-feedback-title">Votre retour nous aide</h2><p>Dites-nous ce qui fonctionne ou ce qui mérite d’être amélioré.</p></div><button class="qualio-close" type="button" aria-label="Fermer">×</button></div>
        <form>
          <label>Votre retour<textarea name="content" rows="4" required maxlength="10000" placeholder="Écrivez votre retour..."></textarea></label>
          <label>Votre nom (facultatif)<input name="authorName" maxlength="160" autocomplete="name"></label>
          <label>Votre email (facultatif)<input name="authorEmail" type="email" maxlength="320" autocomplete="email"></label>
          <button class="qualio-submit" type="submit">Envoyer mon retour</button>
          <div class="qualio-status" role="status" aria-live="polite"></div>
        </form>
      </section>
    \`;

    const button = shadow.querySelector('.qualio-button');
    const panel = shadow.querySelector('.qualio-panel');
    const close = shadow.querySelector('.qualio-close');
    const form = shadow.querySelector('form');
    const submit = shadow.querySelector('.qualio-submit');
    const status = shadow.querySelector('.qualio-status');
    if (!button || !panel || !close || !form || !submit || !status) return;

    const setOpen = (open) => {
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) shadow.querySelector('textarea')?.focus();
    };
    button.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) setOpen(false); });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      submit.disabled = true;
      status.classList.remove('error');
      status.textContent = 'Envoi en cours…';
      try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, content: data.get('content'), authorName: data.get('authorName'), authorEmail: data.get('authorEmail') }) });
        if (!response.ok) throw new Error();
        form.reset();
        status.textContent = 'Merci, votre retour a bien été envoyé.';
      } catch {
        status.classList.add('error');
        status.textContent = 'Impossible d’envoyer votre retour pour le moment.';
      } finally {
        submit.disabled = false;
      }
    });
    document.body.appendChild(host);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();`

  return new Response(script, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
