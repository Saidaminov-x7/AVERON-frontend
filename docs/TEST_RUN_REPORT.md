# AVERON test run report

Date: 2026-10-10. This report accumulates scoped local verification. Production was inspected read-only and was not changed or deployed.

## Product detail resilience and purchase continuity — 2026-10-10

- `ProductReviews` now validates the complete response shape before rendering review items. A malformed 200 response becomes the existing localized reviews error state instead of throwing from `.items.map` and collapsing the product detail page. Targeted Vitest: 3/3; ESLint and `tsc --noEmit` passed.
- Browser E2E against current-source Next dev and a loopback product fixture: malformed reviews payload preserved the product detail and showed the panel alert on desktop/mobile (2/2); registration purchase continuation and exactly-one cart add also passed desktop/mobile (2/2). New E2E has no persistent API writes. Production build passed TypeScript and generated all 87 static outputs.
- Full isolated frontend Vitest after this change: 41 files / 180 tests passed. Existing test-runner notices included a jsdom “navigation not implemented” diagnostic and Three.js CommonJS deprecation; neither failed a test.
- Full-page screenshots saved in `AVERON_security_tests/reports/generated/playwright-results/*/product-reviews-invalid-response.png`; the mobile state was visually checked with the product purchase controls still available above the localized reviews alert. Chrome DevTools MCP `list_pages` timed out again; Playwright provided the browser evidence. No push/deploy.

## R02 disposable test environment availability — 2026-10-10

- Read-only host checks found no `docker` CLI, TCP 127.0.0.1:5432 refused, and TCP 127.0.0.1:6379 refused. No PostgreSQL/Redis-backed integration fixture was run or claimed. R02 remains `НЕ ПРОВЕРЕНО`; continue independent work and only run destructive fixture cleanup against an explicitly disposable, run-scoped database.

## Mobile drawer redesign — 2026-10-09

Isolated frontend clone (`codex/catalog-color-ui`, dirty working tree): `rtk pnpm exec vitest run` passed 39 files / 168 tests; `rtk pnpm build` passed TypeScript and generated 87 static outputs / 32 route patterns; targeted ESLint for `components/layout/Header.tsx` passed. Chrome DevTools inspected the rebuilt production server at 390x844 dark, 360x640 light, 768x900 dark, and 1280x800 light. Drawer is capped at 400px and leaves the page visible under the backdrop; narrow viewport has no horizontal overflow; center content scrolls independently while auth/locale/theme actions remain available; Escape closes and restores focus; resizing to desktop closes the drawer and unlocks body scroll. Console inspection found no drawer error; the local page's automatic analytics preflights to the production API were rejected by CORS, and anonymous auth checks returned 401. No analytics event POST was accepted; production app and authenticated journeys were not changed or claimed verified.

Permanent security E2E follow-up (`AVERON_security_tests/e2e/mobile-navigation.spec.ts`): 6/6 desktop/mobile Chromium cases passed against loopback `http://127.0.0.1:3121`. Covered 320x568, 360x640, 390x844, 414x896, 768x1024, 1023x768 and the 1024px desktop transition; dark/light contrast, footer and inner scroll, keyboard trap, Escape/focus restore, RU→UZ, search query, market/catalog links and guest favorites safe-return behavior. The test fails closed for non-loopback base URLs and blocks third-party HTTPS browser requests. Security policy tests 48/48 and syntax build 40 files pass. No backend database or production mutation is used.

## Automated gates

| Repository | Command / gate | Result |
|---|---|---|
| backend | commerce schema and route tests with test-only PostgreSQL/Redis/JWT values | 57/57 passed |
| backend | `pnpm --filter api type-check` | passed |
| backend | `pnpm --filter api build` | passed |
| isolated frontend | targeted product/storefront tests | 22/22 passed |
| isolated frontend | full Vitest suite after fitting-room integration | 147/147 passed |
| isolated frontend | full lint | exited 0; 12 warnings, including existing `<img>` optimization and unused error params in viewer |
| isolated frontend | production build/typecheck | passed; 32 routes and 87 static outputs; upstream sitemap fetch logged HTTP 429 but route generation completed |

## Browser acceptance

The local Next.js app was connected to a deterministic loopback API fixture with four products: two genuine discounts, one regular item and one invalid `compare == sale` item.

| Viewport | Theme | Checks | Result |
|---|---|---|---|
| 1440×900 | light | home sale link, URL, selected checkbox, exact result count/cards, overflow | passed |
| 768×1024 | light | responsive catalog, selected checkbox, exact result count/cards, overflow | passed |
| 390×844 | light and dark | mobile layout, filter selection, actual React click, reset and URL cleanup | passed |
| 360×800 | dark | exact result count/cards, selected filter and horizontal overflow | passed; document width equals viewport width |

The exact fixture result was 2 of 4 products. Both genuine discounts rendered; the regular item and `compare == sale` item were excluded. This checks the UI contract and fixture behavior; backend repository tests separately prove that the same predicate is applied to rows and count before pagination.

## Cross-repository local Playwright smoke

