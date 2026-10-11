import http from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.AVERON_FITTING_FIXTURE_PORT || 4300);
const configuredOrigins = process.env.AVERON_FIXTURE_ALLOWED_ORIGINS
  || process.env.AVERON_FIXTURE_ALLOWED_ORIGIN
  || 'http://127.0.0.1:3100';
const allowedOrigins = new Set(configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean));
const corsHeaders = (request) => {
  const origin = request.headers.origin;
  const allowedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : origin ? undefined : [...allowedOrigins][0];
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
};
const product = {
  id: 'fixture-product-review', publicId: 'AVR-000000000000001', slug: 'fixture-review-shirt', title: 'GLB review fixture shirt', salePriceUzs: '180000', imageUrl: '/fixture-front.svg',
  attributes: {
    brand: { ru: 'AVERON', uz: 'AVERON', en: 'AVERON' },
    composition: { ru: '\u0425\u043b\u043e\u043f\u043e\u043a 100%', uz: '100% paxta', en: '100% cotton' },
    careInstructions: { ru: '\u041c\u0430\u0448\u0438\u043d\u043d\u0430\u044f \u0441\u0442\u0438\u0440\u043a\u0430, \u043d\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0441\u0443\u0448\u0438\u043b\u044c\u043d\u0443\u044e \u043c\u0430\u0448\u0438\u043d\u0443.', uz: 'Mashinada yuvish mumkin.', en: 'Machine wash; do not tumble dry.' },
  },
  sizeChartType: 'CLOTHING',
  images: [
    { id: 'fixture-photo-front', url: '/fixture-front.svg' },
    { id: 'fixture-photo-back', url: '/fixture-back.svg' },
  ],
  variants: [
    { id: 'fixture-variant-m', color: 'Blue', size: 'M', stock: 5, salePriceUzs: '180000' },
    { id: 'fixture-variant-dark-blue-m', color: 'dark blue::#000080', size: 'M', stock: 4, salePriceUzs: '180000' },
    { id: 'fixture-variant-red-m', color: 'Red::#ff0000', size: 'M', stock: 2, salePriceUzs: '180000' },
  ],
  assets: [{ id: 'fixture-glb-approved', variantId: 'fixture-variant-m', garmentLayer: 'BASE_TOP', mannequinVersion: 'averon-neutral-v1', positionX: 0, positionY: 0.8, positionZ: 0, scale: 1, url: `http://${host}:${port}/fixture-shirt.glb` }],
};
const products = [product, {
  ...product, id: 'fixture-product-outerwear', slug: 'fixture-blue-jacket', title: 'Fixture blue jacket',
  assets: product.assets.map((asset) => ({ ...asset, id: 'fixture-glb-jacket', garmentLayer: 'OUTERWEAR', positionY: 0.8 })),
}];
const catalogProducts = [product, ...products.slice(1), ...[
  ['fixture-sale-1', 'fixture-sale-linen-shirt', 'Sale linen shirt', '240000'],
  ['fixture-regular-1', 'fixture-regular-jacket', 'Regular jacket', '320000'],
].map(([id, slug, title, salePriceUzs]) => ({
  id, publicId: id, slug, salePriceUzs, compareAtPriceUzs: null, stock: 3,
  translations: { ru: { title }, uz: { title }, en: { title } },
  images: [], variants: [{ id: `${id}-variant-m`, size: 'M', color: 'Blue', stock: 3, available: true }],
  status: 'PUBLISHED', category: { slug: 'clothing', active: true, name: { ru: 'Одежда', uz: 'Kiyim', en: 'Clothing' } },
  createdAt: '2026-10-09T00:00:00.000Z',
}))];

