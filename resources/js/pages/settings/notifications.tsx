import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import PushNotificationManager from '@/lib/push-notifications';
import type { PageProps } from '@/types';
import { IconBell, IconBellOff } from '@tabler/icons-react';

interface NotificationSettingsProps extends PageProps {}

export default function NotificationSettings() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(true);
    const [testLoading, setTestLoading] = useState(false);
    const [testMessage, setTestMessage] = useState<string | null>(null);

    useEffect(() => {
        checkSupportAndStatus();
    }, []);

    const checkSupportAndStatus = async () => {
        // Check if push notifications are supported
        const supported =
            'serviceWorker' in navigator &&
            'PushManager' in navigator &&
            'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
            setLoading(false);
            return;
        }

        // Check permission status
        setPermission(Notification.permission);

        // Initialize push manager and check subscription status
        try {
            const pushManager = new PushNotificationManager();
            await pushManager.init();
            const subscribed = await pushManager.getSubscriptionStatus();
            setIsSubscribed(subscribed);
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        }

        setLoading(false);
    };

    const handleEnableNotifications = async () => {
        setLoading(true);

        try {
            const pushManager = new PushNotificationManager();

            // Initialize
            const initialized = await pushManager.init();
            if (!initialized) {
                alert('Push notifications are not supported in this browser');
                setLoading(false);
                return;
            }

            // Request permission
            const permissionGranted = await pushManager.requestPermission();
            if (!permissionGranted) {
                alert('Notification permission denied');
                setLoading(false);
                return;
            }

            // Subscribe
            const subscribed = await pushManager.subscribe();
            if (subscribed) {
                setIsSubscribed(true);
                setPermission('granted');
                router.reload({ only: [] }); // Refresh to show success message
            } else {
                alert('Failed to subscribe to push notifications');
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
            alert('Failed to enable push notifications');
        }

        setLoading(false);
    };

    const handleDisableNotifications = async () => {
        if (!confirm('Are you sure you want to disable push notifications?')) {
            return;
        }

        setLoading(true);

        try {
            const pushManager = new PushNotificationManager();
            await pushManager.init();
            await pushManager.unsubscribe();
            setIsSubscribed(false);
        } catch (error) {
            console.error('Failed to disable notifications:', error);
        }

        setLoading(false);
    };

    const handleSendTestNotification = async () => {
        setTestLoading(true);
        setTestMessage(null);

        try {
            const response = await fetch(route('push.test'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Test notification failed');
            }

            setTestMessage(result.message);
        } catch (error) {
            console.error('Failed to send test notification:', error);
            setTestMessage('Failed to send test notification.');
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Notification Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">
                        Notification Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure how you receive notifications
                    </p>
                </div>

                {/* Push Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconBell className="h-5 w-5" />
                            Push Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isSupported ? (
                            <Alert>
                                <AlertDescription>
                                    Push notifications are not supported in this
                                    browser. Try using a modern browser like
                                    Chrome, Firefox, or Edge.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            Browser Push Notifications
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Receive push notifications in your
                                            browser for important updates
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            isSubscribed
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {isSubscribed ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                    <span>Permission: </span>
                                    <Badge
                                        variant={
                                            permission === 'granted'
                                                ? 'default'
                                                : permission === 'denied'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                    >
                                        {permission === 'granted'
                                            ? 'Granted'
                                            : permission === 'denied'
                                              ? 'Denied'
                                              : 'Not Asked'}
                                    </Badge>
                                </div>

                                <div className="flex gap-2">
                                    {!isSubscribed ? (
                                        <Button
                                            onClick={handleEnableNotifications}
                                            disabled={
                                                loading ||
                                                permission === 'denied'
                                            }
                                        >
                                            <IconBell className="mr-2 h-4 w-4" />
                                            Enable Push Notifications
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={handleDisableNotifications}
                                            disabled={loading}
                                        >
                                            <IconBellOff className="mr-2 h-4 w-4" />
                                            Disable Push Notifications
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={handleSendTestNotification}
                                        disabled={testLoading}
                                    >
                                        Send Test Notification
                                    </Button>
                                    {testMessage && (
                                        <p className="text-sm text-muted-foreground">
                                            {testMessage}
                                        </p>
                                    )}
                                </div>

                                {permission === 'denied' && (
                                    <Alert>
                                        <AlertDescription>
                                            Notification permission has been
                                            denied. Please enable notifications
                                            in your browser settings and try
                                            again.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* In-App Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>In-App Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            In-app notifications are always enabled. You can
                            manage them from the notifications page.
                        </p>
                        <Button variant="outline" className="mt-4" asChild>
                            <a href={route('admin.notifications.index')}>
                                View Notifications
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
