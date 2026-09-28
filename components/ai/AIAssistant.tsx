'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import api from '@/lib/axios';

type Message = { role: 'user' | 'assistant'; content: string };
const suggestions = ['Чёрная женская куртка размера M', 'Белые кроссовки до 600 000 сум', 'Минималистичная сумка', 'Мужская рубашка на лето'];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Здравствуйте! Я AI-помощник AVERON. Опишите вещь, цвет, размер и бюджет — я уточню запрос и помогу подобрать товары.' }]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, loading]);

  const submit = async (text = value) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: 'user', content: clean }]);
    setValue(''); setLoading(true);
    try {
      const { data } = await api.post<{ response: string }>('/ai-chat/chat', { message: clean, history });
      setMessages((current) => [...current, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'AI временно недоступен. Попробуйте ещё раз через минуту.' }]);
    } finally { setLoading(false); }
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); void submit(); };
  return <main className="flex min-h-[calc(100dvh-80px)] bg-stone-50 p-3 text-stone-950 dark:bg-stone-950 dark:text-white sm:p-5">
    <section className="mx-auto flex min-h-[calc(100dvh-104px)] w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-stone-900">
      <header className="flex items-center gap-3 border-b border-stone-200 p-4 dark:border-white/10 sm:px-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary-600 text-white"><Bot size={22}/></div>
        <div><h1 className="font-bold">AVERON AI</h1><p className="text-xs text-stone-500">Только подбор и поиск товаров</p></div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[68%] ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-stone-100 dark:bg-stone-800'}`}>{message.content}</div></div>)}
        {loading && <div className="text-sm text-stone-400">AVERON AI подбирает варианты…</div>}<div ref={endRef}/>
      </div>
      <div className="border-t border-stone-200 bg-white p-3 dark:border-white/10 dark:bg-stone-900 sm:p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map((item) => <button key={item} onClick={() => void submit(item)} className="whitespace-nowrap rounded-full border border-stone-300 px-3 py-2 text-xs hover:border-primary-500 dark:border-white/15"><Sparkles className="mr-1 inline" size={13}/>{item}</button>)}</div>
        <form onSubmit={onSubmit} className="flex gap-2"><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Напишите, что хотите найти…" className="h-12 flex-1 rounded-xl border border-stone-300 bg-transparent px-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-white/15"/><button disabled={loading} className="flex size-12 items-center justify-center rounded-xl bg-primary-600 text-white disabled:opacity-50" aria-label="Отправить"><Send size={18}/></button></form>
      </div>
    </section>
  </main>;
}
