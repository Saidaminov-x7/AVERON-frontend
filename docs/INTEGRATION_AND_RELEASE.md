# AVERON integration and release status

Updated: 2026-10-09. Production deployment is explicitly excluded until separate approval.

## Current local gate state

| Gate | Status | Evidence |
|---|---|---|
| CODE | ЧАСТИЧНО | sale filter, product-create idempotency, Telegram retry proof, variant matrix, protected +998 input implemented in isolated/frontend-admin and backend checkouts |
| BUILD | ВЫПОЛНЕНО for changed apps | backend API, isolated admin and isolated frontend production builds passed |
| UNIT / INTEGRATION | ВЫПОЛНЕНО for changed apps | backend 349/349, admin 60/60, frontend 147/147; backend type-check/build, admin lint/build, frontend lint/build passed (known warnings documented) |
| SECURITY | НЕ ПРОВЕРЕНО on current combined SHAs | no current combined-SHA security-suite run |
| E2E | ЧАСТИЧНО | focused Chrome fixture journeys recorded; full manifest denominator not executed |
| STAGING | НЕ ПРОВЕРЕНО | no staging deployment requested or performed |
| SMOKE | НЕ ПРОВЕРЕНО | requires staging artifact |
| PRODUCTION APPROVAL | ЗАБЛОКИРОВАНО | separate explicit user approval is required |
| ROLLING DEPLOY | ЗАБЛОКИРОВАНО | production approval and prior gates required |
| HEALTH CHECK | ЗАБЛОКИРОВАНО | no deployment |
| RELEASE RECORDED | ЗАБЛОКИРОВАНО | no release |

## Changed repository scope

- `AVERON_backend`: additive Prisma migration for manual-product idempotency; product query, create, variant, Telegram, fitting-room role/audit and GLB validation tests/logic.
- `AVERON-clones/AVERON-admin-panel`: create request key/single-flight, sizes-array contract, deterministic local product fixture.
- `AVERON-clones/AVERON-frontend`: sale UI/API contract, local catalog fixture, variant selector, phone field, QA/status artifacts.
- Current product-detail continuation: isolated frontend/admin/backend clones now render and edit localized composition/care, localize selected color names, show `AVR-` + 15-digit public article/route IDs, preserve legacy ID lookup in the backend migration, and keep quantity/primary action adjacent. Security-test Playwright metadata suite passes 2/2 desktop/mobile against the loopback fixture. The database migration is not applied and the changes are not pushed/deployed.
- Parser and security-test repositories were inspected but not modified in this package set.

## Required continuation before release

1. Complete remaining rows in `REQUIREMENTS_TRACEABILITY.csv` and the route/action denominator.
2. Run the independent security and E2E repositories against the exact combined commits.
3. Prepare scoped commits/PRs without absorbing unrelated dirty-tree work.
4. Deploy to staging/preview, run smoke and rollback proof.
5. Stop for explicit production approval. Do not infer approval from this document.
