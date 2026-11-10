# AVERON_frontend SEO audit

Дата: 2026-11-10
Ветка до изменений: `main` (`origin/main`)
Область: только `AVERON_frontend`; production/backend не изменялись.

## Исходное состояние и доказательства

### Источники и маршруты

- `app/sitemap.ts` строил локализованные главную, каталог и ограниченный список статических страниц; API товаров `GET /api/v1/products?limit=100&page=N` использовался с лимитом 100 страниц. На ошибке API XML продолжал возвращаться только со статическими ссылками.
- `scripts/discover-routes.mjs` читает дерево `app/[locale]` и записывает `public/page-routes.json` с шаблонами маршрутов. Он не получает каталог и не создаёт sitemap.
- `app/robots.ts` разрешал `/` и запрещал только `/api/`, `/admin/`, `/*/api/`; приватные локализованные checkout/profile/orders/cart и другие маршруты явно не закрывались.
- `app/layout.tsx` уже выводил Organization и WebSite JSON-LD: AVERON, canonical site URL, логотип и Telegram `sameAs`; контакты и адрес не были указаны.
- Layout/страницы содержали локализованные metadata, canonical и hreflang. Для товара `generateMetadata` формировал Product/Offer JSON-LD из API-полей `salePriceUzs`, изображений и наличия.

### Фактические локальные HTTP-ответы до правок

Dev-сервер Next.js 16.3.6: `pnpm dev`, `http://localhost:3000` (впоследствии остановлен). В первой сессии конфигурация окружения использовала production API URL; после обнаружения production хоста сервер был остановлен, дальнейшие HTTP-проверки велись с переменными процесса, указывающими на `127.0.0.1:8080`.

`GET /sitemap.xml` → HTTP 200. Фрагмент:

```xml
<loc>https://averon.uz/ru</loc>
<xhtml:link rel="alternate" hreflang="ru" href="https://averon.uz/ru" />
<xhtml:link rel="alternate" hreflang="uz" href="https://averon.uz/uz" />
<xhtml:link rel="alternate" hreflang="en" href="https://averon.uz/en" />
```

`GET /robots.txt` → HTTP 200. Исходный ответ содержал `Allow: /`, `Disallow: /api/`, `/admin/`, `/*/api/`, но не checkout/profile/orders/cart.

`GET /ru/catalog/averon-seo-audit-probe`, `/uz/...`, `/en/...` → HTTP 200, но это не товар: все URL отдавали главную с canonical `/ru`, `/uz`, `/en`, заголовком локализованной главной и `noindex, follow`. Этот probe не считается подтверждением product metadata.

Фрагменты ответа главной RU:

```html
<title>AVERON | AVERON</title>
<link rel="canonical" href="https://averon.uz/ru"/>
<link rel="alternate" hrefLang="ru" href="https://averon.uz/ru"/>
<meta property="og:title" content="Интернет-магазин"/>
<meta property="og:url" content="https://averon.uz/ru"/>
```

### Ограничение API проверки

`.env.local` содержит `NEXT_PUBLIC_API_URL`, но его значение не публикуется в этом отчёте. Запрос к настроенному API вернул HTTP 404 `Application not found`; локальный `127.0.0.1:8080` вернул `ECONNREFUSED`. Поэтому в этой сессии невозможно получить реальный опубликованный товар или честно проверить его HTML, API-цену/наличие, товарные OG image и JSON-LD. Эти проверки остаются NOT TESTED; выдуманный slug/товар не использовался.

## Что требовалось улучшить

1. Sitemap не включал все реально существующие статические публичные страницы (`terms`, `privacy`, `public-offer`); URL-каталога `/pages/[slug]` также не имел источника данных в sitemap. При недоступности API товарные URL отсутствовали.
2. Robots не исключал локализованные приватные пользовательские маршруты.
3. Главная не имела OG image; каталог не имел OG image. У товара source metadata предусматривал API image, но живой output недоступен без товара.
4. Product/Offer schema использовала базовую цену товара; UI может показывать цену выбранного варианта. Их равенство без API product/variant данных не подтверждено.
5. Localized metadata для страницы товара нельзя было проверить на валидной реальной карточке из-за недоступности API.

## Изменения и проверка после правок

- Sitemap добавил опубликованные статические маршруты `terms`, `privacy`, `public-offer`, `outfits`, `ai`; лимит загрузки каталога расширен до 1000 страниц по 100 товаров. Источник товаров по-прежнему live API, страницы CMS slug не перечисляются без достоверного источника slug.
- Robots запрещает локализованные checkout/cart/profile/orders, авторизацию, приватные API/admin, внутренние страницы и пользовательские страницы/ссылки; публичные storefront маршруты остаются доступны для индексации.
- Главная и каталог унаследовали свой локализованный OG title/description/url и получили существующий `/logotip.png` как OG/Twitter image. Это существующее бренд-изображение, не изображение товара.
- Product metadata source уже формирует canonical, hreflang, og:title/description/url/image и Twitter metadata из API-ответа. Product/Offer JSON-LD source использует API `salePriceUzs`/availability; однако выбранный вариант в UI может менять цену. Schema не была переписана без API-примера, чтобы не изобретать Offers/цену.