- `AVERON_security_tests` ran with explicit loopback URLs `http://127.0.0.1:3100` and `http://127.0.0.1:3200`: 18 passed, 2 desktop/mobile-inapplicable cases skipped, 0 failed across 20 project cases. It includes localized route rendering, overflow, filters, admin login, SMS-unavailable/+998 login state, guest fitting-room rotation/layers/totals/fallback/close, and gallery open/zoom/next/Escape/focus restoration/scroll lock on desktop and mobile. Gallery screenshots: `AVERON_security_tests/reports/generated/playwright-results/storefront-smoke-local-sto-dc336-and-restores-focus-on-close-desktop-chromium/storefront-product-gallery-zoom.png` and the matching `mobile-chromium` output. Fixture-backed only; authenticated cart, persisted backend state and the complete action manifest remain unverified.
- This checkout ran under Node 24.19.0 although the test repository declares Node 22.x; pnpm emitted the unsupported-engine warning. The result is useful local smoke evidence, not a release/CI gate.

## Console and network notes

- The unconditional local `upgrade-insecure-requests` CSP behavior was fixed and `127.0.0.1` added to allowed development origins; controls now hydrate and respond to real clicks.
- Chrome reports hydration mismatches whose differing attribute is `bis_skin_checked`. That attribute is injected by the DevTools/browser extension and does not occur in the application source. This is environment-specific and remains a clean-browser follow-up, not a claimed application regression.
- No production mutation, authenticated customer action, admin write, Telegram send, order, payment, upload or deployment was performed.

## Remaining full-program gates

This report does not mark the whole request complete. Telegram retry, phone input, all routes/actions/themes, real GLB upload/review/storage, authenticated fitting-room cart, security integration, staging smoke and release gates remain tracked in `REQUIREMENTS_TRACEABILITY.csv` and `IMPLEMENTATION_QUEUE.md`.

## Admin GLB upload/review UI E2E

- `AVERON_security_tests/e2e/ui-workflow.spec.ts`, desktop and mobile Chromium: 2/2 passed on 2026-10-09 against `http://127.0.0.1:3200` and loopback fixture `http://127.0.0.1:4200`.
- The test logs in through fixture auth, selects the generated local GLB via the isolated Playwright file chooser, verifies `multipart/form-data`, >100 request bytes, `BASE_TOP` mapping, the uploaded asset entering `NEEDS_REVIEW`, the explicit approve request and visible `APPROVED`, recorded fixture request data and no horizontal overflow.
- The user-facing Chrome extension denied local-file selection because its file-URL permission is off; browser policy prohibits changing the route/browser surface to bypass that. Playwright's own isolated Chromium is the allowed automation surface here.

## Product article, color, composition/care and purchase-row continuation (2026-10-09)

- Source checkouts: frontend `codex/catalog-color-ui` at `fba560790490f5bd059a0f2ac1ae266b70f32c4a`; backend clone `codex/product-cover-metadata` at `74dbdc67bb6cd627dfa688cac3f42e340dff57d5`; admin clone `codex/admin-visual-refresh` at `c0e89652d042faeeb63185832a26b6ee2578ee77`; security tests `codex/ci-cd-remediation` at `dfe45988600c910f4add76db0fb857e84c186810`. All feature changes remain uncommitted and unpushed.
- Frontend: `pnpm exec vitest run components/commerce/AddToCart.test.tsx` passed 10/10; targeted ESLint passed; production `pnpm build` passed with 32 routes and 87 generated outputs.
- Admin: `pnpm exec vitest run src/lib/commerceApi.test.ts src/pages/commerce/productFormValidation.test.ts` passed 18/18; `pnpm run build` passed (the existing lazy WebGL chunk-size warning remains).
- Backend: with test-only `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `REFRESH_SECRET`, commerce rules/schema/routes tests passed 75/75; API TypeScript check and Prisma-generated build passed; targeted ESLint had 0 errors and 4 existing `no-explicit-any` warnings.
- Browser: `AVERON_security_tests/e2e/product-detail-metadata.spec.ts` passed 2/2 desktop/mobile Chromium at `http://127.0.0.1:3122`, backed by loopback fixture API `http://127.0.0.1:4301`. Verified legacy fixture redirect to `AVR-000000000000001`, AVERON logo, article, localized dark-blue selection, composition/care text, quantity/CTA same-row geometry and no horizontal overflow. Light footer computed colors were white/dark; dark footer computed colors were `rgb(30,30,30)` / `rgb(242,243,243)`. Browser console had only expected unauthenticated `401` fixture responses after fixture CORS was configured for the local origin.
- The browser E2E is fixture-backed. No authenticated cart mutation or real database persistence was attempted. The public-ID Prisma migration was generated and inspected but not applied because no local PostgreSQL/Redis service or Docker CLI is available. Nothing was staged, pushed, or deployed.
- The fixture is deliberately not the production API: its accepted bytes are for UI transport/review only. Backend parser/security are unit-tested, but cloud storage, isolated database audit persistence and ACL/public read acceptance remain pending.

## Authentication return-path hardening

- `lib/safe-navigation.test.ts`: 18/18 passed, including open redirect, auth-loop, traversal, encoded path, locale mismatch, and legacy Google redirect cases.
- Google login now shares the validated same-locale destination resolver with the existing `returnTo` flow instead of trusting `startsWith('/')` and prefixing arbitrary input.
- Controlled OTP Playwright on loopback: desktop and mobile 2/2 passed. First verification returned a controlled invalid-code response and allowed correction; second successful response navigated to the exact `/ru/catalog?category=shoes&page=2` return target. API calls were intercepted locally; no SMS was emitted.
- Google OAuth provider interaction and broader real browser history/referrer/reload matrix remain unverified.
- Regression gates after this change: isolated frontend 36 files/151 tests passed; TypeScript passed; ESLint exited 0 with 12 existing warnings; Next production build generated all 87 static outputs/32 routes. Sitemap fetch returned HTTP 429 but static generation completed. Browser screenshots: `AVERON_security_tests/reports/generated/playwright-results/storefront-smoke-local-log-6324d-entials-without-sending-SMS-desktop-chromium/safe-return-after-otp.png` and matching `mobile-chromium` file.

