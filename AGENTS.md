# Repository Guidelines

## Project Structure & Module Organization

This is a Laravel 12 help-desk application with an Inertia, React 19, and
TypeScript frontend. Backend domain code lives in `app/`: controllers and
requests handle HTTP concerns, models represent persisted data, and reusable
business logic belongs in `app/Services`. Routes are split across `routes/`.
Frontend pages live in `resources/js/pages`, shared components in
`resources/js/components`, layouts in `resources/js/layouts`, and styles in
`resources/css`. Database migrations, factories, and seeders are under
`database/`. Automated tests are organized into `tests/Feature` and
`tests/Unit`; deployment and environment documentation lives in `docs/`.

## Build, Test, and Development Commands

- `composer setup` installs dependencies, creates `.env`, generates the app
  key, migrates the database, and builds frontend assets.
- `composer dev` runs Laravel, the queue listener, and Vite concurrently.
- `npm run build` creates the production frontend bundle.
- `composer test` clears cached configuration and runs the PHP test suite.
- `npm run types` performs TypeScript type checking.
- `npm run lint` runs ESLint with automatic fixes.
- `npm run format:check` verifies Prettier formatting; `npm run format` fixes it.
- `./vendor/bin/pint` formats PHP code.

Docker users should follow `README.md`; for example,
`docker-compose exec app php artisan test`.

## Coding Style & Naming Conventions

Use four-space indentation except for YAML, which uses two spaces. PHP follows
Laravel and PSR conventions: `PascalCase` classes, `camelCase` methods, and
singular model names. React components and page files use `PascalCase.tsx`;
hooks use `useSomething.ts`. Prettier enforces single quotes, semicolons, an
80-character width, import ordering, and Tailwind class ordering. Keep
controllers thin and place reusable workflow logic in services.

## Testing Guidelines

Tests use Pest 4 on PHPUnit. Add request, authorization, and workflow coverage
to `tests/Feature`; isolate pure logic in `tests/Unit`. Name files after the
subject, such as `TicketApprovalAuthorizationTest.php`, and write behavior-based
test descriptions. Feature tests automatically use `RefreshDatabase`. Run
focused tests with `php artisan test --filter=TicketApproval`.

## Commit & Pull Request Guidelines

Recent history favors short, imperative summaries, sometimes with a conventional
prefix such as `fix:`. Prefer clear messages like `fix: prevent duplicate ticket
approval` over vague summaries. Pull requests should explain the behavior
change, note migrations or configuration updates, link related issues, list
verification commands, and include screenshots for UI changes. Never commit
`.env`, credentials, generated logs, `vendor/`, or `node_modules/`.
