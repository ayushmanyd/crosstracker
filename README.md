# CrossTracker - Plan vs Actual Tracker

A small web app for tracking monthly spending targets (**plans**) against logged
spend (**actuals**) per category, with a variance report, month locking, CSV
import, and CSV export.

**Live URL:** https://crosstrackers.vercel.app

Demo account (seeded with the assignment sample data):

```
Email:    demo@crosstracker.app
Password: password123
```

---

## Tech Stack

| Layer     | Choice                                                           |
| --------- | ---------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Actions, React Server Components) |
| Language  | TypeScript (strict)                                              |
| Database  | PostgreSQL (Supabase) via Drizzle ORM                            |
| Auth      | Email + password, bcrypt hash, JWT session in httpOnly cookie    |
| UI        | Tailwind CSS v4, shadcn/ui, Recharts                             |
| Testing   | Vitest (unit + integration + production smoke test)              |
| Hosting   | Vercel                                                           |

## Prerequisites

- **Node.js** 20+
- **pnpm** 10 (this repo pins `packageManager: pnpm@10.28.1`; `corepack enable` works)
- A **PostgreSQL** database - the app is developed against
  [Supabase](https://supabase.com) (free tier works), but any Postgres works.

## Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/ayushmanyd/crosstracker.git
   cd crosstracker
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in the values (see [Environment Variables](#environment-variables)).
   For Supabase: `DATABASE_URL` is the pooled connection string (port 6543,
   Transaction pooler) and `DIRECT_URL` is the direct connection (port 5432)
   - both are shown under **Project Settings → Database**.

3. **Run migrations**

   ```bash
   pnpm db:migrate
   ```

4. **(Optional) Seed sample data**

   Loads the assignment's sample dataset (Marketing/Payroll, Jan–Feb 2026)
   under the demo account above.

   ```bash
   pnpm db:seed
   ```

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000 - you'll be redirected to `/login`. Use the demo
   account, or sign up a new one.

## Environment Variables

| Variable         | Required | Purpose                                                                                            |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | Pooled Postgres connection string used by the app at runtime.                                      |
| `DIRECT_URL`     | Yes\*    | Direct (non-pooled) connection used by Drizzle migrations and the seed script.                     |
| `SESSION_SECRET` | Yes      | Secret for signing session JWTs. Must be ≥ 32 characters. Generate with `openssl rand -base64 32`. |
| `TEST_PROD_URL`  | No       | When set, `pnpm test:smoke` runs a smoke test against that deployed URL.                           |

\* `DIRECT_URL` is required for `db:migrate` / `db:seed`; the runtime app only
needs `DATABASE_URL`. Env vars are validated at boot with Zod (`src/lib/env.ts`)

- the app fails fast with a clear message if anything is missing.

## Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Start the dev server                             |
| `pnpm build`       | Production build                                 |
| `pnpm start`       | Serve the production build                       |
| `pnpm lint`        | ESLint                                           |
| `pnpm test`        | Run all Vitest tests (unit + integration)        |
| `pnpm test:watch`  | Vitest in watch mode                             |
| `pnpm test:smoke`  | Production smoke test (requires `TEST_PROD_URL`) |
| `pnpm db:generate` | Generate a new migration from schema changes     |
| `pnpm db:migrate`  | Apply migrations                                 |
| `pnpm db:seed`     | Seed the demo account + assignment sample data   |

## How It Works

### Data model

Five tables:

- **users** - email (unique) + bcrypt password hash.
- **categories** - per-user, with a unique index on `(user_id, lower(name))`
  so category names are case-insensitively unique per user.
- **plans** - one row per `(user_id, category_id, month)` (unique), amount in
  cents.
- **actuals** - many rows per category/month (multiple spend entries allowed),
  amount in cents, optional note.
- **locks** - `(user_id, month)` primary key; a row's presence means that month
  is locked for that user.

Key modeling decisions:

- **Money is stored as integer cents** (`bigint`), never floats - all
  arithmetic is exact and formatting happens at the edge (`src/lib/money.ts`).
- **Months are stored as `text` in `YYYY-MM` format**, enforced by a `CHECK`
  constraint at the database level and by Zod at the application level. This
  avoids all timezone/day-boundary ambiguity that `date` columns would invite
  for month-granularity data.
- **All queries are scoped by `user_id`** - every table is owned by a user and
  the data-access layer (`src/server/dal.ts`) resolves the user from the
  session on every request.

### Variance calculation

For each category × month row:

```
Variance   = Actual − Plan          (negative = under plan)
Variance % = (Actual − Plan) / Plan × 100
```

**Plan = 0:** variance % is undefined (division by zero), so it is computed as
`null` and rendered as `-` never `NaN` or `Infinity`. The absolute variance
is still shown. See `src/lib/variance.ts`.

### Missing actuals

A row appears in the report only if a plan **or** an actual exists for that
category × month. When a plan exists but no actual has been logged:

- The row's **Actual**, **Variance**, and **Variance %** cells show `-`
  (the "show -" option from the assignment).
- **Monthly and grand totals treat the missing actual as 0**, since a total
  must be a concrete number. This means the totals row matches the
  assignment's sample math (e.g. Marketing Feb contributes −5,000 / −100%
  to the February totals).

This hybrid is deliberate: row-level `-` makes "nothing logged yet" visually
distinct from "logged $0", while totals still reflect the full planned spend.
The report's unit tests verify the sample data produces exactly the variances
from the assignment table.

### Locking

- **Granularity: one month** (per user). Locking is per-user - one user's
  locked month has no effect on anyone else.
- Locking/unlocking is a toggle on the Plans page; locked months are also
  indicated on the Actuals page.
- When a month is locked, **plans and actuals for that month become
  read-only**: create, edit, delete, and CSV import into that month are all
  rejected.
- **Enforcement is server-side.** Every plan/actual mutation checks the lock
  in the server action before writing and returns a clear error
  (e.g. "January 2026 is locked - actuals for locked months can't be
  edited.") - the UI hiding the controls is only a convenience. Lock
  enforcement is covered by integration tests
  (`tests/lock-enforcement.test.ts`).

### CSV import

Actuals can be bulk-imported from the Actuals page. Format (header row
required):

```csv
month,category,amount
2026-01,Marketing,4800
2026-01,Payroll,20500
```

Validation performed per row (all errors are reported together, nothing is
imported partially):

- `month` must match `YYYY-MM`.
- `category` must match one of **your** category names (case-insensitive).
- `amount` must be a non-negative number.
- The target month must not be locked.

A ready-to-use example file is at `public/sample-actuals.csv` (it matches the
assignment's sample data).

### CSV export

The report can be downloaded as CSV via the **Export CSV** button on the Report
page (or directly at `/report/export?from=YYYY-MM&to=YYYY-MM`). The export uses
the currently selected range and mirrors the on-screen table:

- One row per category × month (sorted by month, then category), plus a
  grand-total row.
- Amounts are plain decimal numbers (e.g. `5000.00`) - no currency symbols or
  thousands separators - so the file is machine-readable.
- Missing actuals leave **Actual / Variance / Variance %** empty (the CSV
  equivalent of the `-` shown in the UI), while the totals row still counts
  them as 0 - consistent with the report page.
- Plan = 0 leaves **Variance %** empty (never `NaN`/`Infinity`).
- Category names are escaped per RFC 4180 (commas/quotes/newlines are safe).

The endpoint is a Route Handler (`src/app/(app)/report/export/route.ts`) that
reuses the exact same query + aggregation pipeline as the report page, so the
CSV can never disagree with what's on screen. It requires an authenticated
session and returns `400` for malformed or reversed ranges.

### Authentication

- Sign up / log in with email + password.
- Passwords are hashed with **bcrypt** (cost 10) - never stored in plaintext.
- Sessions are **JWTs signed with `SESSION_SECRET`** (via `jose`), stored in
  an **httpOnly, Secure (in prod), SameSite=Lax** cookie - not accessible to
  client-side JS.
- Every protected page and server action goes through `verifySession()` in
  `src/server/dal.ts`, which redirects unauthenticated users to `/login`.

## Testing

```bash
pnpm test          # unit + integration
pnpm test:smoke    # smoke test against the deployed app (needs TEST_PROD_URL)
```

- **Unit tests** - pure domain logic: money formatting/parsing, month math,
  variance calculation (including plan = 0), and report aggregation. The
  report tests include an **oracle test** that feeds the assignment's sample
  data through `buildReport` and asserts the exact expected variances.
- **Integration tests** (`tests/`) - run against a real database: lock
  enforcement on plan/actual mutations, and report query correctness.
- **Smoke test** - verifies the deployed login page renders.

## Performance at scale

The dataset here is small, but the schema is designed so the report query
pattern stays cheap as data grows:

- **Indexes already in place:** `(user_id, month)` on both `plans` and
  `actuals`, and a unique `(user_id, category_id, month)` on `plans`. The
  report query is always "one user's rows within a month range", which these
  indexes serve directly.
- **At scale**, the next steps would be:
  - Aggregate actuals in SQL (`GROUP BY category_id, month`) instead of
    summing in application code, so only rolled-up rows cross the wire.
  - A materialized summary table (or Postgres materialized view) per
    user/category/month, refreshed on write, if report latency matters more
    than write amplification.
  - Partial index on `locks (user_id)` if lock checks show up in profiles
    (it's a PK lookup today, so this is unlikely to ever be the bottleneck).
- Months being `text` in `YYYY-MM` form keeps range filters (`month >= $1 and
month <= $2`) sargable - lexicographic order equals chronological order.

## Project structure

```
crosstracker/
├── drizzle/                  # Drizzle ORM migrations
├── public/                   # Public static assets (e.g., icons, images)
├── scripts/                  # Utility and build scripts
├── src/                      # Main application source code
│   ├── app/                  # Next.js App Router (Pages, API & Layouts)
│   │   ├── (app)/            # Authenticated application routes (actuals, plans, categories, report)
│   │   ├── (auth)/           # Authentication routes (login, signup)
│   │   ├── layout.tsx        # Root application layout
│   │   ├── not-found.tsx     # 404 Error page
│   │   └── page.tsx          # Main landing page
│   ├── components/           # Reusable React components
│   │   ├── actuals/          # Actuals-related feature components
│   │   ├── auth/             # Authentication-related components
│   │   ├── categories/       # Category management components
│   │   ├── plans/            # Plan-related feature components
│   │   └── ui/               # Generic shared UI components (e.g., shadcn/ui buttons, dialogs, etc.)
│   ├── hooks/                # Custom React hooks (e.g., use-mobile)
│   ├── lib/                  # Shared utilities and core domain logic
│   │   ├── env.ts            # Environment variables validation
│   │   ├── money.ts          # Currency and money handling utilities
│   │   ├── months.ts         # Date and month manipulation utilities
│   │   ├── report.ts         # Report generation logic
│   │   ├── utils.ts          # Generic UI utilities (tailwind class merging, etc.)
│   │   └── variance.ts       # Budget vs. Actuals variance calculations
│   ├── server/               # Server-side logic, Actions, and Database operations
│   │   ├── actuals/          # Actuals server actions & data access
│   │   ├── auth/             # Authentication server actions & data access
│   │   ├── categories/       # Categories server actions & data access
│   │   ├── db/               # Database connection and Drizzle ORM schemas
│   │   ├── locks/            # Data concurrency and locking mechanisms
│   │   ├── plans/            # Plans server actions & data access
│   │   └── reports/          # Report generation data fetching
│   └── proxy.ts              # Proxy configuration and routing utilities
├── tests/                    # Testing directory (Integration/E2E tests)
├── components.json           # shadcn/ui configuration file
├── drizzle.config.ts         # Drizzle ORM configuration
├── eslint.config.mjs         # ESLint configuration for code linting
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── pnpm-workspace.yaml       # PNPM workspace configuration
├── postcss.config.mjs        # PostCSS configuration for styling
├── tsconfig.json             # TypeScript configuration
└── vitest.config.mts         # Vitest configuration for unit testing
```

Domain logic (`src/lib`) is deliberately framework-free and pure, which is why
variance/report behavior can be unit-tested without a database or React.

## Assumptions & tradeoffs

- **Month granularity for everything.** The assignment's data is monthly, so
  months are first-class `YYYY-MM` values rather than dates. Locking is
  per-month (the assignment allowed month or quarter; month is the finer and
  more useful granularity here).
- **Multiple actuals per category/month are allowed** and summed in the
  report - logging spend is naturally incremental (several invoices in a
  month). Plans, by contrast, are a single upserted target per
  category/month.
- **Categories are per-user** (each user has full CRUD over their own list)
  rather than a shared global list - this keeps the "users only see their own
  data" rule trivially true and makes CSV category validation unambiguous.
- **Amounts are non-negative** (enforced by DB `CHECK` constraints). Refunds /
  negative spend were out of scope.
- **Currency is display-agnostic** - values are formatted as plain dollar
  amounts; no multi-currency support.
- **No email verification / password reset** - out of scope for the exercise;
  noted below as a pre-production gap.
- **Server Actions instead of a separate REST API** - the assignment is a
  single-user-facing app, and actions keep mutations colocated with
  type-safe validation. The lock/validation rules live server-side regardless
  of transport.

## What I would improve before production

1. **Email verification & password reset** flows (e.g. via Supabase Auth or a
   transactional email provider), plus rate limiting on auth endpoints.
2. **Row Level Security (RLS)** in Postgres as a second enforcement layer
   beneath the application-level `user_id` scoping.
3. **Audit log** for plan/actual edits and lock toggles (who changed what,
   when) - important once money-adjacent data is involved.
4. **Drill-down** (the assignment's remaining stretch goal): click a report
   cell to see the underlying actual entries.
5. **Fiscal year support** for the report range selector.
6. **E2E tests** (Playwright) covering the critical flows: signup → seed →
   plan → actual → lock → report.
7. **Observability**: structured logging, error tracking (Sentry), and slow
   query monitoring.
8. **Soft deletes** for categories (deleting a category today cascades to its
   plans/actuals; production would likely archive instead).

## Deployment

Deployed on **Vercel** (https://crosstrackers.vercel.app) with the Supabase
Postgres database. Environment variables (`DATABASE_URL`, `DIRECT_URL`,
`SESSION_SECRET`) are configured in the Vercel project settings; migrations
are applied via `pnpm db:migrate` against `DIRECT_URL`.
