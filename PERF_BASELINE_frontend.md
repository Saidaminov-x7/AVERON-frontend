
> averon-frontend@0.1.0 build C:\Users\vosil\Desktop\p\AVERON\AVERON_frontend
> node scripts/discover-routes.mjs && next build

Discovered 32 site routes
▲ Next.js 16.3.6 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 691ms

  Creating an optimized production build ...
✓ Compiled successfully in 9.2s
  Running TypeScript ...
  Finished TypeScript in 18.7s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/87) ...
  Generating static pages using 7 workers (21/87) 
  Generating static pages using 7 workers (43/87) 
  Generating static pages using 7 workers (65/87) 
✓ Generating static pages using 7 workers (87/87) in 12.3s
  Finalizing page optimization ...

Route (app)                                   Revalidate  Expire
┌ ƒ /
├ ○ /_not-found                                      30s      1y
├   /[locale]
│ ├ ● /uz                                            30s      1y
│ ├ ● /en                                            30s      1y
│ └ ● /ru                                            30s      1y
├   /[locale]/about
│ ├ ● /uz/about                                      30s      1y
│ ├ ● /en/about                                      30s      1y
│ └ ● /ru/about                                      30s      1y
├   /[locale]/ai
│ ├ ● /uz/ai                                         30s      1y
│ ├ ● /en/ai                                         30s      1y
│ └ ● /ru/ai                                         30s      1y
├ ƒ /[locale]/api/page-routes
├   /[locale]/cart
│ ├ ● /uz/cart                                       30s      1y
│ ├ ● /en/cart                                       30s      1y
│ └ ● /ru/cart                                       30s      1y
├ ƒ /[locale]/catalog
├ ƒ /[locale]/catalog/[id]
├   /[locale]/chat
│ ├ ● /uz/chat                                       30s      1y
│ ├ ● /en/chat                                       30s      1y
│ └ ● /ru/chat                                       30s      1y
├   /[locale]/checkout
│ ├ ● /uz/checkout                                   30s      1y
│ ├ ● /en/checkout                                   30s      1y
│ └ ● /ru/checkout                                   30s      1y
├ ƒ /[locale]/checkout/success/[orderNumber]
├   /[locale]/compare
│ ├ ● /uz/compare                                    30s      1y
│ ├ ● /en/compare                                    30s      1y
│ └ ● /ru/compare                                    30s      1y
├   /[locale]/delivery
│ ├ ● /uz/delivery                                   30s      1y
│ ├ ● /en/delivery                                   30s      1y
│ └ ● /ru/delivery                                   30s      1y
├   /[locale]/faq
│ ├ ● /uz/faq                                        30s      1y
│ ├ ● /en/faq                                        30s      1y
│ └ ● /ru/faq                                        30s      1y
├   /[locale]/favorites
│ ├ ● /uz/favorites                                  30s      1y
│ ├ ● /en/favorites                                  30s      1y
│ └ ● /ru/favorites                                  30s      1y
├   /[locale]/forgot-password
│ ├ ● /uz/forgot-password                            30s      1y
│ ├ ● /en/forgot-password                            30s      1y
│ └ ● /ru/forgot-password                            30s      1y
├   /[locale]/how-to-order
│ ├ ● /uz/how-to-order                               30s      1y
│ ├ ● /en/how-to-order                               30s      1y
│ └ ● /ru/how-to-order                               30s      1y
├   /[locale]/login
│ ├ ● /uz/login                                      30s      1y
│ ├ ● /en/login                                      30s      1y
│ └ ● /ru/login                                      30s      1y
├ ƒ /[locale]/maintenance
├ ƒ /[locale]/mini-app
├   /[locale]/orders
│ ├ ● /uz/orders                                     30s      1y
│ ├ ● /en/orders                                     30s      1y
│ └ ● /ru/orders                                     30s      1y
├ ƒ /[locale]/orders/[orderNumber]
├   /[locale]/outfits
│ ├ ● /uz/outfits                                    30s      1y
│ ├ ● /en/outfits                                    30s      1y
│ └ ● /ru/outfits                                    30s      1y
├ ƒ /[locale]/pages/[slug]
├ ƒ /[locale]/privacy
├   /[locale]/profile
│ ├ ● /uz/profile                                    30s      1y
│ ├ ● /en/profile                                    30s      1y
│ └ ● /ru/profile                                    30s      1y
├ ƒ /[locale]/public-offer
├   /[locale]/register
│ ├ ● /uz/register                                   30s      1y
│ ├ ● /en/register                                   30s      1y
│ └ ● /ru/register                                   30s      1y
├   /[locale]/reset-password
│ ├ ● /uz/reset-password                             30s      1y
│ ├ ● /en/reset-password                             30s      1y
│ └ ● /ru/reset-password                             30s      1y
├   /[locale]/returns
│ ├ ● /uz/returns                                    30s      1y
│ ├ ● /en/returns                                    30s      1y
│ └ ● /ru/returns                                    30s      1y
├   /[locale]/size-guide
│ ├ ● /uz/size-guide                                 30s      1y
│ ├ ● /en/size-guide                                 30s      1y
│ └ ● /ru/size-guide                                 30s      1y
├ ƒ /[locale]/support
├ ƒ /[locale]/terms
├ ƒ /[locale]/wishlist/shared/[token]
├ ƒ /api/maintenance/bypass
├ ƒ /api/release
├ ○ /manifest.webmanifest
├ ○ /robots.txt
└ ƒ /sitemap.xml


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand


