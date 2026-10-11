import http from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.AVERON_FIXTURE_PORT || 4100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('AVERON_FIXTURE_PORT must be an unprivileged TCP port');
}

const products = [
  {
    id: 'fixture-product-review', slug: 'fixture-product-review', publicId: 'AVR-000000000000001',
    salePriceUzs: '180000', compareAtPriceUzs: null, stock: 5, available: true,
    translations: {
      ru: { title: 'GLB review fixture shirt' },
      uz: { title: 'GLB review fixture shirt' },
      en: { title: 'GLB review fixture shirt' },
    },
    description: { ru: 'Local GLB fixture', uz: 'Mahalliy GLB namunasi', en: 'Local GLB fixture' },
    attributes: {
      composition: { ru: 'Хлопок 100%', uz: 'Paxta 100%', en: 'Cotton 100%' },
      careInstructions: {
        ru: 'Машинная стирка, не использовать сушильную машину',
        uz: 'Mashinada yuving, quritgichdan foydalanmang',
        en: 'Machine wash; do not tumble dry',
      },
    },
    images: [
      { id: 'fixture-review-front', url: '/fixture-front.svg', alt: { ru: 'Рубашка спереди', uz: 'Ko‘ylak old tomondan', en: 'Shirt front' } },
      { id: 'fixture-review-back', url: '/fixture-back.svg', alt: { ru: 'Рубашка сзади', uz: 'Ko‘ylak orqa tomondan', en: 'Shirt back' } },
    ],
    variants: [
      { id: 'fixture-variant-m', size: 'M', color: 'Blue', stock: 5, available: true },
      { id: 'fixture-variant-dark-blue-m', size: 'M', color: 'dark blue', stock: 2, available: true },
    ],
    category: { slug: 'clothing', active: true, name: { ru: 'Одежда', uz: 'Kiyim', en: 'Clothing' } },
    createdAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'fixture-sale-1', slug: 'fixture-sale-linen-shirt', salePriceUzs: '180000', compareAtPriceUzs: '240000', stock: 5,
    translations: { ru: { title: 'Льняная рубашка со скидкой' }, uz: { title: 'Chegirmali zig‘ir ko‘ylak' }, en: { title: 'Sale linen shirt' } },
    images: [], variants: [{ id: 'fixture-sale-1-m', size: 'M', color: 'Black', stock: 5, available: true }],
    category: { slug: 'clothing', active: true, name: { ru: 'Одежда', uz: 'Kiyim', en: 'Clothing' } }, createdAt: '2026-10-09T00:00:00.000Z',
  },
  {
    id: 'fixture-regular-1', slug: 'fixture-regular-jacket', salePriceUzs: '320000', compareAtPriceUzs: null, stock: 3,
    translations: { ru: { title: 'Куртка без скидки' }, uz: { title: 'Oddiy kurtka' }, en: { title: 'Regular jacket' } },
    images: [], variants: [{ id: 'fixture-regular-1-l', size: 'L', color: 'Navy', stock: 3, available: true }],
    category: { slug: 'outerwear', active: true, name: { ru: 'Верхняя одежда', uz: 'Ustki kiyim', en: 'Outerwear' } }, createdAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'fixture-sale-2', slug: 'fixture-sale-shoes', salePriceUzs: '275000', compareAtPriceUzs: '310000', stock: 2,
    translations: { ru: { title: 'Кроссовки со скидкой' }, uz: { title: 'Chegirmali krossovka' }, en: { title: 'Sale sneakers' } },
    images: [], variants: [{ id: 'fixture-sale-2-41', size: '41', color: 'White', stock: 2, available: true }],
    category: { slug: 'shoes', active: true, name: { ru: 'Обувь', uz: 'Poyabzal', en: 'Shoes' } }, createdAt: '2026-10-07T00:00:00.000Z',
  },
  {
    id: 'fixture-invalid-discount', slug: 'fixture-equal-price', salePriceUzs: '150000', compareAtPriceUzs: '150000', stock: 1,
    translations: { ru: { title: 'Товар без фактической скидки' }, uz: { title: 'Chegirmasiz mahsulot' }, en: { title: 'No actual discount' } },
    images: [], variants: [], category: null, createdAt: '2026-10-06T00:00:00.000Z',
  },
];

function json(response, body, status = 200) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' });
    response.end();
    return;
  }
  if (url.pathname === '/api/v1/products') {
    const saleOnly = url.searchParams.get('saleOnly') === 'true';
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get('limit')) || 24));
    let eligible = products;
    if (process.env.AVERON_FIXTURE_EMPTY_PRODUCTS === 'true') eligible = [];
    else if (saleOnly) {
      eligible = products.filter((product) => Number(product.salePriceUzs) > 0 && Number(product.compareAtPriceUzs) > Number(product.salePriceUzs));
    }
    const items = eligible.slice((page - 1) * limit, page * limit);
    json(response, { items, pagination: { page, limit, total: eligible.length, pages: Math.ceil(eligible.length / limit) } });
    return;
  }
  const productMatch = url.pathname.match(/^\/api\/v1\/products\/([^/]+)$/);
  if (request.method === 'GET' && productMatch) {
    const identifier = decodeURIComponent(productMatch[1]);
    const product = products.find((item) => item.id === identifier || item.slug === identifier || item.publicId === identifier);
    if (!product) {
      json(response, { message: 'Fixture product not found' }, 404);
      return;
    }
    json(response, product);
    return;
  }
  if (url.pathname === '/api/v1/categories') {
    json(response, [
      { slug: 'clothing', active: true, name: { ru: 'Одежда', uz: 'Kiyim', en: 'Clothing' } },
      { slug: 'outerwear', active: true, name: { ru: 'Верхняя одежда', uz: 'Ustki kiyim', en: 'Outerwear' } },
      { slug: 'shoes', active: true, name: { ru: 'Обувь', uz: 'Poyabzal', en: 'Shoes' } },
    ]);
    return;
  }
  if (url.pathname === '/api/v1/catalog-facets') {
    json(response, { sizes: ['M', 'L', '41'], colors: ['Black', 'Navy', 'White'] });
    return;
  }
  if (url.pathname === '/api/v1/capabilities') {
    json(response, {});
    return;
  }
  if (url.pathname === '/auth/me' || url.pathname === '/auth/refresh') {
    json(response, { message: 'Fixture session is not authenticated' }, 401);
    return;
  }
  if (url.pathname === '/site-settings/public') {
    json(response, { maintenanceMode: false, siteName: 'AVERON local fixture' });
    return;
  }
  if (url.pathname.startsWith('/analytics/')) {
    response.writeHead(204, { 'access-control-allow-origin': '*' });
    response.end();
    return;
  }
  json(response, { message: 'Fixture route not found' }, 404);
});

server.listen(port, host, () => {
  process.stdout.write(`AVERON catalog fixture listening on http://${host}:${port}\n`);
});
