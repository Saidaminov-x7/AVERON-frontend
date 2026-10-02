import { TelegramMiniApp } from '@/components/telegram/TelegramMiniApp';

export default async function MiniAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const product = Array.isArray(query.product) ? query.product[0] : query.product;
  return <TelegramMiniApp locale={locale} initialProduct={product} />;
}
