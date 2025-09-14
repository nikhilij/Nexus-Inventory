```markdown
# Nexus Inventory — Next.js Technical Guide (Before Development)

Purpose
- This document gives your team a single, detailed reference for building the Next.js frontend and API surface for Nexus Inventory. It covers setup, architecture, libraries, folder structure, data flow patterns, auth, testing, CI/CD, performance, deployment and recommended development milestones. Use it as the canonical "how to start" and "what to use" guide before development begins.

Audience
- Frontend engineers, full-stack engineers, devops, product managers, and QA who will implement or review the Next.js parts.

Assumptions / High-level decisions (choose before you start)
- Next.js (App Router, Server Components) — recommended: Next.js v13+ App Router.
- TypeScript mandatory.
- UI styling with Tailwind CSS plus a headless UI/Radix primitives + component library (shadcn/ui, Chakra or Material if you prefer).
- Backend data layer: Prisma + PostgreSQL for core relational entities. Use Redis for queues & caching.
- Auth: NextAuth.js or Clerk (SSO support via SAML/OIDC if enterprise required).
- Deployment: Vercel for Next.js (recommended). For full control or microservices, use AWS/GCP/Azure.
- Monorepo optional: pnpm workspaces (recommended for shared types & packages).
- Package manager: pnpm (fast, reproducible), yarn or npm acceptable.

Getting started — environment and dev-machine setup
1. Install Node.js LTS (recommended 18+ or 20+) and pnpm.
2. Create repository / monorepo:
   - If monorepo: pnpm workspace with packages/apps structure (apps/web = Next.js app).
3. Initialize Next.js + TypeScript:
   - npx create-next-app@latest --typescript --app
4. Install base tooling:
   - pnpm add -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
   - pnpm add tailwindcss postcss autoprefixer
   - pnpm add prisma @prisma/client
   - pnpm add react-query @tanstack/react-query (or use React Query replacement like TanStack Query)
   - pnpm add axios or use fetch with cross-fetch if needed
   - pnpm add next-auth (or clerk)
   - pnpm add react-hook-form zod (validation)
   - pnpm add lucide-react or heroicons (icons)
   - pnpm add radix-ui @radix-ui/react-* (if using Radix primitives)
   - pnpm add shadcn/ui (optional, if using shadcn patterns)
   - pnpm add bullmq ioredis (if using Redis queue)
   - pnpm add sentry-nextjs (error monitoring)
   - pnpm add vitest @testing-library/react @testing-library/jest-dom cypress/playwright (testing)

Project structure (recommended)
- /apps
  - /web (Next.js app)
    - app/
      - (route folders + layout.tsx + page.tsx)
      - api/ (route handlers for server-side work)
    - components/ (reusable components, keep small & focused)
    - features/ (colocated feature folders e.g., features/products)
    - lib/ (api clients, prisma client wrapper, helpers)
    - hooks/ (custom hooks)
    - types/ (shared TS types/interfaces)
    - styles/ (global css, tailwind config)
    - prisma/ (schema.prisma, migrations)
    - scripts/ (seed, migration helpers)
    - tests/ (unit & integration)
- /packages
  - /ui (shared component primitives)
  - /api-types (shared types between server & client)
  - /design-system (optional)

Naming conventions & guidelines
- kebab-case folders, PascalCase for React components.
- prefix client components with use client directive at top of file.
- keep server components for pages that fetch data and render on server.
- "features" folders contain domain-specific code (e.g., features/products/ui, features/products/hooks).

Routing & data fetching (App Router)
- Use the App Router for layouts, nested routes, React Server Components.
- Server Components:
  - Default files in app/ are server components.
  - Use server components to fetch data with direct DB calls (via server-only helpers) or server API calls and render HTML.
- Client Components:
  - Add "use client" when needed (interactivity, hooks).
  - Keep client components small; fetch data at higher-level server components where possible.
- Route Handlers (app/api/*/route.ts):
  - Use for server-only endpoints (webhooks, server-side actions, third-party API proxies).
  - Prefer server actions for simple server-side mutations when appropriate (stability considerations; evaluate project needs).
- ISR / SSG / SSR:
  - Use SSG/ISR for catalog pages with predictable updates.
  - Use SSR for dashboards or user-specific pages requiring fresh data.
  - Use caching headers and revalidation when using edge or CDN.

Data layer & API strategy
- Option A (Monolithic Next.js):
  - Use Prisma + PostgreSQL from server components or route handlers (server-only).
  - Keep business logic in a services layer (lib/services) so route handlers call services.
- Option B (Separate API):
  - Build a dedicated Node/Express/Fastify microservice (or NestJS) for complex business logic and expose GraphQL/REST.
  - Next.js becomes frontend only and consumes API.
- Recommended: Start monolithic for MVP (faster iteration), split into microservices once scale/latency requirements demand it.

Prisma models — sample schema (start)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
model Company {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  users     User[]
  warehouses Warehouse[]
}
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      String
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
}
model Product {
  id          String   @id @default(uuid())
  name        String
  sku         String   @unique
  barcode     String?
  description String?
  variants    Json?
  minStock    Int      @default(0)
  createdAt   DateTime @default(now())
  inventory   InventoryItem[]
}
model InventoryItem {
  id          String   @id @default(uuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  warehouseId String
  quantity    Int
  batch       String?
  expiryDate  DateTime?
  lastUpdated DateTime @updatedAt
}
```