Lighthouse: NOT RUN, причина: локальная инфраструктура и тестовые данные ещё не проверены.

## ПОСЛЕ — 2026-11-09

- `pnpm lint`: PASS (exit 0); `pnpm test`: PASS, 52 файла / 244 теста; `pnpm build`: PASS (exit 0). ДО: в сохранённом выше выводе сборка проходила; числовых метрик Lighthouse ДО нет, сравнить улучшение невозможно.
- Lighthouse 13.6.0, локальный production `next start --port 3187`, Chrome headless, `--only-categories=performance`, по одному прогону, HTTP 200. Значения лабораторные, зависят от машины и доступных данных; не являются полевыми показателями.

| Страница и профиль | Performance | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: |
| `/ru`, mobile | 67/100 | 4938 мс | 0 | 565 мс |
| `/ru/catalog`, desktop | 87/100 | 270 мс | 0 | 305 мс |

- Полные результаты: `lighthouse-home.json`, `lighthouse-catalog.json`. Наличие реальных товаров и репрезентативность каталога не подтверждены; скорости между различными профилями сравнивать нельзя.
- Свежая Turbopack-сборка: оба `react-loadable-manifest.json` для catalog и catalog/[id] связывают модуль 873566 с `static/chunks/2nzu7wxo6kbaw.js`; `0ei6unbncfyv5.js` содержит динамический загрузчик viewer. `WebGLRenderer` / `GLTFLoader` / `FittingRoomViewer` находятся в этих двух файлах, отдельный viewer chunk — 967149 байт. Первый содержит ссылку загрузчика; это доказательство разделения на уровне сборки, не доказательство сетевого поведения при реальной навигации. Next.js не выводит First Load по маршрутам.
- CSS: глобальные shell-селекторы, auth, menu-item (Header и Select), rounded-theme (Modal, Card и страница товара), reduced-motion, pointer и Sonner оставлены: они общие. Реальные стили и локали без GUI не проверены.
- Аудит производительности: ProductCard не мемоизирован, но стабильность product и измеримые повторные рендеры не доказаны; Header не передаёт выявленных нестабильных пропсов memo-потомку. Галерея уже использует sizes и priority первого изображения. ProductImage использует native img для произвольных CDN; безопасная миграция требует проверки источников. Изменения без измерений не внесены.

## Третий проход — 2026-11-09

- Удалён точный дубликат глобального `border-radius` для полей; идентичное правило осталось в предыдущем блоке. `pnpm test` сразу после удаления: 244/244 PASS.
- У первого товара каталога и основного изображения товара native `img` запрашивается с `loading="eager"` и `fetchPriority="high"`; остальные карточки остаются lazy. Native img сохранён для произвольных CDN. Приоритет первого товара — предположение о кандидате LCP, а не результат замера; `srcset`/`sizes` для этих источников нет.
- Обработчик ошибки второго изображения карточки стабилизирован через `useCallback`; эффект на производительность не измерен. Галерея `next/image` уже задаёт `sizes` и приоритет первому изображению.
- Оставлены широкие правила shell/auth и `.averon-menu-item`: они применяются вне UI-компонентов (например, `components/layout/Header.tsx`, страницы auth и `components/commerce/OutfitBuilder.tsx`). Sonner и правила доступности остаются глобальными. `.rounded-theme` и `.font-theme` используются в UI, но сохранены до проверки каскада и адаптивного `sm:rounded-theme` в браузере.
- Браузерная визуальная проверка, фактический LCP и сетевые размеры: NOT_TESTED.
