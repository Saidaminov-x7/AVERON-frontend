import { createServer } from 'node:http';

const product = {
  id: 'ci-product-1', publicId: 'ci-product-1', slug: 'ci-product-1',
  translations: { ru: { title: 'Тестовое пальто' }, uz: { title: 'Sinov palto' }, en: { title: 'Test coat' } },
  description: {}, salePriceUzs: 250000, stock: 4, available: true,
  images: [{ url: 'http://127.0.0.1:8081/fixture-product.png', alt: { ru: 'Пальто', uz: 'Palto', en: 'Coat' } }],
  variants: [{ id: 'ci-variant-1', size: 'M', stock: 4, available: true }],
  category: { slug: 'coats', name: { ru: 'Пальто', uz: 'Paltolar', en: 'Coats' } },
};
const server = createServer((request, response) => {
  if (request.url?.startsWith('/fixture-product.png')) {
    response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
    response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV7sAAAAASUVORK5CYII=', 'base64'));
    return;
  }
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json');
  const url = new URL(request.url, 'http://127.0.0.1');
  const body = url.pathname.endsWith('/categories') ? []
    : url.pathname.endsWith('/catalog-facets') ? { sizes: [], colors: [] }
      : url.pathname.endsWith('/ci-product-1') ? product
        : { items: [product], pagination: { page: 1, limit: 24, total: 1, pages: 1 } };
  response.end(JSON.stringify(body));
});
server.listen(8081, '127.0.0.1');
