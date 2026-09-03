const CACHE='shopping-approval-v1';
const CORE=['./','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('./'))));});
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{};}catch{data={body:event.data?.text()||''};}event.waitUntil(self.registration.showNotification(data.title||'购物审批',{body:data.body||'有新的购物审批消息',icon:'./icon.svg',badge:'./icon.svg',data:{url:data.url||'/shopping-approval/'}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(event.notification.data?.url||'/shopping-approval/',self.location.origin).href;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus'in client){client.navigate(target);return client.focus();}}return clients.openWindow(target);}));});
