/* PACE service worker: makes the app installable and shows schedule alerts.
   Pages always load fresh from the network (falls back to a cached copy only when offline). */
const CACHE='pace-shell-v2';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||r.mode!=='navigate')return;
  e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res})
    .catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
});
/* schedule alerts */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'PACE IIT & Medical',{
    body:d.body||'Your schedule has been updated.',icon:'icon-192.png',badge:'icon-192.png',
    tag:'pace-schedule',renotify:true,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(L=>{
    for(const c of L){if(c.url.split('#')[0]===url.split('#')[0]&&'focus' in c)return c.focus()}
    return clients.openWindow(url);
  }));
});