## Fitting-room UI package (loopback fixture only)

- Storefront full suite: 147/147; lint exited 0 with 12 warnings; production build/typecheck passed (sitemap API returned 429 during static sitemap generation).
- Admin full suite: 60/60; lint exited 0 with 13 warnings; production build passed. Lazy preview chunk is 963.95 kB (257.11 kB gzip) and emits Vite's >500 kB chunk warning.
- Chrome storefront local fixture displayed the 3D asset on the neutral mannequin, rotation values 9° and 37°, added outerwear as another layer, updated total to 360,000 сум, removed it and restored 180,000 сум, and closed the dialog. Reopen then showed WebGL fallback.
- Fresh Chrome tab recovered a WebGL context and rendered the local GLB. Arrow controls reached exactly +60° and −60°; reset returned to 0°. Mouse drag changed the rotation and clamped at both boundaries. Touch gestures and authenticated cart remain unverified.
- Chrome admin local fixture showed step 5/6, model preview and a NEEDS_REVIEW asset. Approve and reject were both sent to the loopback fixture; status and rejection reason updated visibly. The user-facing Chrome extension refused local file selection because `Allow access to file URLs` is disabled. The same UI upload was subsequently verified with independent Playwright Chromium in desktop and mobile projects against an isolated loopback fixture; this does not prove backend validation/storage/database behavior.
- Backend fitting-room route tests verify feature-flag denial, public denial for unavailable/unapproved assets, required reject reason, approve/reject audit transaction data, and role checks (SUPPORT 403, MODERATOR allowed). GLB validation tests cover unsupported required extension, mesh/accessor bounds, oversized files, external image URIs and malformed container. Latest full backend suite: 349/349; type-check/build passed. Route tests use a mocked DB, not isolated-database ACL/storage proof.
- Admin responsive checks at 390×844 and 360×800 had no horizontal overflow. Frontend fitting-room responsive interaction remains pending.
- No production mutation, upload, publish, Telegram send, order, payment or deployment was performed.

## Product wizard package

- Backend full suite after all current packages: 50 files, 339 tests passed. The create route tests require an idempotency key, return the same product on a same-payload replay, and reject a changed payload with 409 without a second write.
- Backend API type-check and production build passed after Prisma generation and the additive idempotency migration.
- Admin full suite: 12 files, 58 tests passed; lint exited 0 with existing warnings; production build passed.
- Chrome local fixture: clicking step indicators from step 1 through step 5 left `createCount=0`. After entering three localized titles, China, 180000 UZS and a local image, the explicit final action sent one POST with a UUID `Idempotency-Key`; the modal closed and `createCount=1`.
- Wizard regression continuation (2026-10-09): a real Playwright run exposed a create POST on the `Далее` transition into the publication step. Added an explicit-final-action ref guard and corrected the localized step hint. The E2E now visits all 6 steps and asserts `createCount=0` after every navigation; a double-click on final create yields one POST with UUID idempotency key and expected RU/UZ/EN, CN, UZS and uploaded media reference. Desktop 1440×900 and mobile 390×844 each pass (1/1); the exact fixture product is deleted after assertions. This does not cover Back/Cancel/timeout/retry browser cases or persisted DB acceptance.
- Production remained untouched.

## Admin sidebar accessibility and responsive package (2026-10-09)

- `AVERON_security_tests/e2e/admin-sidebar.spec.ts`: 2 applicable Playwright Chromium scenarios passed; 2 expected project-specific skips (desktop scenario under mobile project and mobile scenario under desktop project).
- Targets were restricted in-page to the local admin app `http://127.0.0.1:3200` and fixture API `http://127.0.0.1:4200`; API URL was independently confirmed from the running Vite module. The test aborts all other origins and authenticates only with the fixture account.
- Desktop 1440×900: pointer resize to 320px; keyboard Home/End to 220px/360px; collapse to 76px; preserve 18 links; reload persistence; restore expanded width; active link computed contrast ≥4.5:1 in dark theme; collapse/expand/resize names verified after using the RU/UZ/EN language menu.
- Mobile Chromium emulation 390×844: right drawer hidden by default, opens, language action works, Escape and close button both dismiss it, and page horizontal overflow remains false. This is emulation, not a physical-device check.
- Screenshots were visually inspected and saved in `AVERON_security_tests/reports/generated/playwright-results/`: `admin-sidebar-dark-active.png`, `admin-sidebar-collapsed.png`, `admin-sidebar-mobile-open.png`, `admin-sidebar-mobile-closed.png`.
- Admin unit suite 13 files/69 tests passed; `pnpm build` passed including TypeScript; `pnpm lint` exited 0 with 14 warnings. The user-requested Chrome DevTools connector did not attach because Chrome was not running; this package was verified through the independent Playwright Chromium runner. No deployment or push occurred.

## Telegram retry package