const send = (request, response, status, body, contentType = 'application/json; charset=utf-8') => {
  response.writeHead(status, { ...corsHeaders(request), 'Content-Type': contentType });
  response.end(contentType.startsWith('application/json') ? JSON.stringify(body) : body);
};

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') return send(request, response, 204, {});
  const url = new URL(request.url ?? '/', `http://${host}:${port}`);
  if (url.pathname === '/fixture-shirt.glb') {
    const triangles = [
      [[-0.25, 0.02], [0.25, 0.02], [0.23, 0.62]],
      [[-0.25, 0.02], [0.23, 0.62], [-0.23, 0.62]],
      [[-0.23, 0.6], [-0.38, 0.64], [-0.55, 0.22]],
      [[-0.23, 0.6], [-0.55, 0.22], [-0.4, 0.12]],
      [[-0.23, 0.6], [-0.4, 0.12], [-0.22, 0.36]],
      [[0.23, 0.6], [0.55, 0.22], [0.38, 0.64]],
      [[0.23, 0.6], [0.4, 0.12], [0.55, 0.22]],
      [[0.23, 0.6], [0.22, 0.36], [0.4, 0.12]],
    ];
    const positions = triangles.flatMap((triangle) => triangle.flatMap(([x, y]) => [x, y, 0.13]));
    const normals = Array.from({ length: positions.length / 3 }, () => [0, 0, 1]).flat();
    const positionsBytes = positions.length * Float32Array.BYTES_PER_ELEMENT;
    const normalsBytes = normals.length * Float32Array.BYTES_PER_ELEMENT;
    const document = Buffer.from(JSON.stringify({
      asset: { version: '2.0', generator: 'AVERON local fitting-room shirt fixture' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
      materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.15, 0.28, 0.76, 1], roughnessFactor: 0.8 } }],
      buffers: [{ byteLength: positionsBytes + normalsBytes }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: positionsBytes, target: 34962 },
        { buffer: 0, byteOffset: positionsBytes, byteLength: normalsBytes, target: 34962 },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: [-0.55, 0.02, 0.13], max: [0.55, 0.64, 0.13] },
        { bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3' },
      ],
    }));
    const json = Buffer.concat([document, Buffer.alloc((4 - document.length % 4) % 4, 0x20)]);
    const binary = Buffer.alloc(positionsBytes + normalsBytes);
    positions.forEach((value, index) => binary.writeFloatLE(value, index * 4));
    normals.forEach((value, index) => binary.writeFloatLE(value, positionsBytes + index * 4));
    const length = 12 + 8 + json.length + 8 + binary.length;
    const glb = Buffer.alloc(length);
    glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(length, 8);
    glb.writeUInt32LE(json.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); json.copy(glb, 20);
    const offset = 20 + json.length; glb.writeUInt32LE(binary.length, offset); glb.writeUInt32LE(0x004e4942, offset + 4); binary.copy(glb, offset + 8);
    response.writeHead(200, { ...corsHeaders(request), 'Content-Type': 'model/gltf-binary', 'Content-Length': glb.length });
    return response.end(glb);
  }
  if (url.pathname === '/api/v1/products') return send(request, response, 200, { items: catalogProducts, pagination: { page: 1, limit: catalogProducts.length, total: catalogProducts.length, pages: 1 } });
  if (url.pathname === '/api/v1/categories') return send(request, response, 200, [{ slug: 'clothing', active: true, name: { ru: 'Одежда', uz: 'Kiyim', en: 'Clothing' } }]);
  if (url.pathname === '/api/v1/catalog-facets') return send(request, response, 200, { sizes: ['M'], colors: ['Blue'] });
  if (url.pathname === '/api/v1/capabilities') return send(request, response, 200, {});
  if (url.pathname === '/site-settings/public') return send(request, response, 200, {
    maintenanceMode: process.env.AVERON_FIXTURE_MAINTENANCE_MODE === 'true',
    maintenanceMessage: null,
    maintenancePasswordEnabled: process.env.AVERON_FIXTURE_MAINTENANCE_MODE === 'true',
    siteName: 'AVERON local fixture',
  });
  if (url.pathname === '/site-settings/public/check-bypass' && request.method === 'POST') {
    return send(request, response, 401, { message: 'Invalid local fixture password.' });
  }
  if (url.pathname === '/auth/me') return send(request, response, 401, { message: 'Fixture session is not authenticated' });
  if (url.pathname === '/auth/refresh') return send(request, response, 401, { message: 'Fixture session is not authenticated' });
  if (url.pathname.startsWith('/analytics/')) return send(request, response, 204, {});
  if (url.pathname === '/error-reports' && request.method === 'POST') return send(request, response, 202, { accepted: true });
  if (url.pathname === '/api/v1/fitting-room/products') return send(request, response, 200, products);
  if (/^\/api\/v1\/products\/(?:AVR-000000000000001|fixture-product-review|fixture-review-shirt)\/fitting-room$/.test(url.pathname)) return send(request, response, 200, product);
  if (/^\/api\/v1\/products\/(?:AVR-000000000000001|fixture-product-review|fixture-review-shirt)$/.test(url.pathname)) return send(request, response, 200, { ...product, status: 'PUBLISHED', translations: { ru: { title: product.title }, uz: { title: product.title }, en: { title: product.title } }, description: { ru: 'Local GLB fixture', uz: 'Local GLB fixture', en: 'Local GLB fixture' }, variants: product.variants.map((variant) => ({ ...variant, available: true })), fittingRoomAvailable: true, category: null });
  if (/^\/api\/v1\/products\/(?:AVR-000000000000001|fixture-product-review|fixture-review-shirt)\/reviews$/.test(url.pathname)) return send(request, response, 200, { summary: { averageRating: null, reviewCount: 0, distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, fitDistribution: { RUNS_SMALL: 0, TRUE_TO_SIZE: 0, RUNS_LARGE: 0 } }, items: [], pagination: { page: Number(url.searchParams.get('page') || 1), pages: 0 } });
  return send(request, response, 404, { message: 'Fixture route not found' });
});

server.listen(port, host, () => process.stdout.write(`AVERON fitting-room fixture listening on http://${host}:${port}\n`));
