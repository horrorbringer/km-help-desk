import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Ticket, 
    Users, 
    Shield, 
    Zap, 
    BarChart3, 
    Clock, 
    Mail, 
    FileText,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

export default function Welcome({
    canRegister = false,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: Ticket,
            title: 'Ticket Management',
            description: 'Streamline support requests with comprehensive ticket tracking and lifecycle management.',
            color: 'blue',
        },
        {
            icon: Users,
            title: 'Team Collaboration',
            description: 'Assign, delegate, and collaborate seamlessly across departments and teams.',
            color: 'green',
        },
        {
            icon: Shield,
            title: 'Approval Workflows',
            description: 'Multi-level approval processes ensuring proper authorization and compliance.',
            color: 'purple',
        },
        {
            icon: Clock,
            title: 'SLA Management',
            description: 'Track and enforce service level agreements with automated monitoring.',
            color: 'orange',
        },
        {
            icon: Mail,
            title: 'Email Integration',
            description: 'Seamless email notifications and template-based communications.',
            color: 'indigo',
        },
        {
            icon: BarChart3,
            title: 'Analytics & Reporting',
            description: 'Comprehensive insights and reports to drive data-driven decisions.',
            color: 'pink',
        },
    ];

    const benefits = [
        'Enterprise-grade security and compliance',
        'Role-based access control',
        'Customizable workflows and automation',
        'Real-time notifications and updates',
        'Knowledge base integration',
        'Mobile-responsive design',
    ];

    return (
        <>
            <Head title="Kimmex Help Desk System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-white dark:bg-slate-900">
                {/* Header */}
                <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                    <Ticket className="h-6 w-6 text-white" />
                                </div>
                                <span className="ml-3 text-xl font-semibold text-slate-900 dark:text-white">
                                    Kimmex Help Desk
                                </span>
                            </div>
                            <nav className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-20 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                                Enterprise Help Desk
                                <span className="block text-blue-600 dark:text-blue-400">
                                    Management System
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Streamline your support operations with a comprehensive, secure, and scalable 
                                ticket management solution designed for modern enterprises.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Sign In to Continue
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                Comprehensive Features
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                                Everything you need to manage support requests efficiently and effectively.
                            </p>
                        </div>
                        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => {
                                const Icon = feature.icon;
                                const colorClasses = {
                                    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                                    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                                    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                                    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                                    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
                                };
                                return (
                                    <div
                                        key={feature.title}
                                        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="bg-slate-50 py-24 dark:bg-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:max-w-4xl">
                            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                        Why Choose Kimmex Help Desk?
                                    </h2>
                                    <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                        Built for enterprise teams who demand reliability, security, and 
                                        comprehensive functionality in their support management solution.
                                    </p>
                                </div>
                                <div className="lg:pl-8">
                                    <ul className="space-y-4">
                                        {benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                                                <span className="text-base text-slate-700 dark:text-slate-300">
                                                    {benefit}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-white py-16 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                Ready to Get Started?
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                                Access your account to begin managing support requests and collaborating with your team.
                            </p>
                            {!auth.user && (
                                <div className="mt-8">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        <strong>Note:</strong> User accounts are managed by system administrators. 
                                        Please contact your administrator if you need access to the system.
                                    </p>
                                </div>
                            )}
                            <div className="mt-10">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Access Dashboard
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Sign In Now
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                            <p>© {new Date().getFullYear()} Kimmex Help Desk System. All rights reserved.</p>
                            <p className="mt-2">Enterprise Support Management Platform</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
