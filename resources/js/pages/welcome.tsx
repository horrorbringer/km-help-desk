import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Ticket } from 'lucide-react';

export default function Welcome({
    canRegister = false,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                            <Ticket className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-semibold">Kimmex Help Desk</h1>
                    </div>

                    <p className="text-muted-foreground">
                        Enterprise ticket management system
                    </p>

                    <div className="flex flex-col gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {!auth.user && (
                        <p className="text-xs text-muted-foreground">
                            Contact your administrator to create an account
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
