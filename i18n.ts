import { getRequestConfig } from 'next-intl/server';
import { repairMojibake } from './lib/repair-mojibake';

const locales = ['uz', 'en', 'ru'];
const defaultLocale = 'ru';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  const rawMessages = (await import(`./messages/${locale}.json`)).default;
  return {
    locale,
    timeZone: 'Asia/Tashkent',
    messages: repairMojibake(repairMojibake(rawMessages)),
  };
});
