"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Link2, LoaderCircle, PackageSearch } from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

export default function ProductRequestPage() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await api.post("/api/v1/custom-orders", {
        source: data.get("source"),
        sourceUrl: data.get("sourceUrl"),
        quantity: Number(data.get("quantity")),
        selectedVariant: {
          color: data.get("color") || undefined,
          size: data.get("size") || undefined,
        },
        contact: {
          name: data.get("name"),
          phone: data.get("phone"),
          note: data.get("note") || undefined,
        },
      });
      setDone(true);
      event.currentTarget.reset();
    } catch (requestError: unknown) {
      const message =
        typeof requestError === "object" &&
        requestError &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(
        message || "Не удалось отправить заявку. Проверьте заполнение полей.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-stone-900">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
            <PackageSearch />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">
              Заказ по ссылке
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Предложить товар из Китая
            </h1>
            <p className="mt-2 text-stone-500">
              Отправьте ссылку с 1688, Taobao, Alibaba или AliExpress. Команда
              AVERON проверит товар и свяжется с вами.
            </p>
          </div>
        </div>
        {done ? (
          <div className="mt-8 rounded-2xl bg-emerald-500/10 p-6 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mb-3" />
            <h2 className="font-bold">Заявка отправлена</h2>
            <p className="mt-1 text-sm">
              Мы проверим ссылку и свяжемся по указанному номеру.
            </p>
            <button
              onClick={() => setDone(false)}
              className="mt-4 h-11 rounded-xl border border-emerald-500/30 px-4 font-semibold"
            >
              Отправить ещё одну
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-semibold">
              Ссылка на товар
              <div className="relative mt-2">
                <Link2
                  className="absolute left-3 top-3 text-stone-400"
                  size={19}
                />
                <input
                  required
                  type="url"
                  name="sourceUrl"
                  defaultValue={searchParams.get("url") || ""}
                  placeholder="https://detail.1688.com/..."
                  className="h-12 w-full rounded-xl border border-stone-300 bg-transparent pl-11 pr-3 outline-none focus:border-violet-500 dark:border-white/15"
                />
              </div>
            </label>
            <label className="text-sm font-semibold">
              Площадка
              <select
                name="source"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              >
                <option value="SOURCE_1688">1688</option>
                <option value="TAOBAO">Taobao</option>
                <option value="ALIBABA">Alibaba</option>
                <option value="ALIEXPRESS">AliExpress</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Количество
              <input
                required
                min="1"
                max="100"
                type="number"
                name="quantity"
                defaultValue="1"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              />
            </label>
            <label className="text-sm font-semibold">
              Цвет
              <input
                name="color"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              />
            </label>
            <label className="text-sm font-semibold">
              Размер
              <input
                name="size"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              />
            </label>
            <label className="text-sm font-semibold">
              Ваше имя
              <input
                required
                minLength={2}
                name="name"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              />
            </label>
            <label className="text-sm font-semibold">
              Телефон
              <input
                required
                minLength={7}
                type="tel"
                name="phone"
                placeholder="+998"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-white/15"
              />
            </label>
            <label className="sm:col-span-2 text-sm font-semibold">
              Комментарий
              <textarea
                name="note"
                maxLength={1000}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-transparent p-3 dark:border-white/15"
              />
            </label>
            {error ? (
              <p className="sm:col-span-2 text-sm text-red-500">{error}</p>
            ) : null}
            <button
              disabled={pending}
              className="sm:col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 font-bold text-white disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" size={19} />
              ) : null}
              {pending ? "Отправляем…" : "Отправить заявку"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
