# AVERON UI workflow and implementation roadmap

## Source of truth

Read `AVERON_DESIGN_SYSTEM.md` before changing any storefront or admin UI. `UI_AUDIT.md` records the current source-level baseline. Taste, Impeccable, Playwright, and Awesome DESIGN.md references support the work; they do not redefine AVERON's visual language or business rules.

## Workflow

1. Select the route, state, locale, and desktop/mobile viewport; read the design system and relevant audit rows.
2. Use Taste's audit-first/design-direction and preflight approach to decide hierarchy, image treatment, interaction, and responsive behavior.
3. Implement in existing components and CSS architecture. Use Impeccable's audit/refine commands to identify generic patterns and visual inconsistencies; reject any suggestion that conflicts with the canonical system or AVERON behavior.
4. Run local/test-data Playwright browser flows, including accessibility-facing controls and no-horizontal-overflow checks. Do not use production credentials or submit mutations against production.
5. Capture desktop (1440×900) and mobile (390×844) screenshots for changed routes/states. Review each screenshot and inspect console/network errors.
6. Fix findings, repeat the browser pass, run relevant unit/security regressions, then TypeScript/lint/build for the affected app.
7. Keep changes grouped by logical component/flow. Record completed routes, screenshots, test evidence, unresolved findings, and intentionally unchanged areas in `UI_IMPLEMENTATION_REPORT.md` after implementation is complete.

## Tool responsibilities

| Tool / method | Use | Guardrail |
|---|---|---|
| Taste Skill | Design direction, audit-first redesign framing, responsive/type/spacing preflight | Use the AVERON design system as the final authority |
| Impeccable | Deterministic anti-pattern audit and targeted visual refinement | Review the proposed edits; do not accept automatic color/type/layout changes that conflict with AVERON tokens |
| Playwright CLI / Playwright Test | Browser inspection, user-flow regression, screenshots, viewport/overflow checks | Local or dedicated test data only; no real orders, payments, publish actions, destructive actions, or production credentials |
| Awesome DESIGN.md | Learn reusable design-system principles and document AVERON's own rules | Do not copy a third-party brand, logo, wording, artwork, or full-page composition |

The existing `AVERON_security_tests` repository already contains `@playwright/test`, `playwright.config.ts`, and an initial hosted smoke spec. Extend this setup for application regression rather than creating a separate test repository or replacing the security suite. The CLI can be invoked through the existing Playwright package when its command surface is sufficient; install a separate CLI package only if a demonstrated workflow gap requires it.

Project-local Taste `redesign-existing-projects` and Impeccable skills are installed under `.agents/skills/` in both the storefront and admin repositories. Impeccable hooks are intentionally disabled; run the detector as a reviewed command on the settled changed files. Neither skill may rewrite the canonical design system or bypass the normal code review.

## Planned files

### Canonical documentation

- `AVERON_frontend/UI_AUDIT.md`
- `AVERON_frontend/docs/AVERON_DESIGN_SYSTEM.md`
- `AVERON_frontend/docs/UI_IMPLEMENTATION_ROADMAP.md`
- `AVERON_frontend/docs/UI_IMPLEMENTATION_REPORT.md` (write after the implementation phases)
- `AVERON_frontend/AGENTS.md` and `AVERON_admin_panel/ДЛЯ_АГЕНТОВ.md` (short links/rules so future UI work reads the canonical system)

### Likely implementation targets, by priority

| Priority | Storefront | Admin | Browser/security regression |
|---|---|---|---|
| P0 | `app/[locale]/globals.css`; `components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx`; `components/layout/Header.tsx`; `components/commerce/CatalogFilterLayout.tsx`, `ProductCard.tsx`, `ProductGallery.tsx`; catalog/product/cart/checkout routes and loading states | `src/index.css`; `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Modal.tsx`; `src/components/Layout.tsx`, `Sidebar/Sidebar.tsx`; `src/pages/LoginPage.tsx`, `pages/commerce/ProductsPage.tsx`, `ProductFormModal.tsx`, `OrdersPage.tsx`, `ImportsPage.tsx` | `AVERON_security_tests/e2e/`; `playwright.config.ts`; screenshot artifacts under `reports/generated/` |
| P1 | login/register/forgot-password/profile/favorites/compare/search, locale catalogs, shared feedback/loading/error states | routes/forms/tables/modals for user, settings, categories, media, audit log | locale/keyboard/overflow/console/network coverage for high-use flows |
| P2 | informational pages, shared secondary layouts, uncommon empty/error states | analytics/system/settings secondary pages | representative secondary-route visual baselines |

The actual file list must be narrowed to the route group being implemented. Do not rewrite all pages or backend/API contracts as part of visual work. Preserve the working-tree changes present in the storefront, admin, and security repositories; inspect diffs before editing any already-modified file.

## Phases and gates

- **A — Audit:** source review recorded in `UI_AUDIT.md`; no visual fixes in this phase.
- **B — System:** canonical tokens and component rules recorded in `docs/AVERON_DESIGN_SYSTEM.md`.
- **C — Tokens:** map the current app tokens to the documented palette/type/spacing/radius/motion and test dark/light parity.
- **D — Core components:** buttons, inputs, menus, modals, loading, feedback, and product card; preserve existing props and API interactions.
- **E — Storefront P0:** header, catalog/filters, product detail, cart, checkout; verify RU/UZ/EN and desktop/mobile.
- **F — Admin P0:** login, products/editor/publishing review, orders; preserve admin authorization and publication approval flows.
- **G — Browser regression:** add read-only, test-data Playwright coverage for storefront and critical admin journeys.
- **H — Visual review:** review desktop/mobile screenshots and fix observed defects.
- **I — Regression:** rerun relevant unit/security checks, TypeScript, lint, builds, and browser checks; report known skips and environment limits.
- **J — Report:** create `UI_IMPLEMENTATION_REPORT.md` with actual changes and evidence. Do not mark a phase complete from a build or commit alone.

## Change boundaries

- No 3D unless explicitly approved for a scoped feature. The virtual fitting room was explicitly approved on 2026-10-08; its first release uses manually uploaded, reviewed GLB assets and does not enable `img2threejs` or local AI generation.
- No new repository; no wholesale CSS framework migration.
- Do not modify database, Fastify architecture, parser, authentication, payment, order logic, Telegram integrations, or deployment infrastructure for a UI-only task.
- Keep AI/parser product imports in human-reviewed `PENDING_REVIEW`; do not make AI publish products.
- Keep customer orders and supplier purchases separate; preserve backend-calculated totals and actual/expected profit distinction.
- Playwright is read-only in production. Use fixtures or non-production credentials for any authenticated interaction tests.
