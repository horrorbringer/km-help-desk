import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';

export default function TelegramIntegration() {
    const page = usePage<SharedData & { telegramToken?: string | null; telegramBotUrl?: string | null }>();
    const user = page.props.auth.user;
    const telegramToken = page.props.telegramToken;
    const telegramBotUrl = page.props.telegramBotUrl;

    const { post, processing } = useForm({});

    const generateToken = () => {
        post(route('telegram.generate-token'), { preserveScroll: true });
    };

    const disconnect = () => {
        if (!confirm('Disconnect your Telegram account? You will no longer receive Telegram notifications.')) return;
        router.delete(route('telegram.disconnect'), { preserveScroll: true });
    };

    const isConnected = !!user?.telegram_chat_id;
    const deepLink = telegramBotUrl && telegramToken
        ? `${telegramBotUrl}?start=${telegramToken}`
        : null;

    return (
        <div className="space-y-6">
            <header>
                <HeadingSmall
                    title="Telegram Integration"
                    description="Connect your Telegram account to receive instant ticket notifications on your phone."
                />
            </header>

            <div className="rounded-lg border p-6 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                {isConnected ? (
                    /* ── Connected State ── */
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                            Connected to Telegram
                        </div>
                        {user.telegram_username && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Linked account: <span className="font-medium text-neutral-700 dark:text-neutral-300">@{user.telegram_username}</span>
                            </p>
                        )}
                        <Button variant="destructive" size="sm" onClick={disconnect} disabled={processing}>
                            Disconnect
                        </Button>
                    </div>
                ) : deepLink ? (
                    /* ── Token Generated — Awaiting User Click ── */
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                            One step remaining — open Telegram to complete setup
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
                            Click the button below to open the bot in Telegram. The link expires in <strong>15 minutes</strong>.
                        </p>
                        <a
                            href={deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            id="telegram-open-bot-link"
                            className="inline-flex items-center gap-2 rounded-md bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-medium px-4 py-2 transition-colors"
                        >
                            {/* Telegram paper-plane icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.265 2.428a2.048 2.048 0 0 0-2.078-.324L2.266 9.339a2.043 2.043 0 0 0-.104 3.79l3.57 1.51 2.006 6.286a.554.554 0 0 0 .968.156l2.712-3.178 4.29 3.369a2.047 2.047 0 0 0 3.22-1.09L22.983 4.5a2.046 2.046 0 0 0-.718-2.072zm-9.7 12.434-1.888 2.212-1.332-4.167 9.097-7.947z"/></svg>
                            Open in Telegram
                        </a>
                        <p className="text-xs text-neutral-400">
                            Already used the link?{' '}
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="underline hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                            >
                                Refresh
                            </button>{' '}
                            to see your connection status.
                        </p>
                    </div>
                ) : (
                    /* ── Not Connected ── */
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
                            Receive instant alerts for ticket assignments, updates, and approvals directly in Telegram — even on your phone.
                        </p>
                        <Button onClick={generateToken} disabled={processing} id="telegram-connect-button">
                            {processing ? 'Generating link…' : 'Connect Telegram'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
