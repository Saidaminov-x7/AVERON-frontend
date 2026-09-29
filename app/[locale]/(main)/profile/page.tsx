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
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const [tab, setTab] = useState<Tab>("overview");
  const [favorites, setFavorites] = useState<StoreProduct[]>([]);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [aiSessions, setAiSessions] = useState<AiSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
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
            className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${tab === id ? "bg-violet-600 text-white" : "border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900"}`}
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
      ) : null}
      {!loading && tab === "orders" ? (
        <section className="mt-6 space-y-3">
          {orders.length ? orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs text-stone-500">Заказ</p><h2 className="font-bold">№ {order.orderNumber}</h2></div>
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600">{order.status}</span>
              </div>
              <div className="mt-4 space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0">× {item.quantity}</span></div>)}</div>
              <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 text-sm dark:border-white/10"><span className="text-stone-500">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</span><strong>{Number(order.totalRevenue).toLocaleString("ru-RU")} {order.currency}</strong></div>
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
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
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
                <MonitorSmartphone className="shrink-0 text-violet-600" />
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
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-violet-600 px-5 font-semibold text-white"
      >
        {action}
      </Link>
    </div>
  );
}
