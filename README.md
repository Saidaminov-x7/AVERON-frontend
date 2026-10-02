# AVERON storefront

The AVERON customer storefront is a localized Next.js App Router application
for browsing clothing, footwear, and accessories, saving favorites, comparing
products, building outfits, and placing orders.

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- next-intl locales: Russian (`ru`), Uzbek (`uz`), and English (`en`)
- TanStack Query and Zustand for server/client state
- Vitest and Testing Library

## Local development

Use Node.js 20 or newer. The project declares pnpm and includes a pnpm lockfile:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Configure the storefront API URL and public canonical site URL in the local
environment file. `NEXT_PUBLIC_YANDEX_METRIKA_ID` is optional; leave it unset
to disable Yandex.Metrika. Set `NEXT_PUBLIC_SITE_URL=https://averon.uz` in the
production environment; preview hosts should not be used as production
canonical URLs. Public configuration values are not secrets.

## Checks

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm run build
```

The production deployment checkout also retains `package-lock.json` because
its current deployment consumer installs with npm. Keep the deployment
install command and lockfile in sync; do not remove either lockfile without
first changing and validating that consumer.

## Storefront routes

The public catalog and product detail routes are under `/{locale}/catalog`.
Other public information pages include About, delivery, returns, size guide,
FAQ, and how to order. Account, cart, checkout, order history, favorites,
comparison, and private wishlist flows are customer features but are not
public SEO landing pages.

Product availability, prices, and order totals come from the Backend API.
Parser imports remain unpublished until an administrator reviews and
explicitly publishes the product.
