// Revendiste Service Worker — Web Push only, no offline caching

self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    return;
  }

  var options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: {url: data.url || '/'},
    tag: data.tag || 'revendiste',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Revendiste', options),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients
      .matchAll({type: 'window', includeUncontrolled: true})
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (
            client.url.indexOf(self.location.origin) !== -1 &&
            'focus' in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