- Publication route suite: 10/10 passed.
- A controlled `TELEGRAM_RATE_LIMITED` failure followed by success reused the same publication record, incremented `attemptCount` to 2 and persisted `telegram-message-after-retry`.
- Already-published, in-progress and delivery-unconfirmed states prevent another transport send; an unconfirmed timeout remains blocked for human reconciliation because automatic retry could duplicate a message that Telegram accepted.
- No real group/channel send was attempted because the request does not authorize an external Telegram mutation.

## Variant correctness package

- Backend now accepts an explicit sizes array and creates the complete normalized color-by-size matrix; the focused route/schema suite passed 60/60 after the change.
- Case-insensitive duplicate colors and sizes retain the first display label while duplicate combinations are removed.
- Storefront variant controls disable a color/size choice when that exact combination is unavailable and no longer silently select an unavailable same-option record; focused tests passed 7/7.
- Chrome admin verification with `M, m, L, l` rendered exactly `M` and `L` in the preview. A persisted real-database plus storefront-product browser journey is still required before R07 can be marked complete.

## Uzbekistan phone package

- Added one protected `UzbekPhoneInput` used by login, registration, password reset, Google phone completion and checkout.
- Formatting/helper/component tests cover typing, formatted paste, invalid length, foreign prefix rejection during normalization, clearing, and deletion inside the protected prefix; 5/5 focused tests passed.
- Every migrated API submission sends canonical `+998XXXXXXXXX`, while the visible field remains `+998 XX XXX XX XX`.
- Chrome at 390px verified login, registration and password reset. A pasted formatted number rendered correctly, clearing retained `+998`, native pattern validation passed for complete input, and no horizontal overflow occurred.
- Frontend full suite after the package: 33 files, 143 tests passed; lint and production build passed.

## Local browser continuation — 2026-10-09

- Local isolated storefront was serving incomplete stale `.next/static/chunks`: DevTools showed catalog CSS/JS asset requests returning HTTP 500 with `text/plain`, and computed body styles were Times New Roman/transparent. Rebuilt the current clone with `NEXT_PUBLIC_API_URL=http://127.0.0.1:4100` (loopback catalog fixture), restarted only its confirmed `next start --port 3112` process, then reloaded the same Chrome tab. Stylesheet links now load, body uses Inter and the dark surface/text are `rgb(24,24,24)` / `rgb(242,243,243)`; fixture catalog renders 4 entries. This was a local build/runtime repair, not an application deployment.

## Authenticated checkout continuation — 2026-10-09

- Updated the checkout summary to show each cart item, selected color/size, quantity and line total before confirmation.
- `AVERON_security_tests/e2e/storefront-smoke.spec.ts`: controlled OTP cart→checkout→order-success browser journey passed on desktop and mobile (2/2) against `http://127.0.0.1:3113`. All backend calls were intercepted by the local test adapter; a double-click yields one POST, a controlled 503 enables one retry with the identical UUID `Idempotency-Key` and body, and the success response navigates to the order route. It verifies the login return target, cart summary, canonical `+998901234567`, and absence of client-supplied items/prices/totals. No production request or order was made.
- Backend commerce checkout API suite passed 30/30; isolated frontend Vitest passed 36 files/153 tests; production build completed with 87 static outputs across 32 discovered site routes.
- Added a synchronous in-flight guard to prevent double-click from dispatching two checkout requests; on error the guard releases, preserving retry while retaining the same idempotency key unless order details change. Production build, full frontend Vitest (36 files/153 tests), and desktop/mobile retry/double-click E2E passed after this change.
- The existing backend test suite is mock-backed and the safe workspace currently has no configured Redis test URL or dedicated test DB. This browser run does not prove persisted stock claims/order creation; that acceptance remains open until an isolated PostgreSQL/Redis test environment is provisioned.
- Chrome DevTools dark-mode recheck after the final production build confirmed the footer on `#252525` uses light computed text, the viewport permits zoom (`maximum-scale=5`, `user-scalable=yes`), and the visible `UZ` language trigger is named `Til: UZ`. Mobile Lighthouse snapshot: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100; 35 audits passed, 0 failed. Local catalog only; production remains unverified.
- The same-size Chrome DevTools comparison with QLO exposed a hidden-filter grid defect at 1278×900: AVERON had 3 columns where QLO displayed 4. Updated the isolated frontend CSS to render exactly 4 columns with filters hidden at desktop widths from 1024px. Visual inspection of the final 1278×900 fixture screenshot confirms four cards, count and UZS prices; image arrays are intentionally empty, so real media parity was not checked.
- Isolated frontend `rtk pnpm run build` with the loopback API setting completed successfully: 32 route patterns, 87 static outputs, TypeScript/build passed without an upstream sitemap request. `rtk pnpm test`: 36 files / 153 tests passed. `rtk pnpm lint`: exited 0, 0 errors and 12 warnings (existing `<img>` optimization warnings and unused viewer error parameters).
- `AVERON_security_tests/e2e/storefront-smoke.spec.ts` targeted loopback test: `local desktop catalog uses four columns when filters are hidden`; result 1/1 passed at 1278×900 after clicking the real filter toggle. It verified the visible state and `aria-expanded`, four computed grid tracks, no horizontal overflow, Inter loaded and no browser-observed 5xx. Screenshot saved under `AVERON_security_tests/reports/generated/playwright-results/storefront-smoke-local-des-6b4d6-mns-when-filters-are-hidden-desktop-chromium/catalog-hidden-filters-four-columns-1278x900.png`.
- `AVERON_security_tests/e2e/admin-routes-smoke.spec.ts`: local fixture SUPER_ADMIN route sweep passed 25/25 paths at desktop 1440×900 and mobile Chromium 390×844 (50 route/viewport visits total); separate promo-code form POST/list-refresh scenario 1/1 passed on desktop. `admin-sidebar.spec.ts`: desktop collapse/resize/dark contrast/RU-UZ-EN 1/1 and mobile drawer 1/1 passed; each other viewport-specific test was expectedly skipped in its inapplicable project. These are local fixture checks, not persisted database, production or full page-action acceptance.