State management & client cache
- Server-as-source-of-truth, use React Server Components + Suspense for initial data.
- For client state / optimistic updates, use TanStack Query (React Query) — caches, background refetch, optimistic updates.
- For light local UI state (sidebars, modals): use React context or Zustand.
- For complex global state (not common): Redux Toolkit Query (RTKQ) is an option.

Forms & validation
- React Hook Form + Zod (validation schemas).
- Use controlled forms sparingly; favor RHF for performance.
- Add server-side validation duplicate for security.

UI & design system
- Tailwind CSS for utility-first styling.
- Base components: Button, Input, Select, Table, Modal, Toast, Icon.
- Use Radix UI + shadcn scaffolding for accessible primitives.
- Keep tokens in a theme file / design-system package for reuse.

Authentication & Authorization
- Use NextAuth.js for most SaaS needs (supports OAuth2, SAML via providers, credentials).
- For enterprise SSO: Clerk or commercial SSO providers if needed.
- Protect both client routes (middleware) and server APIs.
- Middleware (app/middleware.ts) for route-level auth and redirects.
- RBAC:
  - Attach role + permissions to user object.
  - Enforce on server (route handlers/services) and in UI (hide/disable actions).
- Session storage: use secure cookies (httpOnly) with SameSite configured.

File & media handling
- For images and attachments use S3 (or S3-compatible) with presigned uploads from server route.
- Use next/image for optimization, but be mindful when using external CDNs — add to next.config.js.

Background jobs & async tasks
- Use BullMQ + Redis for job queues (e.g., reordering, analytics jobs, sync tasks).
- If serverless-only: use managed queue services (AWS SQS + Lambda workers) or background job worker containers.

AI integrations
- Keep AI calls on server (server-only routes) to hide API keys and handle billing.
- Use streaming for long-running AI responses where appropriate.
- Cache deterministic results; rate limit and monitor usage.
- Consider a separate microservice for heavy model inference (SageMaker / GCP Vertex / private inference).

Telemetry, logging & observability
- Integrate Sentry for error tracking.
- Use structured logs to a provider (Datadog, Logflare) — include request IDs.
- Collect performance metrics (Lighthouse, web-vitals).
- Use tracing (OpenTelemetry) for backend traces.

Security best practices
- Store secrets in Vercel/Cloud provider secret manager.
- Use CSP headers, secure cookies, XSS/CSRF mitigations.
- Validate and sanitize all user inputs server-side.
- Rate-limit sensitive endpoints, implement brute-force protections.
- Use dependency vulnerability scanning (GitHub Dependabot).

Testing strategy
- Unit tests: Vitest or Jest + React Testing Library.
- Integration tests: Playwright (browserflows) and API-level tests (supertest).
- E2E: Cypress or Playwright for critical flows (login, picking, stock adjustment).
- Contract tests: If microservices, use Pact or similar tools.
- Add CI job to run tests for every PR.

Performance optimizations
- Use server components for heavy rendering.
- Optimize images, fonts (use next/font), and preconnect critical origins.
- Use CDN caching and proper cache headers.
- Lazy-load non-critical components and use code-splitting.
- Monitor bundle size (next-bundle-analyzer).

Accessibility
- Use semantic HTML and ARIA where necessary.
- Automate a11y checks in CI using axe/core.
- Manual testing with keyboard and screen reader selection.

Internationalization (i18n)
- If multi-language: next-intl or built-in Next.js i18n routing.
- Keep copy in JSON files and use keys for translation.
- Support locale-specific dates/currency.

