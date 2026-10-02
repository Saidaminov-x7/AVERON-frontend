"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Heart,
  LoaderCircle,
  LogOut,
  MonitorSmartphone,
  PackageCheck,
  Phone,
  ShieldCheck,
  User,
  X,
  ArrowRight,
  Globe2,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
import { getProduct } from "@/lib/products";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type AuthSession = {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  lastSeenAt: string;
  current: boolean;
};
type AiSession = {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: { messages: number };
};
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalRevenue: string | number;
  createdAt: string;
  items: Array<{ id: string; title: string; quantity: number }>;
};
type Tab = "overview" | "orders" | "favorites" | "ai" | "sessions";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { locale = "ru" } = useParams<{ locale: string }>();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const setUser = useAuthStore((state) => state.setUser);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const [tab, setTab] = useState<Tab>("overview");
  const [favorites, setFavorites] = useState<StoreProduct[]>([]);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [aiSessions, setAiSessions] = useState<AiSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCatalogCountry, setSavingCatalogCountry] = useState(false);
  const [catalogCountryStatus, setCatalogCountryStatus] = useState<"saved" | "error" | "">("");
  const favoriteIdsKey = favoriteIds.join("|");

  const load = async () => {
    setLoading(true);
    const [favoriteResult, authResult, aiResult, ordersResult] =
      await Promise.allSettled([
        Promise.all(favoriteIds.map(getProduct)),
        api.get<AuthSession[]>("/auth/sessions"),
        api.get<AiSession[]>("/ai-chat/sessions"),
        api.get<Order[]>("/api/v1/orders/me"),
      ]);
    if (favoriteResult.status === "fulfilled")
      setFavorites(
        favoriteResult.value.filter(
          (item): item is StoreProduct => item !== null,
        ),
      );
    if (authResult.status === "fulfilled") setSessions(authResult.value.data);
    if (aiResult.status === "fulfilled") setAiSessions(aiResult.value.data);
    if (ordersResult.status === "fulfilled") setOrders(ordersResult.value.data);
    setLoading(false);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIdsKey]);

  const signOut = async () => {
    await logout();
    router.push(`/${locale}`);
    router.refresh();
  };
  const saveDefaultCatalogCountry = async (country: string) => {
    setSavingCatalogCountry(true);
    setCatalogCountryStatus("");
    try {
      const { data } = await api.patch<{ defaultCatalogCountry: "CN" | "US" | "TR" | "IT" | "GB" | null }>(
        "/auth/me/catalog-country",
        { country: country || null },
      );
      if (user) setUser({ ...user, defaultCatalogCountry: data.defaultCatalogCountry });
      setCatalogCountryStatus("saved");
    } catch {
      setCatalogCountryStatus("error");
    } finally {
      setSavingCatalogCountry(false);
    }
  };
  const tabs: Array<{
    id: Tab;
    label: string;
    icon: typeof User;
    count?: number;
  }> = [
    { id: "overview", label: "Профиль", icon: User },
    { id: "orders", label: "Заказы", icon: PackageCheck, count: orders.length },
    { id: "favorites", label: "Товары", icon: Heart, count: favorites.length },
    { id: "ai", label: "История AI", icon: Bot, count: aiSessions.length },
    {
      id: "sessions",
      label: "Сессии",
      icon: MonitorSmartphone,
      count: sessions.length,
    },
  ];

  return (
    <main className="mx-auto min-w-0 max-w-7xl overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 dark:border-white/10 dark:bg-stone-900">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-700">
            <User size={30} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="max-w-full break-words text-2xl font-bold">
                {user?.name || "Пользователь AVERON"}
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                <ShieldCheck className="mr-1 inline" size={13} />
                Активен
              </span>
            </div>
            <div className="mt-2 flex min-w-0 flex-col gap-2 text-sm text-stone-500 sm:flex-row sm:flex-wrap sm:gap-4">
              {user?.phone ? (
                <span className="flex min-w-0 items-center gap-2">
                  <Phone size={15} />
                  <span className="break-all">{user.phone}</span>
                </span>
              ) : (
                <span className="text-amber-600">
                  Добавьте номер телефона для доступа к AI
                </span>
              )}
              {user?.email ? (
                <span className="break-all">{user.email}</span>
              ) : null}
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 text-sm font-semibold text-red-500"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </section>
      <nav className="mt-6 flex max-w-full gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${tab === id ? "bg-primary-700 text-white" : "border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900"}`}
          >
            <Icon size={16} />
            {label}
            {count !== undefined ? (
              <span className="opacity-70">{count}</span>
            ) : null}
          </button>
        ))}
      </nav>
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-stone-500">
          <LoaderCircle className="animate-spin" />
          Загружаем профиль…
        </div>
      ) : null}
      {!loading && tab === "overview" ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <Info
              title="Избранные товары"
              value={String(favorites.length)}
              text="Сохранены на этом устройстве"
            />
            <Info
              title="Диалоги с AI"
              value={String(aiSessions.length)}
              text="Хранятся в вашем аккаунте"
            />
            <Info
              title="Активные сессии"
              value={String(sessions.length)}
              text="Устройства с выполненным входом"
            />
          </section>
          <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-1 shrink-0 text-primary-700 dark:text-primary-300" size={19} />
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">
                  {locale === "uz" ? "Standart mahsulotlar mamlakati" : locale === "en" ? "Default product country" : "Страна товаров по умолчанию"}
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {locale === "uz" ? "Katalog ochilganda qo‘llanadi." : locale === "en" ? "Applied when you open the catalog." : "Применяется при открытии каталога."}
                </p>
                <Select
                  value={user?.defaultCatalogCountry ?? ""}
                  disabled={savingCatalogCountry}
                  onValueChange={(country) => void saveDefaultCatalogCountry(country)}
                >
                  <SelectTrigger
                    aria-label={locale === "en" ? "Default product country" : locale === "uz" ? "Standart mahsulotlar mamlakati" : "Страна товаров по умолчанию"}
                    aria-busy={savingCatalogCountry}
                    className="mt-3 max-w-sm"
                  >
                    <SelectValue placeholder={locale === "en" ? "All countries" : locale === "uz" ? "Barcha mamlakatlar" : "Все страны"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{locale === "en" ? "All countries" : locale === "uz" ? "Barcha mamlakatlar" : "Все страны"}</SelectItem>
                    <SelectItem value="CN">{locale === "en" ? "China" : locale === "uz" ? "Xitoy" : "Китай"}</SelectItem>
                    <SelectItem value="US">{locale === "en" ? "United States" : locale === "uz" ? "AQSh" : "США"}</SelectItem>
                    <SelectItem value="TR">{locale === "en" ? "Turkey" : locale === "uz" ? "Turkiya" : "Турция"}</SelectItem>
                    <SelectItem value="IT">{locale === "en" ? "Italy" : locale === "uz" ? "Italiya" : "Италия"}</SelectItem>
                    <SelectItem value="GB">{locale === "en" ? "United Kingdom" : locale === "uz" ? "Buyuk Britaniya" : "Великобритания"}</SelectItem>
                  </SelectContent>
                </Select>
                {savingCatalogCountry ? (
                  <p className="mt-2 text-sm text-stone-500" role="status">
                    {locale === "en" ? "Saving…" : locale === "uz" ? "Saqlanmoqda…" : "Сохраняем…"}
                  </p>
                ) : catalogCountryStatus ? (
                  <p className={`mt-2 text-sm ${catalogCountryStatus === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`} role={catalogCountryStatus === "error" ? "alert" : "status"}>
                    {catalogCountryStatus === "error"
                      ? locale === "en" ? "Could not save the preference. Try again." : locale === "uz" ? "Tanlov saqlanmadi. Qayta urinib ko‘ring." : "Не удалось сохранить выбор. Попробуйте ещё раз."
                      : locale === "en" ? "Preference saved." : locale === "uz" ? "Tanlov saqlandi." : "Настройка сохранена."}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </>
      ) : null}
      {!loading && tab === "orders" ? (
        <section className="mt-6 space-y-3">
          {orders.length ? orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs text-stone-500">Заказ</p><h2 className="font-bold">№ {order.orderNumber}</h2></div>
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700">{order.status}</span>
              </div>
              <div className="mt-4 space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0">× {item.quantity}</span></div>)}</div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm dark:border-white/10">
                <span className="text-stone-500">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</span>
                <div className="flex items-center gap-4"><strong>{Number(order.totalRevenue).toLocaleString("ru-RU")} {order.currency}</strong><Link href={`/${locale}/orders/${encodeURIComponent(order.orderNumber)}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/30">Подробнее<ArrowRight size={15} /></Link></div>
              </div>
            </article>
          )) : <Empty title="Заказов пока нет" href={`/${locale}/catalog`} action="Перейти к товарам" />}
        </section>
      ) : null}
      {!loading && tab === "favorites" ? (
        <section className="mt-6">
          {favorites.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <Empty
              title="Сохранённых товаров нет"
              href={`/${locale}/catalog`}
              action="Открыть каталог"
            />
          )}
        </section>
      ) : null}
      {!loading && tab === "ai" ? (
        <section className="mt-6 space-y-3">
          {aiSessions.length ? (
            aiSessions.map((session) => (
              <Link
                key={session.id}
                href={`/${locale}/ai?session=${session.id}`}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-700">
                  <Bot size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {session.title || "Диалог с AVERON AI"}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(
                      session.updatedAt || session.createdAt,
                    ).toLocaleString("ru-RU")}{" "}
                    · {session._count?.messages ?? 0} сообщений
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <Empty
              title="История AI пока пуста"
              href={`/${locale}/ai`}
              action="Открыть AI"
            />
          )}
        </section>
      ) : null}
      {!loading && tab === "sessions" ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
          <div className="divide-y divide-stone-200 dark:divide-white/10">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex min-w-0 items-center gap-3 p-4"
              >
                <MonitorSmartphone className="shrink-0 text-primary-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {session.userAgent || "Неизвестное устройство"}{" "}
                    {session.current ? (
                      <span className="ml-2 text-xs text-emerald-600">
                        Текущая
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 break-words text-xs text-stone-500">
                    {session.ipAddress || "IP скрыт"} ·{" "}
                    {new Date(session.lastSeenAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                <button
                  aria-label="Завершить сессию"
                  onClick={async () => {
                    await api.delete(`/auth/sessions/${session.id}`);
                    if (session.current) await signOut();
                    else void load();
                  }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-500 dark:border-white/10"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({
  title,
  value,
  text,
}: {
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
      <p className="text-sm text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs text-stone-500">{text}</p>
    </div>
  );
}
function Empty({
  title,
  href,
  action,
}: {
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center dark:border-white/10 dark:bg-stone-900">
      <h2 className="text-xl font-bold">{title}</h2>
      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary-700 px-5 font-semibold text-white"
      >
        {action}
      </Link>
    </div>
  );
}