## Product cover crop (R05) — 2026-10-09

- Admin and storefront code now carries `{x,y,zoom}` crop metadata independently of image bytes. New uploads use the original file; existing product-image relations persist the crop; storefront cards use a 3:4 cover and apply focal position/zoom while detail gallery sources remain original URLs.
- Backend schema + commerce route tests 58/58 and full backend suite 328/328 passed using test-only environment values. Backend Prisma Client generation/type build passed; `prisma validate` passed with a test-only `DATABASE_URL`.
- Admin full Vitest 69/69, crop helper tests 7/7, admin build passed (existing lint warnings remain). Storefront ProductCard tests 12/12, full Vitest 162/162, scoped ESLint and full production build passed.
- Migration was added but not applied: no isolated PostgreSQL instance was available. The Chrome admin tab reached the login page; authenticated product edit/save/reopen was not exercised. Thus R05 remains partial pending database migration and authenticated browser persistence verification.

## Global 500 fallback and live production observation — 2026-10-09

- Added `app/global-error.test.tsx`: saved dark mode is applied to the root fallback, heading/body use theme color tokens, and retry/home controls render; explicit light preference wins over a dark OS preference. Result 2/2; scoped ESLint passed.
- Read-only Chrome loaded the live homepage and published product detail in the site's dark theme; these routes did not produce a 500. Tested CSS dark token contrasts: primary text/surface 15.00:1; secondary text/surface 9.81:1; on-primary/primary 15.72:1. A production 500 trigger and its exact route remain unknown, so the reported live failure is not claimed fixed by this check.
- Production detail `/ru/catalog/0txd-k1b2-hvse-6ala` visibly labels the product “Test” and uses an unrelated Boxette delivery-promotion screenshot while claiming administrator confirmation. Logged as UI-02 in `BUGS_AND_FIXES.md`; no production mutation was made.

## Latest local verification and hosted GitHub gate review — 2026-10-09

- Isolated backend crop-metadata change: `pnpm --filter api build` succeeded after Prisma Client generation; previous same-branch evidence remains backend full suite 328/328 and targeted commerce schema/routes 58/58. Migration is still unapplied because this machine has no Docker/PostgreSQL/Redis test services.
- Isolated storefront crop and global-error changes: full suite 38 files/162 tests passed; production Next build passed (87 static outputs / 32 route patterns). There is no `typecheck` script; Next build completed TypeScript checking. `git diff --check` passed.
- Isolated admin current suite: 13 files/69 tests passed; TypeScript and Vite production build passed. The build reports a known >500 kB chunk warning for fitting-room preview (963.95 kB raw / 257.11 kB gzip). `git diff --check` passed.
- Chrome local admin smoke: catalog loaded, collapse→expand sidebar worked, product editor opened, and auto-fill card grid computed 4 × 348px at 1632px viewport without horizontal overflow. At 390×844 the grid computed one 348px column and document width equaled the viewport. The same mobile snapshot exposed a clipped catalog title; the header now stacks on small screens. Authenticated Playwright assertions cover grid tracks/overflow and full title/action placement: desktop and mobile 2/2 passed. The fixture has only one product; multi-card, empty/error grid states and Uzbek/English header wrapping remain untested. Logged UI-12/UI-13.
- Exact current primary checkout SHAs and most recent hosted checks: frontend `c8ac07fa1227091568ae67c6afa7cebcc613fd70` (CI success); admin `b0fc7d929345971b1db2c28798ecbd9902963aa7` (PR verify success); backend `339f3597c9d78a4099511d7b9d071ef08c412d43` (PR verify success); parser `8ed5f7aef96907f2381f4806756f1f729dd28329` (PR verify success); security tests `dfe45988600c910f4add76db0fb857e84c186810`.
- Security workflow run 37796056829 checked older exact application SHAs and all four application regression jobs plus desktop/mobile Playwright passed; required final commit-status publication failed HTTP 403 `Resource not accessible by personal access token`. Therefore this is not a passing final cross-repository gate. Security Tests PR #7 remains `UNSTABLE`.
- Follow-up to the preceding first-run note: product-grid Playwright now substitutes five deterministic products in the loopback GET response (no backend mutation). Desktop/mobile runs both passed 2/2, including one-column mobile and fully readable mobile title/action placement. Empty/error grid states remain untested.
- No local branch was committed or pushed; no production or staging deployment was done. The local isolated frontend/admin/backend clones contain uncommitted user-task changes and have newer SHAs than the remotely verified branches; hosted green jobs above do not validate those local diffs.

## Follow-up verification: current checkouts and dark 500 boundaries — 2026-10-09

The following tests were run against the current working trees, including their existing uncommitted changes. These are local test/build results, not hosted checks or a release gate.

