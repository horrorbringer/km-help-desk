// Push Notification Manager
export default class PushNotificationManager {
    constructor() {
        this.registration = null;
        this.vapidPublicKey = null;
    }

    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in navigator)) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register(
                '/sw.js',
                {
                    scope: '/',
                },
            );

            console.log('Service Worker registered');

            // Get VAPID public key
            const response = await fetch(route('push.vapid-public-key'));
            if (
                response.headers
                    .get('content-type')
                    ?.includes('application/json')
            ) {
                const data = await response.json();
                this.vapidPublicKey = data.publicKey;
            } else {
                console.warn(
                    'VAPID public key endpoint returned non-JSON response',
                );
            }

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    }

    async subscribe() {
        if (!this.registration) {
            throw new Error('Service Worker not registered');
        }

        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    this.vapidPublicKey,
                ),
            });

            // Send subscription to server
            const response = await fetch(route('push.subscribe'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: this.arrayBufferToBase64(
                            subscription.getKey('p256dh'),
                        ),
                        auth: this.arrayBufferToBase64(
                            subscription.getKey('auth'),
                        ),
                    },
                }),
            });

            if (
                !response.headers
                    .get('content-type')
                    ?.includes('application/json')
            ) {
                throw new Error('Invalid response format: Expected JSON');
            }

            const result = await response.json();

            if (result.success) {
                console.log('Successfully subscribed to push notifications');
                return true;
            } else {
                console.error('Failed to subscribe:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Subscription failed:', error);
            return false;
        }
    }

    async unsubscribe() {
        if (!this.registration) {
            return;
        }

        try {
            const subscription =
                await this.registration.pushManager.getSubscription();

            if (subscription) {
                const success = await subscription.unsubscribe();

                if (success) {
                    // Notify server
                    await fetch(route('push.unsubscribe'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            endpoint: subscription.endpoint,
                        }),
                    });

                    console.log(
                        'Successfully unsubscribed from push notifications',
                    );
                }
            }
        } catch (error) {
            console.error('Unsubscription failed:', error);
        }
    }

    async getSubscriptionStatus() {
        if (!this.registration) {
            return false;
        }

        try {
            const subscription =
                await this.registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            console.error('Failed to get subscription status:', error);
            return false;
        }
    }

    // Utility functions
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// Export for global use
window.PushNotificationManager = PushNotificationManager;
