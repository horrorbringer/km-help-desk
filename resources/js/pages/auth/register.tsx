import { login } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { UserX } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    return (
        <AuthLayout
            title="Registration Disabled"
            description="User registration is managed by administrators"
        >
            <Head title="Register" />
            <div className="flex flex-col items-center justify-center gap-6 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <UserX className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-semibold">Registration Not Available</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        User accounts are created and managed by system administrators. 
                        Please contact your administrator to request an account.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <Link href={login()}>
                        <Button className="w-full" variant="default">
                            Go to Login
                        </Button>
                    </Link>
                    
                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <TextLink href={login()}>
                            Sign in
                        </TextLink>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
