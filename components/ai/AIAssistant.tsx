"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import api from "@/lib/axios";
type Message = { role: "user" | "assistant"; content: string };
const dict = {
  ru: {
    sub: "Подбор и поиск товаров",
    hello:
      "Здравствуйте! Я AI-помощник AVERON. Опишите вещь, цвет, размер и бюджет — я помогу подобрать товары.",
    busy: "AVERON AI подбирает варианты…",
    fail: "AI временно недоступен. Попробуйте ещё раз через минуту.",
    placeholder: "Напишите, что хотите найти…",
    send: "Отправить",
    suggestions: [
      "Чёрная женская куртка размера M",
      "Белые кроссовки до 600 000 сум",
      "Минималистичная сумка",
      "Мужская рубашка на лето",
    ],
  },
  uz: {
    sub: "Mahsulotlarni tanlash va qidirish",
    hello:
      "Salom! Men AVERON AI-yordamchisiman. Mahsulot, rang, o‘lcham va budjetni yozing.",
    busy: "AVERON AI variantlarni qidirmoqda…",
    fail: "AI vaqtincha ishlamayapti. Keyinroq urinib ko‘ring.",
    placeholder: "Nimani topmoqchisiz…",
    send: "Yuborish",
    suggestions: [
      "M o‘lchamdagi qora ayollar kurtkasi",
      "600 000 so‘mgacha oq krossovka",
      "Minimalistik sumka",
      "Yozgi erkaklar ko‘ylagi",
    ],
  },
  en: {
    sub: "Product search and selection",
    hello:
      "Hello! I am the AVERON AI assistant. Describe the item, color, size and budget.",
    busy: "AVERON AI is finding options…",
    fail: "AI is temporarily unavailable. Please try again shortly.",
    placeholder: "What would you like to find…",
    send: "Send",
    suggestions: [
      "Black women’s jacket, size M",
      "White sneakers under 600,000 UZS",
      "Minimalist bag",
      "Men’s summer shirt",
    ],
  },
} as const;
export default function AIAssistant() {
  const t = dict[useLocale() as keyof typeof dict] ?? dict.ru;
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t.hello },
  ]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages, loading],
  );
  useEffect(
    () => setMessages([{ role: "assistant", content: t.hello }]),
    [t.hello],
  );
  const submit = async (text = value) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const history = messages.slice(-8);
    setMessages((c) => [...c, { role: "user", content: clean }]);
    setValue("");
    setLoading(true);
    try {
      const { data } = await api.post<{ response: string }>("/ai-chat/chat", {
        message: clean,
        history,
      });
      setMessages((c) => [...c, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((c) => [...c, { role: "assistant", content: t.fail }]);
    } finally {
      setLoading(false);
    }
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };
  return (
    <main className="flex h-[calc(100dvh-80px)] w-full overflow-hidden bg-white text-stone-950 dark:bg-stone-900 dark:text-white">
      <section className="flex h-full w-full flex-col">
        <header className="flex items-center gap-3 border-b border-stone-200 p-4 dark:border-white/10 sm:px-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="font-bold">AVERON AI</h1>
            <p className="text-xs text-stone-500">{t.sub}</p>
          </div>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "bg-violet-600 text-white" : "bg-stone-100 dark:bg-stone-800"}`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-stone-400">{t.busy}</div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-stone-200 p-3 dark:border-white/10 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {t.suggestions.map((x) => (
              <button
                key={x}
                onClick={() => void submit(x)}
                className="whitespace-nowrap rounded-full border border-stone-300 px-3 py-2 text-xs dark:border-white/15"
              >
                <Sparkles className="mr-1 inline" size={13} />
                {x}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t.placeholder}
              className="h-12 flex-1 rounded-xl border border-stone-300 bg-transparent px-4 text-sm outline-none focus:border-violet-500 dark:border-white/15"
            />
            <button
              disabled={loading}
              className="flex size-12 items-center justify-center rounded-xl bg-violet-600 text-white"
              aria-label={t.send}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
