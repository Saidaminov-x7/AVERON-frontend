# QLO and AVERON visual comparison

Date: 2026-10-09. Read-only pages: [QLO catalog](https://qlo.kz/catalog) and [AVERON RU catalog](https://averon-frontend-three.vercel.app/ru/catalog). Both were captured with Playwright Chromium at **1440×900, device scale factor 1**, after waiting for a visible catalog image. This compares the same page type at the same viewport. QLO is a visual reference only; AVERON business rules, locale, currency, content, and identity remain unchanged.

## Measured image behavior

| Site | Source image | Rendered image | `object-fit` / position | Result |
|---|---:|---:|---|---|
| QLO catalog | 1200×1600 (3:4) | 228×304 (3:4) | `cover`, 50% 50% | Product subject fills the card with no blank band. |
| AVERON catalog | 499×1080 (0.462:1) | 344×459 frame | `contain`, 50% 50% | Portrait source leaves side space. |
| AVERON catalog | 1920×1080 (16:9) | 344×459 frame | `contain`, 50% 50% | Landscape source leaves large top/bottom bands. The same source was served for multiple different product titles. |

The AVERON frame already reserves 3:4 geometry and avoids layout shift. The mismatch is in the underlying media and the absence of a separately selected catalog cover. Applying `cover` to every original would crop supplier/product details, so the remedy needs a per-product crop choice and full original gallery media.

## Layout and hierarchy

- Before the isolated fix, QLO showed four product columns beside its filter column while AVERON showed three. In the isolated clone, the catalog content max width is now 1344px with 4 columns from 1280px upward. At 1440px, the resulting card media is approximately 229×305px from the CSS geometry, close to QLO's measured 228×304px. This is a layout calculation, not a post-change live measurement: the local catalog API returned an error and no product cards rendered during browser verification.
- Sorting moved from the bottom of the filter panel to the top of the product area, matching the reference hierarchy. It updates the URL while preserving selected filters and resetting pagination. The desktop filter is now a bounded, bordered panel; long filters can scroll within it.
- Both pages keep the product title and price directly under the image, expose filters and sorting, and use a restrained white surface. AVERON uses UZS and RU/UZ/EN; QLO's KZT/Kazakhstan checkout language and content were not copied.
- AVERON's sticky header is functional and the catalog had no horizontal overflow at 1440×900. QLO and AVERON labels and filters differ because their catalog data and markets differ.

## Evidence

- `../AVERON_security_tests/reports/generated/ui-reference/qlo-catalog-1440x900.png`
- `../AVERON_security_tests/reports/generated/ui-reference/averon-catalog-1440x900.png`
- `../AVERON_security_tests/reports/generated/ui-reference/comparison.json`

The live screenshot shows test-like AVERON product names and repeated landscape media. These records were not altered during this audit. The isolated code changes are not deployed. Product source photos still need review; global `cover` would crop some current portrait and landscape sources.

## Current browser recheck — 2026-10-09

Chrome DevTools opened QLO `/catalog` and the isolated AVERON `/uz/catalog` at the same measured 1278×900 viewport. QLO rendered four product columns with filters visible and had `scrollWidth=1263`; AVERON initially rendered only three columns after filters were hidden (`gridTemplateColumns=382.656px 382.672px 382.656px`). The cause was a hidden-filter CSS override limited to 1280px and configured as five columns, so the common 1278px desktop state fell back to three columns.

The override now applies at 1024px and uses four columns. A loopback-only Playwright test clicked the live filter toggle, verified `aria-expanded=false`, measured exactly four computed grid tracks, checked no horizontal overflow and no HTTP 5xx, and saved `../AVERON_security_tests/reports/generated/playwright-results/storefront-smoke-local-des-6b4d6-mns-when-filters-are-hidden-desktop-chromium/catalog-hidden-filters-four-columns-1278x900.png`. The fixture has four products but intentionally empty image arrays, so this confirms layout/price hierarchy, not real image crop or image-quality parity. The page was built with `NEXT_PUBLIC_API_URL=http://127.0.0.1:4100`; the browser's external requests were blocked by the test.

## Product-detail continuation — 2026-10-09

Chrome DevTools inspected the live QLO catalog at `/catalog` and compared its product-information hierarchy with the AVERON local product detail. The reference hierarchy informs AVERON's explicit brand/article line, named selected color and size, separate composition/care section, compact quantity-plus-purchase row, and size table. AVERON keeps its own design, product data, RU/UZ/EN labels, UZS, logo and interactions rather than copying QLO's brand or content.

On the 360×800 local AVERON detail, the full-page capture shows the gallery, `AVERON`, `AVR-000000000000001`, named color/size, quantity and sign-in action in one row, composition/care, size chart and footer without horizontal overflow. Playwright verifies the same metadata/purchase layout at desktop and mobile (2/2); the customer CTA is a sign-in link in the unauthenticated fixture, not proof of an authenticated cart mutation. Article ID format and localized composition/care save path are implemented, but the additive database migration and authenticated PostgreSQL save/reload are not yet verified or deployed.
