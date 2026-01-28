import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <>
            <Head title="Page Not Found" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center text-foreground selection:bg-red-500 selection:text-white">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50 p-4 shadow-sm ring-1 ring-border">
                    <FileQuestion
                        className="h-12 w-12 text-muted-foreground"
                        strokeWidth={1.5}
                    />
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Page not found
                </h1>

                <p className="mb-8 max-w-md text-lg text-muted-foreground">
                    Sorry, we couldn't find the page you're looking for. It
                    might have been moved, deleted, or never existed.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Button asChild size="lg">
                        <Link href="/">Go back home</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </div>

                <div className="mt-12 text-sm text-muted-foreground/60">
                    Error code: 404
                </div>
            </div>
        </>
    );
}
