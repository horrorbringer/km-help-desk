import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ProjectShow() {
  const { project, relatedProjects } = usePage().props;

  const statusLabel = project.status?.replace('_', ' ') ?? '';

  const statusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/40';
      case 'planned':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/40';
      case 'on_hold':
        return 'bg-slate-500/10 text-slate-200 border-slate-500/40';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/10 text-slate-200 border-slate-500/40';
    }
  };

  return (
    <GuestLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        {/* Top hero */}
        <div className="border-b border-slate-800 bg-[radial-gradient(circle_at_10%_0,rgba(52,211,153,0.18),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.18),transparent_55%)]">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-10">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-300">
              <div className="inline-flex items-center gap-2">
                <Link
                  href={route('projects.index')}
                  className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 hover:border-emerald-400 hover:text-emerald-200"
                >
                  ← Back to projects
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Construction Project
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                  {project.title}
                </h1>
                {project.short_description && (
                  <p className="text-sm text-slate-200/90">{project.short_description}</p>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                {project.status && (
                  <div className="flex items-center justify-end">
                    <span className="mr-2 text-slate-300/80">Status</span>
                    <span
                      className={
                        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' +
                        statusColor(project.status)
                      }
                    >
                      {statusLabel}
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-end gap-1 text-right text-slate-300/90">
                  {project.client_name && (
                    <p>
                      <span className="text-slate-400">Client:</span>{' '}
                      <span className="font-medium text-slate-100">{project.client_name}</span>
                    </p>
                  )}
                  {project.location && (
                    <p>
                      <span className="text-slate-400">Location:</span>{' '}
                      <span className="font-medium text-slate-100">{project.location}</span>
                    </p>
                  )}
                  {(project.start_date || project.end_date) && (
                    <p>
                      <span className="text-slate-400">Timeline:</span>{' '}
                      <span className="font-medium text-slate-100">
                        {project.start_date || 'N/A'} – {project.end_date || 'Ongoing'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Left: description */}
            <div className="space-y-6">
              {/* Placeholder hero / gallery area */}
              <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="relative h-56 sm:h-64 md:h-72">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(59,130,246,0.25),transparent_55%)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-200/90">
                    <span className="rounded-full border border-slate-500/80 bg-slate-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                      Site Overview
                    </span>
                    <p className="max-w-xs text-[13px] text-slate-200/90">
                      You can later replace this area with a project gallery using real site photos.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
                <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
                  Project Detail
                </h2>
                {project.description ? (
                  <div className="prose prose-invert max-w-none prose-p:mb-2 prose-p:text-sm prose-headings:mt-4 prose-headings:mb-2">
                    {/* If you later store HTML, you can use dangerouslySetInnerHTML here.
                       For now, plain text is fine. */}
                    <p className="whitespace-pre-line text-sm text-slate-200/90">
                      {project.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300/90">
                    Detailed description will be added soon for this project.
                  </p>
                )}
              </section>
            </div>

            {/* Right: sidebar info */}
            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
                <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-slate-100 uppercase">
                  Project Snapshot
                </h3>
                <dl className="space-y-2 text-slate-300/90">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Client</dt>
                    <dd className="font-medium text-slate-100">
                      {project.client_name || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Location</dt>
                    <dd className="font-medium text-slate-100">
                      {project.location || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Status</dt>
                    <dd className="font-medium text-slate-100">{statusLabel || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Start date</dt>
                    <dd className="font-medium text-slate-100">
                      {project.start_date || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">End date</dt>
                    <dd className="font-medium text-slate-100">
                      {project.end_date || 'Ongoing'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
                <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-slate-100 uppercase">
                  Explore more projects
                </h3>

                {relatedProjects.length === 0 ? (
                  <p className="text-slate-400">More projects will appear here soon.</p>
                ) : (
                  <ul className="space-y-3">
                    {relatedProjects.map((rp) => (
                      <li key={rp.id} className="border-b border-slate-800/80 pb-2 last:border-b-0">
                        <Link
                          href={route('projects.show', rp.slug)}
                          className="group block"
                        >
                          <p className="text-[13px] font-medium text-slate-100 group-hover:text-emerald-300">
                            {rp.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {rp.location || '—'}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs shadow-[0_18px_45px_rgba(16,185,129,0.35)]">
                <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-emerald-200 uppercase">
                  Plan your project with us
                </h3>
                <p className="mb-3 text-slate-200/90">
                  Looking for a partner for your next construction or renovation project? Share
                  your idea, and we&apos;ll help you turn it into a clear plan.
                </p>
                <Link
                  href="#contact" // replace later with your real contact/quote route
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                >
                  Request a project consultation
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
