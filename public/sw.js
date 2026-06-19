// Service Worker for Push Notifications
self.addEventListener('install', function (event) {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating.');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('Push message received.', event);

    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        data: data.data || {},
        requireInteraction: data.requireInteraction ?? true,
        actions: [
            {
                action: 'view',
                title: 'View',
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
            },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Default action or 'view' action
    const data = event.notification.data;
    let url = '/admin/notifications';

    if (data && data.ticket_id) {
        url = `/admin/tickets/${data.ticket_id}`;
    }

    event.waitUntil(clients.openWindow(url));
});

self.addEventListener('notificationclose', function (event) {
    console.log('Notification closed.', event);
});