CI/CD and Release
- GitHub Actions pipeline:
  - lint, typecheck, unit tests
  - build preview and deploy to Vercel preview
  - run E2E tests against preview deployment
- Deploy to Vercel main branch for production or to AWS using container images.
- Use feature-flagging (LaunchDarkly or simple flags in DB) for gradual rollout.

Dev & DX tools
- Storybook for components (recommended).
- VS Code devcontainer or a docker-compose for local infra (Postgres, Redis).
- Seed scripts and test-data factories for local dev.
- Local mock server for third-party APIs.

Example Next.js snippets (App Router)

Server Component page (app/dashboard/page.tsx)
```tsx
// app/dashboard/page.tsx (server component)
import { getUser } from "@/lib/session";
import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const user = await getUser();
  const data = await getDashboardData(user.companyId);

  return (
    <main>
      <h1>Welcome back, {user.name}</h1>
      <section>{/* render charts & metrics */}</section>
    </main>
  );
}
```

Client Component with TanStack Query (components/InventoryGrid.tsx)
```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchInventory } from "@/lib/api";

export default function InventoryGrid({ warehouseId }: { warehouseId: string }) {
  const { data, isLoading } = useQuery(["inventory", warehouseId], () => fetchInventory(warehouseId));
  if (isLoading) return <div>Loading...</div>;
  return <div>{/* render table */}</div>;
}
```

Route handler (app/api/products/route.ts)
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const products = await prisma.product.findMany({ take: 100 });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  // validate body...
  const created = await prisma.product.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
```

Development checklist before coding sprint
- [ ] Confirm Next.js version and App Router usage
- [ ] Decide monolith vs microservices approach for backend
- [ ] Choose packages for UI primitives (Radix/shadcn) and design tokens
- [ ] Provision development infra (local Postgres, Redis)
- [ ] Create initial Prisma schema and run migrations
- [ ] Setup authentication provider (NextAuth or Clerk) and SSO flows if required
- [ ] Set up CI pipeline, Vercel preview integration
- [ ] Create seed data & dev database restore script
- [ ] Define initial API contracts (OpenAPI or GraphQL schema)
- [ ] Create basic layout & design tokens, base components, Storybook skeleton
- [ ] Agree code conventions & create ESLint/Prettier config and commit hooks (husky)

Milestones / Suggested roadmap (first 8 weeks)
1. Week 1: Project scaffolding — Next.js app, TypeScript, Tailwind, ESLint, commit hooks, CI skeleton.
2. Week 2: Auth + RBAC + company onboarding flows + seed data.
3. Week 3: Core data models & Prisma migrations (Product, InventoryItem, Warehouse, User).
4. Week 4: Basic UI components + product listing pages + inventory view (server components).
5. Week 5: CRUD for products + API routes + tests.
6. Week 6: Warehouse transfers + stock movement logging + optimistic UI updates.
7. Week 7: Background jobs (Redis & BullMQ) + simple reorder automation demo.
8. Week 8: End-to-end tests, performance checks, deploy to Vercel preview & production.

Operational concerns
- Migrations & backups: database automated backups & review migration process.
- Access control to environments: limit production secrets to few maintainers.
- Data retention & GDPR: implement data deletion workflows.
- Cost controls: monitor AI/third-party API usage.

Common pitfalls & mitigations
- Putting secret keys in client bundles — always call third-party APIs from server routes.
- Overusing client-side state vs. Server Components — prefer server rendering for initial fetches.
- Tight coupling of UI and business logic — create service layer and typed contracts.
- Missing telemetry on heavy AI calls — add tracking & quotas.

References & recommended reading
- Next.js official docs: https://nextjs.org/docs
- Prisma docs & patterns: https://www.prisma.io/docs
- TanStack Query docs: https://tanstack.com/query
- React Hook Form + Zod patterns
- NextAuth docs for authentication best practices

Appendix — sample package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "e2e": "playwright test",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

What's included in this document
- A full pre-development plan for the Next.js parts of Nexus Inventory, recommended stack, sample code, infra, security and testing guidance, CI/CD and suggested milestones.

What's next (to execute)
- Pick the exact Next.js version and confirm App Router usage.
- Decide on monolith vs separate API boundary for your team.
- I'll produce a ready-to-run project scaffold (package.json, next.config, tailwind, prisma schema, ESLint/Prettier config, example page & API routes, seed script) if you want — say "scaffold" and I will generate the files for the repository.

```