| Checkout | Branch / HEAD | Command | Result |
| --- | --- | --- | --- |
| primary frontend | `chore/ci-pnpm-cache` / `c8ac07fa1227091568ae67c6afa7cebcc613fd70` | `rtk pnpm test` | 34 files / 145 tests passed |
| primary admin | `chore/ci-pnpm-cache` / `b0fc7d929345971b1db2c28798ecbd9902963aa7` | `rtk pnpm test` | 13 files / 61 tests passed |
| primary backend API | `chore/ci-pnpm-cache` / `339f3597c9d78a4099511d7b9d071ef08c412d43` | `rtk pnpm --filter api test` with test-only dummy DB/Redis/JWT values | 51 files / 355 tests passed |
| primary parser | `codex/ci-cd-remediation` / `8ed5f7aef96907f2381f4806756f1f729dd28329` | `rtk pnpm test` | 27 tests passed; pnpm warns runtime Node 24.19.0 differs from declared Node 22.x |
| primary security tests | `codex/ci-cd-remediation` / `dfe45988600c910f4add76db0fb857e84c186810` | `rtk npm test` | 48 policy tests passed |
| isolated frontend clone | `codex/catalog-color-ui` / `fba560790490f5bd059a0f2ac1ae266b70f32c4a` | `rtk pnpm test` (previous current-turn check) | 38 files / 165 tests passed; production build generated 87 static outputs / 32 routes |
| isolated admin clone | `codex/admin-visual-refresh` / `c0e89652d042faeeb63185832a26b6ee2578ee77` | `rtk pnpm test`; `rtk pnpm build` | 13 files / 69 tests; TypeScript and Vite build passed; fitting-room preview chunk warning remains at 963.95 kB raw / 257.11 kB gzip |
| isolated backend clone | `codex/product-cover-metadata` / `3bede32b3ae35e271ef6283d6cd188e459cb1e48` | `rtk pnpm --filter api test`; `rtk pnpm --filter api build` with test-only dummy DB/Redis/JWT values | 47 files / 328 tests; Prisma generation and TypeScript build passed; DB migration/runtime acceptance remains pending |

Chrome DevTools browser acceptance for dark error screens: a temporary route throw rendered the actual localized `error.tsx`; a separate temporary root-layout throw yielded HTTP 500 and rendered actual `global-error.tsx`. At desktop 1632×939 and mobile 390×844 / 360×800, screenshots were visually inspected; dark text/background pairs were readable, CTA buttons were 46px high, and horizontal overflow was absent. The retry control rerendered the failing nested route. Temporary route and root throw were removed. The root error-report POST to `http://127.0.0.1:4300/error-reports` was rejected by the local fixture CORS allowlist (it permits origin 3098, while this check used 3120); production reporting was not tested. See the last two rows in `UI_QA_MATRIX.csv`.

The CSV matrix was parsed after repair: 46 scenario rows, all 10 columns; no malformed rows. The overall requirements traceability is still partial and must not be read as completion: production/staging, authenticated persisted database flows, external SMS/Telegram, GLB storage/ACL and GPU generation remain unproven or unavailable in these local tests.

## Product detail UI and guest cart path (2026-10-09)

- Built a disposable copy of the current uncommitted storefront source with `NEXT_PUBLIC_API_URL=http://127.0.0.1:4301`; production build passed TypeScript and generated 87 static outputs. No tracked source was copied back from this disposable preview.
- Chrome DevTools desktop screenshot (1440x900): article and brand are visible, the photo-to-info grid gap computes to 28px, circular color swatches show an outline on the selected color, and quantity/cart controls are aligned on one row. Mobile dark screenshot (390x844): no horizontal document overflow; the cart button sits alongside quantity; text is readable; guest add opens a compact two-action login/register dialog. Both links retain the selected `purchaseVariantId` in `returnTo`.
- The local auth fixture returns expected 401s. Its analytics CORS allowlist only includes port 3122, so preview-origin telemetry is blocked; this is fixture configuration, not a storefront route failure. The older local `3122` tab still points at stale `.next` assets (several JS chunks return 500); it was left untouched. The `3124` disposable production preview loaded current source assets successfully.
- Authenticated registration/login followed by auto-add is not proven here; the local fixture has no auth provider or persistent DB. No real cart write, production request, push or deployment.

## Product wizard retry/cancel regression (2026-10-09)

- Playwright Chromium: 4/4 passed across desktop 1440x900 and mobile 390x844, using local admin `http://127.0.0.1:3200` and loopback API fixture `http://127.0.0.1:4200`.
- Verified Back preserves entered sizes and uploaded photo; Cancel after partial input sends zero marker-matched create requests; final action receives a controlled 503 then retries with the same UUID `Idempotency-Key`, producing exactly one fixture record with canonical fields and cover-crop metadata. Fixture product is deleted in `finally`.
- R13 remains partial: the fixture is in-memory, so persisted PostgreSQL create/replay/cancel acceptance and response-loss-after-commit behavior remain unproven. No production mutation, push or deployment.

## Auth navigation return-path regression (2026-10-09)

