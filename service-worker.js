const CACHE='drivecontrol-v23push1';const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)))});

self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=(event.notification.data&&event.notification.data.url)||'./';
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
   for(const client of list){if('focus' in client)return client.focus();}
   if(clients.openWindow)return clients.openWindow(target);
 }));
});
