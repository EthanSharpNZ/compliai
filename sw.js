// CompliAI service worker — v2
// Static assets are cache-first; HTML/JS always come fresh from the network
// (never serve a stale app shell, which could save against an old schema).
const C='compliai-v2';
const ASSETS=['/favicon.svg','/compliAI-logo-reversed.svg','/icon-192.png','/icon-512.png','/icon-512-maskable.png','/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;            // never touch Supabase / Anthropic / CDN
  if(/\.(svg|png|ico|webp|jpe?g|gif|woff2?)$/.test(url.pathname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(C).then(c=>c.put(e.request,cp));return resp;})));
  }
  // everything else (HTML, the app JS): no respondWith -> always network-fresh
});
