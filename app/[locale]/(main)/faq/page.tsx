import type { Metadata } from 'next';
import { InfoPage } from '@/components/content/InfoPage';

const content = {
  ru: {
    meta: 'Вопросы и ответы', title: 'Частые вопросы', description: 'Короткие ответы о каталоге, заказе, оплате и поддержке.',
    items: [
      { title: 'Кто публикует товары?', text: 'AI готовит данные, но публикацию всегда подтверждает администратор.' },
      { title: 'Как войти?', text: 'Введите номер телефона и пароль, затем подтвердите вход кодом из SMS.' },
      { title: 'Где посмотреть заказ?', text: 'История и текущий статус доступны в личном кабинете.' },
      { title: 'Куда задать вопрос?', text: 'AI помогает с поиском, а команда поддержки — с заказами.' },
    ],
  },
  uz: {
    meta: 'Savollar va javoblar', title: 'Ko‘p so‘raladigan savollar', description: 'Katalog, buyurtma, to‘lov va yordam haqida qisqa javoblar.',
    items: [
      { title: 'Mahsulotlarni kim e’lon qiladi?', text: 'AI ma’lumotlarni tayyorlaydi, lekin e’lonni har doim administrator tasdiqlaydi.' },
      { title: 'Qanday kiraman?', text: 'Telefon raqami va parolni kiriting, so‘ng SMS kod bilan tasdiqlang.' },
      { title: 'Buyurtmani qayerdan ko‘raman?', text: 'Buyurtmalar tarixi va joriy holati shaxsiy kabinetda mavjud.' },
      { title: 'Savolni kimga beraman?', text: 'AI qidiruvda, qo‘llab-quvvatlash jamoasi esa buyurtmalar bo‘yicha yordam beradi.' },
    ],
  },
  en: {
    meta: 'Questions and answers', title: 'Frequently asked questions', description: 'Short answers about the catalog, orders, payment, and support.',
    items: [
      { title: 'Who publishes products?', text: 'AI prepares the data, but an administrator always approves publication.' },
      { title: 'How do I sign in?', text: 'Enter your phone number and password, then confirm with the SMS code.' },
      { title: 'Where can I see my order?', text: 'Your order history and current status are available in your account.' },
      { title: 'Where can I ask a question?', text: 'AI helps with product discovery, while the support team handles order questions.' },
    ],
  },
} as const;

const getContent = (locale: string) => content[locale as keyof typeof content] ?? content.ru;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getContent(locale).meta };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = getContent(locale);
  return <InfoPage locale={locale} eyebrow="FAQ" title={page.title} description={page.description} items={[...page.items]} />;
}
