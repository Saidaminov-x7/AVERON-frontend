'use client';
import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import api from '@/lib/axios';

type Message = { role: 'user' | 'assistant'; content: string };
const suggestions = ['Чёрная женская куртка размера M', 'Белые кроссовки до 600 000 сум', 'Минималистичная сумка', 'Мужская рубашка на лето'];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Здравствуйте! Я AI-помощник AVERON. Опишите нужную вещь, цвет, размер и бюджет — я помогу сформулировать запрос и подобрать товары.' }]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (text = value) => {
    const clean = text.trim(); if (!clean || loading) return;
    const history = messages.slice(-8); setMessages((current) => [...current, { role: 'user', content: clean }]); setValue(''); setLoading(true);
    try { const { data } = await api.post<{response:string}>('/ai-chat/chat', { message: clean, history }); setMessages((current) => [...current, { role: 'assistant', content: data.response }]); }
    catch { setMessages((current) => [...current, { role: 'assistant', content: 'Сервис временно недоступен. Попробуйте ещё раз или откройте каталог.' }]); }
    finally { setLoading(false); }
  };
  return <main className="min-h-[calc(100vh-80px)] bg-stone-50 p-3 text-stone-950 dark:bg-stone-950 dark:text-white sm:p-6"><div className="mx-auto flex min-h-[72vh] max-w-5xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900"><header className="flex items-center gap-3 border-b border-stone-200 p-4 dark:border-white/10"><div className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white"><Bot size={22}/></div><div><h1 className="font-bold">AVERON AI</h1><p className="text-xs text-stone-500">Поиск товаров и помощь с выбором</p></div></header><div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{messages.map((message,index)=><div key={index} className={`flex ${message.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${message.role==='user'?'bg-violet-600 text-white':'bg-stone-100 dark:bg-stone-800'}`}>{message.content}</div></div>)}{loading&&<div className="text-sm text-stone-400">AVERON AI думает…</div>}</div><div className="border-t border-stone-200 p-3 dark:border-white/10 sm:p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map((item)=><button key={item} onClick={()=>submit(item)} className="whitespace-nowrap rounded-full border border-stone-300 px-3 py-2 text-xs hover:border-violet-500 dark:border-white/15"><Sparkles className="mr-1 inline" size={13}/>{item}</button>)}</div><form onSubmit={(event)=>{event.preventDefault();submit();}} className="flex gap-2"><input value={value} onChange={(event)=>setValue(event.target.value)} placeholder="Напишите, что хотите найти…" className="h-12 flex-1 rounded-xl border border-stone-300 bg-transparent px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-white/15"/><button disabled={loading} className="flex size-12 items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-50" aria-label="Отправить"><Send size={18}/></button></form></div></div></main>;
}
