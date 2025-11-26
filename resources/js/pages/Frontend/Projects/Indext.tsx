import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function ProjectIndex() {
  const { projects, filters } = usePage().props;

  const statusOptions = [
    { value: '', label: 'All status' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On hold' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const statusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'planned':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'on_hold':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20">
          {/* Hero */}
          <section className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              KIM MEX Construction & Design · Selected works
            </div>

            <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                  Our Projects & Portfolio
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-300">
                  Explore residential, commercial, and interior projects delivered by our team.
                  Filter by status or search by client, title, or location.
                </p>
              </div>
              <form
                method="GET"
                className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
              >
                <div>
                  <label className="text-xs font-medium text-slate-300">Search</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q || ''}
                    placeholder="Search by title, client, or location..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-300">Status</label>
                    <select
                      name="status"
                      defaultValue={filters.status || ''}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                >
                  Apply filters
                </button>
              </form>
            </div>
          </section>

          {/* Projects grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Projects
              </h2>
              {projects.total > 0 && (
                <p className="text-xs text-slate-400">
                  Showing <span className="font-semibold text-slate-200">{projects.from}</span>–
                  <span className="font-semibold text-slate-200">{projects.to}</span> of{' '}
                  <span className="font-semibold text-slate-200">{projects.total}</span> projects
                </p>
              )}
            </div>

            {projects.data.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
                No projects found. Try changing the search or filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.data.map((p) => (
                  <Link
                    key={p.id}
                    href={route('projects.show', p.slug)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-1 hover:border-emerald-500/70"
                  >
                    {/* Thumbnail placeholder (you can replace with real cover_image) */}
                    <div className="relative h-40 overflow-hidden bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-950">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.18),transparent_55%)] opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium uppercase tracking-[0.08em] text-slate-300">
                        <span className="rounded-full border border-slate-500/70 bg-slate-900/50 px-3 py-1">
                          Construction Project
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                          {p.title}
                        </h3>
                        <span
                          className={
                            'whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
                            statusColor(p.status)
                          }
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        {p.client_name && (
                          <p>
                            <span className="text-slate-400">Client:</span>{' '}
                            <span className="font-medium text-slate-100">{p.client_name}</span>
                          </p>
                        )}
                        {p.location && (
                          <p>
                            <span className="text-slate-400">Location:</span>{' '}
                            <span className="font-medium text-slate-100">{p.location}</span>
                          </p>
                        )}
                      </div>

                      {p.short_description && (
                        <p className="line-clamp-3 text-xs text-slate-300/90">
                          {p.short_description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {p.start_date && (
                            <>
                              <span className="text-slate-500">Start:</span>{' '}
                              <span>{p.start_date}</span>
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-400 group-hover:gap-1.5">
                          View details
                          <span className="text-xs">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Simple pagination links (you can style more later) */}
            {projects.links?.length > 3 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
                {projects.links.map((link, idx) => {
                  if (!link.url) {
                    return (
                      <span
                        key={idx}
                        className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-500"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  }

                  const active = link.active;

                  return (
                    <Link
                      key={idx}
                      href={link.url}
                      className={
                        'rounded-full border px-3 py-1 ' +
                        (active
                          ? 'border-emerald-500 bg-emerald-500 text-emerald-950'
                          : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-100')
                      }
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
  );
}