- Added `AVERON_security_tests/e2e/auth-navigation.spec.ts` with a strict loopback-only storefront guard. Chromium desktop and mobile passed 4/4 checks: internal catalog query survives navigation to login and reload before safe Back; a direct Uzbek login ignores hostile external `returnTo`, stored session referrer, and HTTP referrer and uses the localized `/uz` fallback.
- A first test assertion expected a generic Back label; Chrome DevTools showed the correct localized fallback label `Bosh sahifaga`. The assertion now accepts the actual Uzbek label and the complete rerun passes. The test blocks browser requests to every non-loopback origin.
- Updated `ACTION_MANIFEST.json`, `REQUIREMENTS_TRACEABILITY.csv`, and `UI_QA_MATRIX.csv`. R12 remains partial because Google OAuth provider navigation and separate register/reset/checkout return journeys are not covered. No production host, SMS provider, DB, GitHub push, or deployment was used.
- Backend `phone-password-security.test.ts` now completes phone registration followed by password+OTP login via the actual Fastify handlers with test-only Redis/Prisma doubles. It verifies canonical `+998901234567`, password hashing, JWT response/refresh cookie, persisted session call, single-use OTP and no duplicate account; all 3 auth security tests pass. This proves handler behavior, not durable PostgreSQL/Redis or external SMS delivery.
- Fitting-room fallback overflow correction (2026-10-09): Chrome DevTools reproduced that this browser exposes `WebGLRenderingContext` but Canvas cannot create a usable renderer; the fallback photo was shown while loading text and dead rotation controls remained. `FittingRoomViewer.tsx` now signals Canvas fallback to the parent, which suppresses loading/rotation UI, and uses a contained, bounded fallback layout. Targeted Vitest passed 1/1; ESLint reported 0 errors (4 warnings); `tsc --noEmit` passed; isolated production build completed 87 static outputs. Chrome desktop 1440×900 verified the fallback visually and confirmed no loading/degree/rotation controls. Physical GPU rendering and mannequin appearance on a working WebGL device remain unverified.
- Live merchandising audit and discount rounding fix (2026-10-09): read-only Chrome DevTools on `https://averon-frontend-three.vercel.app/ru` found generic “Цвет 1/2” names, repeated product imagery/items, and rounded 90–100% badges on positive sale prices. The rounding root cause was shared `Math.round` logic in ProductCard and AddToCart; both now use `calculateDiscountPercent` from `lib/price.ts`, which caps at 99% for positive sale prices. Price, card, and cart tests pass 28/28; ESLint and `tsc --noEmit` exit 0. Added a live FAIL row to `UI_QA_MATRIX.csv`; production data remains unchanged and frontend fix is local/unreleased. Product-title/media records require authorized data-owner review.
- Discount display regression follow-up (2026-10-09): browser-tested current isolated production build (`3124`) against run-local catalog fixture (`4312`), where a positive sale price rounds to 99.8% off. Chrome DevTools DOM snapshot showed `−99%`, no `−100%`, correct discounted and regular-price cards, and distinct products across homepage shelves; evaluated real viewport was 1600×1000 with no horizontal overflow. The live Vercel deployment still shows the old 100% badge; no production data or deployment changes were made.
- Live admin sidebar check (2026-10-09): on the authenticated read-only production dashboard, Chrome DevTools toggled collapsed → expanded → collapsed; the button label tracked state, 18 navigation links remained in the accessibility tree, expanded sidebar measured 259px, and collapsed page had no horizontal overflow at 1632×939. This validates the current live toggle only, not the full admin UI/actions or mobile drawer. No business mutations were performed.
- Unsupported phone-country paste regression (2026-10-09): `UzbekPhoneInput` previously reformatted `+1 202 555 0147` into a misleading `+998` number even though submission validation later rejected it. It now preserves the exact last valid value, exposes a localized accessible error, and clears the error when a new valid `+998` paste arrives. Seven helper/component tests passed; Playwright desktop 1440×900 and mobile 390×844 passed against current-source loopback Next dev, asserting prior-value preservation and zero registration OTP submissions. ESLint, `tsc --noEmit`, and a fresh 87-output production build passed. A manual DevTools fill on the older 3124 preview disagreed with the fresh-build Playwright result, so that observation is classified as stale/inconclusive and excluded. Chrome DevTools MCP timed out while opening the fresh preview, so no manual DevTools visual assertion is claimed for this regression. This proves client-side rejection and recovery only; authenticated server request and external SMS delivery remain unproven.

## Homepage empty-state and mobile category QA continuation (2026-10-10)

- Reproduced the still-unverified UI-03 empty state using a new opt-in fixture mode (`AVERON_FIXTURE_EMPTY_PRODUCTS=true`); normal fixture behavior is unchanged.
- Found an adjacent visible mobile layout defect while examining full-page 1440×900 and 390×844 screenshots: the category grid was one column below `md`, so three 3:4 empty frames dominated the mobile home. Changed the grid to two columns on narrow screens, retaining four columns at `lg`.
- Playwright Chromium passed 2/2 (desktop + mobile) against a fresh isolated production build on loopback `3136` and catalog fixture `4117`: all three shelf titles and localized empty messages stay visible, the View all URLs remain correct, the sale link navigates with `saleOnly=true`, no 5xx/pageerror/horizontal overflow occurs, and mobile category grid is two columns with frames below 250px. Full-page success screenshots are visually reviewed in `AVERON_security_tests/reports/generated/playwright-results/*/home-empty-shelves.png`.
- A separate concurrent run against Next dev 16.3.6 first produced one `/ru` 500 with a Next runtime overlay `Unexpected end of JSON input`; the sibling viewport returned 200. A follow-up desktop/mobile run passed 2/2 with no browser pageerrors or 5xx, but the dev server still logged an intermittent `JSON.parse Unexpected end of JSON input` for `/ru/catalog` (307 then 200). DEV-01 is now isolated to Next's dev-only manifest race: the installed `next-dev-server.js` has the same unsynchronized `.next/dev/prerender-manifest.json` read/parse/write sequence described in [vercel/next.js issue #96259](https://github.com/vercel/next.js/issues/96259), and the AVERON `[locale]` layout has `generateStaticParams` across 32 localized routes. Upstream fix PR #96384 remained open as of 2026-10-10; do not claim the dependency defect is fixed. Local E2E config now uses one worker only for loopback storefronts. A three-test desktop auth-navigation run against fresh Next dev passed 3/3 with one worker; manifest parses as valid. Production build acceptance remains 2/2. First test attempt also clicked a globally matched View all link and selected the newest shelf on desktop; the selector is now scoped to the Sale section. The Chrome DevTools MCP previously timed out; current interaction verification used Playwright Chromium. Fixture has no category media, so source-image parity remains unverified. No production record or service was changed.
# Purchase continuation after registration (2026-10-10)

