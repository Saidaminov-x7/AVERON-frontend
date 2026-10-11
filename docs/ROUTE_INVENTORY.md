# AVERON route inventory

Date: 2026-10-09. Source: current storefront App Router tree and admin React Router tree. The frontend build's `scripts/discover-routes.mjs` reported **32 page routes** (31 localized route patterns plus `/`). `app/[locale]/api/page-routes/route.ts` is a route endpoint, not a page. Locale variants expand localized routes to RU, UZ, and EN.

This is a source inventory, not a claim that every route or action passed browser acceptance. Browser and automated coverage is listed in `UI_QA_MATRIX.csv`.

## Storefront page routes

| Route pattern | Notes |
|---|---|
| `/` | Default-locale entry/redirect; browser redirect behavior not audited in this pass. |
| `/{locale}` | Localized home. |
| `/{locale}/about` | Localized content page. |
| `/{locale}/ai` | AI assistant. |
| `/{locale}/cart` | Cart. |
| `/{locale}/catalog` | Catalog, query-driven filters and pagination. |
| `/{locale}/catalog/[id]` | Product detail; identifier may be public ID or slug. One live product link was observed, but detail actions were not tested. |
| `/{locale}/chat` | Customer chat. |
| `/{locale}/checkout` | Authenticated checkout; no submission performed. |
| `/{locale}/checkout/success/[orderNumber]` | Dynamic order number; no real order number was available for this read-only audit. |
| `/{locale}/compare` | Product comparison. |
| `/{locale}/delivery` | Localized content page. |
| `/{locale}/faq` | Localized content page. |
| `/{locale}/favorites` | Favorites. |
| `/{locale}/forgot-password` | Password recovery; submission not tested. |
| `/{locale}/how-to-order` | Localized content page. |
| `/{locale}/login` | Customer login; authentication not attempted. |
| `/{locale}/maintenance` | Maintenance page. |
| `/{locale}/mini-app` | Telegram Mini App surface. |
| `/{locale}/orders` | Customer orders; guest/owner states not tested. |
| `/{locale}/orders/[orderNumber]` | Dynamic order number; no real identifier was available. |
| `/{locale}/outfits` | Outfit builder. |
| `/{locale}/pages/[slug]` | Dynamic CMS page slug; not enumerated from live content. |
| `/{locale}/privacy` | Localized legal page. |
| `/{locale}/profile` | Protected customer profile. |
| `/{locale}/public-offer` | Localized legal page. |
| `/{locale}/register` | Customer registration; submission not tested. |
| `/{locale}/reset-password` | Reset-token route; no token was invented or submitted. |
| `/{locale}/returns` | Localized content page. |
| `/{locale}/size-guide` | Localized sizing guide. |
| `/{locale}/support` | Support. |
| `/{locale}/terms` | Localized legal page. |
| `/{locale}/wishlist/shared/[token]` | Shared wishlist token; no token was invented. |

## Admin route patterns

Source: `AVERON-admin-panel/src/App.tsx`. Routes are protected by the app's `Guard` except `/login`; `/settings` redirects to `/settings/general`; `/settings/staff` adds a `SUPER_ADMIN` UI guard. Backend RBAC remains authoritative and was not tested with authenticated roles.

Local browser evidence (2026-10-09): the 25 listed admin paths, including redirect and not-found, were visited directly and rendered at desktop Chromium 1440×900 and mobile Chromium 390×844 using only the loopback SUPER_ADMIN fixture account (`admin@averon.local`). Both sweeps passed main-content visibility, no 5xx, no uncaught page errors and no horizontal overflow (50 route/viewport visits). Separate fixture actions verified promo-code create → 201 → refreshed visible row and product wizard final-only create at desktop/mobile: all six steps had zero writes, final double-click sent one UUID-keyed create with localized fields and photo reference, then the exact fixture product was deleted. This remains loopback-fixture evidence, not persisted database evidence, backend ACL acceptance or production proof; other route business actions remain incomplete.

`/`, `/login`, `/products`, `/products/new`, `/products/edit/:identifier`, `/categories`, `/imports`, `/orders`, `/reviews`, `/finance`, `/commerce/promo-codes`, `/media`, `/users`, `/users/:id`, `/audit-log`, `/visual-search/audit`, `/notifications`, `/analytics`, `/error-logs`, `/profile`, `/settings`, `/settings/general`, `/settings/staff`, `/system/health`, `/system/integrations`, and `*` (not-found).

## Query, redirect, and access cases to retain in the test manifest

- Catalog query state includes search, category, audience, country, size, color, min/max price, sort, and page.
- Root locale redirect, product identifiers, order number routes, CMS slug route, shared wishlist token, password reset token, and admin edit/user identifiers are dynamic or guarded cases.
- No order IDs, reset tokens, wishlist tokens, real credentials, or customer data were fabricated. The fixture-only admin credentials are synthetic and scoped to the loopback fixture. Promo-code create is tested against that in-memory fixture; other owner/admin success states and mutation actions remain `NOT_TESTED`.
- New route/action discovery is not currently enforced by an end-to-end coverage manifest. The checked-in Playwright suite is smoke coverage only.
