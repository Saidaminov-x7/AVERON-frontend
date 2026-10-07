"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("profile");
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
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyProfileStatus, setBodyProfileStatus] = useState<"saved" | "error" | "">("");
  const favoriteIdsKey = favoriteIds.join("|");
  const formatLocale =
    locale === "uz" ? "uz-UZ" : locale === "en" ? "en-US" : "ru-RU";

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
  useEffect(() => {
    // Profile values are loaded asynchronously into the auth store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeightCm(user?.heightCm ? String(user.heightCm) : "");
    setWeightKg(user?.weightKg ? String(user.weightKg) : "");
  }, [user?.heightCm, user?.weightKg]);

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
  const saveBodyProfile = async () => {
    setBodyProfileStatus("");
    try {
      const { data } = await api.patch<{ heightCm: number | null; weightKg: number | null }>("/auth/me/body-profile", {
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
      });
      if (user) setUser({ ...user, ...data });
      setBodyProfileStatus("saved");
    } catch {
      setBodyProfileStatus("error");
    }
  };
  const tabs: Array<{
    id: Tab;
    label: string;
    icon: typeof User;
    count?: number;
  }> = [
    { id: "overview", label: t("tabs.overview"), icon: User },
    { id: "orders", label: t("tabs.orders"), icon: PackageCheck, count: orders.length },
    { id: "favorites", label: t("tabs.favorites"), icon: Heart, count: favorites.length },
    { id: "ai", label: t("tabs.ai"), icon: Bot, count: aiSessions.length },
    {
      id: "sessions",
      label: t("tabs.sessions"),
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
                {user?.name || t("accountName")}
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                <ShieldCheck className="mr-1 inline" size={13} />
                {t("active")}
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
                  {t("phoneMissing")}
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
            {t("signOut")}
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
          {t("loading")}
        </div>
      ) : null}
      {!loading && tab === "overview" ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <Info
              title={t("savedProducts")}
              value={String(favorites.length)}
              text={t("savedProductsDescription")}
            />
            <Info
              title={t("aiConversations")}
              value={String(aiSessions.length)}
              text={t("accountStoredDescription")}
            />
            <Info
              title={t("activeSessions")}
              value={String(sessions.length)}
              text={t("signedInDevicesDescription")}
            />
          </section>
          <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-1 shrink-0 text-primary-700 dark:text-primary-300" size={19} />
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">
                  {t("defaultCountry")}
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {t("defaultCountryDescription")}
                </p>
                <Select
                  value={user?.defaultCatalogCountry ?? ""}
                  disabled={savingCatalogCountry}
                  onValueChange={(country) => void saveDefaultCatalogCountry(country)}
                >
                  <SelectTrigger
                    aria-label={t("defaultCountry")}
                    aria-busy={savingCatalogCountry}
                    className="mt-3 max-w-sm"
                  >
                    <SelectValue placeholder={t("countries.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("countries.all")}</SelectItem>
                    <SelectItem value="CN">{t("countries.CN")}</SelectItem>
                    <SelectItem value="US">{t("countries.US")}</SelectItem>
                    <SelectItem value="TR">{t("countries.TR")}</SelectItem>
                    <SelectItem value="IT">{t("countries.IT")}</SelectItem>
                    <SelectItem value="GB">{t("countries.GB")}</SelectItem>
                  </SelectContent>
                </Select>
                {savingCatalogCountry ? (
                  <p className="mt-2 text-sm text-stone-500" role="status">
                    {t("saving")}
                  </p>
                ) : catalogCountryStatus ? (
                  <p className={`mt-2 text-sm ${catalogCountryStatus === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`} role={catalogCountryStatus === "error" ? "alert" : "status"}>
                    {catalogCountryStatus === "error"
                      ? t("saveFailed")
                      : t("saved")}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
          <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
            <h2 className="font-bold">Размер по параметрам</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Заполните необязательно — рекомендация появится только после ввода роста и веса.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">{t("bodyProfile.heightLabel")}<input type="number" min="80" max="250" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-transparent px-3 dark:border-white/20" placeholder={user?.heightCm ? String(user.heightCm) : t("bodyProfile.heightPlaceholder")} /></label>
              <label className="text-sm">{t("bodyProfile.weightLabel")}<input type="number" min="20" max="300" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-transparent px-3 dark:border-white/20" placeholder={user?.weightKg ? String(user.weightKg) : t("bodyProfile.weightPlaceholder")} /></label>
            </div>
            <button type="button" onClick={() => void saveBodyProfile()} className="averon-primary-button mt-4">Сохранить параметры</button>
            {bodyProfileStatus ? <p className={`mt-2 text-sm ${bodyProfileStatus === "error" ? "text-red-600" : "text-emerald-600"}`}>{bodyProfileStatus === "error" ? "Не удалось сохранить" : "Сохранено"}</p> : null}
            <p className="mt-4 text-sm text-stone-500">{t("bodyProfile.noRecommendation")}</p>
          </section>
        </>
      ) : null}
      {!loading && tab === "orders" ? (
        <section className="mt-6 space-y-3">
          {orders.length ? orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs text-stone-500">{t("order")}</p><h2 className="font-bold">№ {order.orderNumber}</h2></div>
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700">{order.status}</span>
              </div>
              <div className="mt-4 space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0">× {item.quantity}</span></div>)}</div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm dark:border-white/10">
                <span className="text-stone-500">{new Date(order.createdAt).toLocaleDateString(formatLocale)}</span>
                <div className="flex items-center gap-4"><strong>{Number(order.totalRevenue).toLocaleString(formatLocale)} {order.currency}</strong><Link href={`/${locale}/orders/${encodeURIComponent(order.orderNumber)}`} className="inline-flex h-11 items-center gap-1 rounded-lg px-3 font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/30">{t("details")}<ArrowRight size={15} /></Link></div>
              </div>
            </article>
          )) : <Empty title={t("noOrders")} href={`/${locale}/catalog`} action={t("browseProducts")} />}
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
              title={t("noFavorites")}
              href={`/${locale}/catalog`}
              action={t("openCatalog")}
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
                    {session.title || t("aiConversation")}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(
                      session.updatedAt || session.createdAt,
                    ).toLocaleString(formatLocale)}{" "}
                    · {t("messageCount", { count: session._count?.messages ?? 0 })}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <Empty
              title={t("noAiHistory")}
              href={`/${locale}/ai`}
              action={t("openAi")}
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
                    {session.userAgent || t("unknownDevice")}{" "}
                    {session.current ? (
                      <span className="ml-2 text-xs text-emerald-600">
                        {t("currentSession")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 break-words text-xs text-stone-500">
                    {session.ipAddress || t("ipHidden")} ·{" "}
                    {new Date(session.lastSeenAt).toLocaleString(formatLocale)}
                  </p>
                </div>
                <button
                  aria-label={t("endSession")}
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