### Команды и результаты

| Проверка | Команда / URL | Результат |
|---|---|---|
| Целевой тест | `pnpm test -- app/seo.test.ts` | PASS, 3 tests passed, exit 0 |
| Полный тест | `pnpm test` | FAIL, 51 файлов passed, 1 failed; 245 tests passed, 1 failed. Падение: `components/layout/Header.test.tsx > Header catalog search > fetches real product suggestions...`, не связано с изменёнными SEO файлами. |
| Lint | `pnpm lint` | FAIL, 6 errors + 1 warning в ранее присутствующих untracked `verification/browser-audit-2026-11-10/audit.cjs` и `report.cjs` (require-import rule, unused `s`). Других замечаний в затронутых файлах не показано. Эти файлы сохранены. |
| Production build | `pnpm build` | PASS, exit 0; Next.js 16.3.6 сгенерировал 87 страниц/роутов. Для этой проверки build команда выполнялась с локальными API переменными в процессе, указывающими на `127.0.0.1:8080`; локальный API недоступен, сборка завершилась штатно. |
| Diff whitespace | `git diff --check` | PASS, exit 0; Git сообщил только предупреждение преобразования LF/CRLF для двух TS файлов. |
| Production sitemap | `GET http://localhost:3003/sitemap.xml` | HTTP 200; `/ru/privacy`, `/ru/terms`, `/ru/public-offer` присутствуют; XML содержит локализованные alternates RU/UZ/EN. Product URLs не подтверждены из-за недоступного API. |
| Production robots | `GET http://localhost:3003/robots.txt` | HTTP 200; ответ содержит Disallow для локализованных `/cart`, `/checkout`, `/profile`, `/orders`, `/orders/*`, `/checkout/success/*` и остальных добавленных приватных маршрутов. |
| Главная RU | `GET http://localhost:3003/ru` | HTTP 200; canonical `https://averon.uz/ru`, hreflang RU/UZ/EN фактически в HTML, og:image `https://averon.uz/logotip.png`; JSON-LD: 3 блока, каждый успешно разобран `ConvertFrom-Json`. |
| Каталог UZ/EN | `GET http://localhost:3003/uz/catalog`, `.../en/catalog` | HTTP 200; правильные locale canonical и hreflang RU/UZ/EN, локализованные OG title/description/url, og:image. JSON-LD: 2 блока, успешно разобраны. |
| Карточка товара RU/UZ/EN | `GET http://localhost:3003/{ru,uz,en}/catalog/test-product` | HTTP 200, но не product: фактический canonical главной и locale homepage OG. **NOT TESTED** для реальной карточки, Product JSON-LD, реальной цены/availability и product OG. |

### Статус требований

| Пункт | Было | Стало | Проверка |
|---|---|---|---|
| Sitemap | Часть публичных статических маршрутов отсутствовала; при недоступном API товаров нет | Статические страницы дополнены, API-предел увеличен с 10 000 до 100 000 записей | Локальный production HTTP 200; статические URL есть. Данные товаров — NOT TESTED: API недоступен. |
| Robots | Приватные локализованные маршруты явно не запрещались | Добавлены запреты для приватных и внутренне-пользовательских путей | Production HTTP ответ просмотрен; основные приватные паттерны присутствуют. |
| Canonical/hreflang | Общая локаль и catalog рендерились; товар только source inspection | Product source сохраняет per-locale canonical и RU/UZ/EN alternates | Главная/catalog HTML подтверждены. Реальная product карточка NOT TESTED. |
| JSON-LD | Organization/WebSite существовали; Product/Offer source использовал API | Organization/WebSite не дублировались; Product источник не подменялся | Присутствующие production home/catalog JSON-LD разобраны. Реальный Product/Offer NOT TESTED. |
| OG | Главная и каталог без изображения; товарный source использовал первую API-картинку | Главная/catalog используют локотип; product source остаётся API image | HTTP head подтвердил главную/catalog; реальный товар NOT TESTED. |
| Twitter | Главная/catalog имели summary/title/description без image | Добавлен существующий логотип на главной/catalog | Production HTML показал twitter card summary. Product card NOT TESTED. |

## Осталось

1. Для завершения реальной проверки товара нужен доступный локальный/test backend с опубликованным товаром и вариантом (или API URL test-среды). Сейчас настроенный endpoint возвращает 404, `127.0.0.1:8080` недоступен. Production API намеренно не опрашивался после обнаружения этого риска.
2. Полные `pnpm lint` и `pnpm test` не прошли по указанным независимым проблемам. Не исправлял посторонний untracked QA артефакт и тест Header.
3. Не создавал ветку, коммит, push, PR и не выполнял merge: пользователь требовал дождаться verify PASS, а обязательные CI-подобные lint/test gates сейчас не проходят; verify PASS недоступен. Текущий diff оставлен для review на исходной ветке.
