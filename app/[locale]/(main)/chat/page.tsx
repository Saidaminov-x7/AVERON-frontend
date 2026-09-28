import { MessageCircle, Send } from 'lucide-react';

export default function SupportChatPage() {
  return <main className="min-h-[calc(100dvh-80px)] bg-stone-50 px-4 py-8 text-stone-950 dark:bg-stone-950 dark:text-white sm:px-6">
    <section className="mx-auto flex min-h-[calc(100dvh-144px)] w-full max-w-[1440px] items-center justify-center rounded-3xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
      <div className="max-w-xl text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-600 text-white"><MessageCircle/></div><h1 className="mt-5 text-3xl font-extrabold">Поддержка AVERON</h1><p className="mt-3 leading-7 text-stone-500 dark:text-stone-400">По вопросам заказа, оплаты и доставки напишите оператору в Telegram. AI-помощник остаётся отдельным и занимается только поиском товаров.</p><a href="https://t.me/averon_fashion_admin" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white"><Send size={17}/> Открыть поддержку</a></div>
    </section>
  </main>;
}