- Added a loopback-only E2E that starts from the fixture product, chooses quantity 2, opens the guest add-to-cart registration prompt, completes controlled OTP registration, returns to the same product/variant/quantity, asserts the visible “Добавлено в корзину” state, and checks one cart-add request only. Desktop and mobile Chromium passed 2/2 against the current-source Next dev server. Full-page screenshots are saved as `purchase-resumed-after-registration.png` in each test output folder and were visually checked on mobile. Product details use the local API fixture; auth and cart mutations are intercepted and no backend persistence or SMS provider was exercised.
- A broader 8-test desktop/mobile sample had 7 pass and one existing desktop registration case time out on the registration page; that same desktop registration test passed 1/1 when rerun alone. Treat that as a concurrent dev-server flake, not as a verified production issue. Chrome DevTools MCP `list_pages` and `new_page` timed out before returning browser state; Playwright supplied reproducible browser evidence. Dev server and fixture remain local only; no push/deployment.

# Fitting-room mannequin, WebGL fallback and product variant UI (2026-10-10)

- Fixed smooth-profile mesh indexing: every interpolated ring is now connected; regression asserts 25 rings/24 spans and full profile Y bounds. Fixed headless renderer detection/timeout handling so failed WebGL initialization does not leave hidden fallback HTML inside `<canvas>` with dead controls; a localized lazy-load placeholder is shown and non-responsive initialization falls back to the product photo. Narrow (<550px) viewer camera pulls back to avoid rotation-control overlap with the feet.
- Variant UI test improvements: color heading is localized; color is represented by accessible round swatches; a live selected-value summary reads `Цвет: … · Размер: …`; guest primary CTA remains `Добавить в корзину` in the quantity row and opens two auth choices. Purchase-return continuation remains intact.
- Verification: focused `AddToCart`/viewer tests 14/14; targeted ESLint 0 errors, 7 warnings (existing raw `<img>` and error-boundary parameter warnings); TypeScript passed. Fresh Next production build passed with 87 static outputs. `AVERON_security_tests/e2e/ui-workflow.spec.ts --grep=rotates` passed 2/2 on desktop 1440×900 and mobile 390×844 against API fixture `127.0.0.1:4302`; test includes renderer-or-fallback readiness, variant/product state, layer add/remove, exact totals, overflow and close. Dialog screenshots were inspected; mobile shows head-to-feet model clear of controls. The fixture garment is a flat triangle, not a production fit model. No production mutation, push, deployment or persisted cart action occurred.

# Catalog 500, hydration and dark mobile follow-up (2026-10-10)

- Reproduced the stale local `3112` preview symptom: a catalog CSS chunk and referenced JS chunk returned `500 text/plain`; Chrome recorded `ChunkLoadError`, and the page had no loaded stylesheet, transparent body and default black text. Restarted only the confirmed local AVERON frontend dev process; the same tab then rendered all 7 catalog entries with styles. This was a stale `.next` dev runtime, not a dark-token change.
- The refreshed dev server intermittently returned `500` on `/uz/catalog` with only Next's `SyntaxError: Unexpected end of JSON input` stack; sibling/repeated requests returned `200`. No corresponding uncaught JSON parse exists in the catalog loaders (they catch malformed API JSON). Installed Next 16.3.6 source contains the same unsafe manifest cycle, matching upstream issue #96259 and open fix PR #96384. Keep DEV-01 tracked as an upstream dev-runtime defect; app production build is not affected in the verified preview. The E2E harness now serializes loopback storefront runs and passed 3/3; hosted acceptance remains parallel.
- Fixed a real neighboring cause of React hydration failures: `Intl.NumberFormat('uz-UZ')` grouped the same price differently in Node and Chromium. `lib/price.ts` now formats grouped digits deterministically (NBSP for ru/uz, comma for en), retaining the correct `сум` / `so‘m` labels. Price/catalog/ProductCard tests passed 22/22; fresh build compiled, TypeScript passed, and 87 outputs generated.
- Current-source production preview `3138` against loopback catalog fixture: `/ru/catalog`, `/uz/catalog`, and `/uz/catalog?sort=price_asc` returned `200`; 4 fixture products, CSS loaded, no hydration failure, desktop viewport 929px without horizontal overflow. Mobile 390×844 in dark theme: 4 products, shell `rgb(24,24,24)`, text/title `rgb(242,243,243)`, primary filter button 44px high, document width 380px (no horizontal overflow). One fixture-only `/api/backend/auth/me` request returned 404; analytics/auth were not part of acceptance. Local development 500 remains unclosed. No production data mutation, push, or deployment.

