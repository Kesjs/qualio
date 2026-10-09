import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const intakeUrl = new URL('/api/feedback/intake', request.url).toString()
  const script = `(() => {
  const current = document.currentScript;
  const key = current && current.getAttribute('data-key');
  if (!key || window.__qualioWidgetLoaded) return;
  window.__qualioWidgetLoaded = true;
  const style = document.createElement('style');
  style.textContent = '.qualio-widget-button{position:fixed;right:20px;bottom:20px;z-index:2147483646;border:0;border-radius:999px;background:#ee6018;color:#fff;padding:13px 17px;font:600 13px system-ui,sans-serif;box-shadow:0 12px 30px #ee601844;cursor:pointer}.qualio-widget-panel{position:fixed;right:20px;bottom:76px;z-index:2147483647;width:min(360px,calc(100vw - 32px));border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:18px;box-shadow:0 20px 60px #11182722;font:14px system-ui,sans-serif;color:#111827}.qualio-widget-panel[hidden]{display:none}.qualio-widget-panel h2{margin:0 0 6px;font-size:17px}.qualio-widget-panel p{margin:0 0 14px;color:#6b7280;font-size:13px;line-height:1.5}.qualio-widget-panel textarea,.qualio-widget-panel input{box-sizing:border-box;width:100%;margin:6px 0 10px;border:1px solid #d1d5db;border-radius:9px;padding:10px;font:inherit}.qualio-widget-panel button[type=submit]{border:0;border-radius:9px;background:#111827;color:#fff;padding:10px 13px;font:600 13px system-ui,sans-serif;cursor:pointer}.qualio-widget-status{margin-top:10px;color:#166534;font-size:12px}';
  document.head.appendChild(style);
  const button = document.createElement('button'); button.className='qualio-widget-button'; button.type='button'; button.textContent='Donner un avis';
  const panel = document.createElement('div'); panel.className='qualio-widget-panel'; panel.hidden=true; panel.innerHTML='<h2>Votre avis nous aide</h2><p>Dites-nous ce qui fonctionne ou ce qui mérite d’être amélioré.</p><form><textarea name="content" rows="4" required placeholder="Votre avis..."></textarea><input name="authorName" placeholder="Votre nom (facultatif)" maxlength="160"><input name="authorEmail" type="email" placeholder="Votre email (facultatif)" maxlength="320"><button type="submit">Envoyer mon avis</button><div class="qualio-widget-status" role="status"></div></form>';
  button.addEventListener('click', () => { panel.hidden=!panel.hidden; });
  panel.querySelector('form').addEventListener('submit', async (event) => { event.preventDefault(); const form=new FormData(event.currentTarget); const status=panel.querySelector('.qualio-widget-status'); const submit=panel.querySelector('button[type="submit"]'); submit.disabled=true; try { const response=await fetch('${intakeUrl}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,content:form.get('content'),authorName:form.get('authorName'),authorEmail:form.get('authorEmail')})}); if(!response.ok) throw new Error(); event.currentTarget.reset(); status.textContent='Merci, votre avis a bien été envoyé.'; } catch { status.textContent='Impossible d’envoyer votre avis pour le moment.'; } finally { submit.disabled=false; } });
  document.body.append(button,panel);
})();`
  return new Response(script, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
