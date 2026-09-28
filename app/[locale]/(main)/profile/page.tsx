'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User, Heart, PlusCircle, LogOut, Building, Phone, Mail, MonitorSmartphone, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ApartmentCard } from '@/app/[locale]/(main)/catalog/components/ApartmentCard';
import { getMyListings, getFavorites } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Apartment } from '@/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';

type AuthSession = { id: string; userAgent?: string; ipAddress?: string; createdAt: string; lastSeenAt: string; current: boolean };

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ru';

  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('myListings');
  const [myListings, setMyListings] = useState<Apartment[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try { setSessions((await api.get<AuthSession[]>('/auth/sessions')).data); }
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (id: string, current: boolean) => {
    await api.delete(`/auth/sessions/${id}`);
    if (current) return handleLogout();
    await loadSessions();
  };

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [myApts, favApts] = await Promise.all([
          getMyListings(),
          getFavorites(),
        ]);

        setMyListings(myApts);
        setFavoriteListings(favApts);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  useEffect(() => { void loadSessions(); }, []);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-stone-200/80 bg-white p-6 md:flex-row md:items-center dark:border-white/10 dark:bg-[#1f1f1f]">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-400">
          <User size={36} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
              {user?.name || 'Пользователь'}
            </h1>
            {user?.role && (
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                {user.role}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-500 dark:text-stone-400">
            {user?.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                {user.email}
              </span>
            )}
            {user?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                {user.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-950/30"
          >
            <LogOut size={16} className="mr-2" />
            {t('logout')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="myListings" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="myListings" className="gap-2">
            <PlusCircle size={16} />
            {t('myListings')} ({myListings.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart size={16} />
            {t('favorites')} ({favoriteListings.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <MonitorSmartphone size={16} /> Сессии ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="myListings">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              {t('myListings')}
            </h2>
            <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white">
              <Link href={`/${locale}/catalog`}>
                <PlusCircle size={16} className="mr-2" />
                {t('addListing')}
              </Link>
            </Button>
          </div>

          {myListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myListings.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-[#1f1f1f]">
              <Building size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600" />
              <h3 className="mb-2 text-lg font-semibold text-stone-900 dark:text-white">
                {t('noListingsTitle')}
              </h3>
              <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                {t('noListingsText')}
              </p>
              <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white">
                <Link href={`/${locale}/catalog`}>
                  <PlusCircle size={16} className="mr-2" />
                  {t('addFirstListing')}
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <h2 className="mb-6 text-xl font-bold text-stone-900 dark:text-white">
            {t('favorites')}
          </h2>

          {favoriteListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favoriteListings.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-[#1f1f1f]">
              <Heart size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600" />
              <h3 className="mb-2 text-lg font-semibold text-stone-900 dark:text-white">
                {t('noFavoritesTitle')}
              </h3>
              <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                {t('noFavoritesText')}
              </p>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/catalog`}>
                  {t('browseCatalog')}
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="sessions">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-bold">Активные сессии</h2><p className="mt-1 text-sm text-stone-500">Устройства, на которых выполнен вход в ваш аккаунт.</p></div>
              <button onClick={async () => { await api.delete('/auth/sessions'); await loadSessions(); }} className="h-10 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-500 hover:bg-red-500/10">Завершить остальные</button>
            </div>
            <div className="mt-5 divide-y divide-stone-200 dark:divide-white/10">
              {sessionsLoading ? <p className="py-8 text-center text-sm text-stone-500">Загружаем сессии…</p> : sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><MonitorSmartphone size={19}/></div>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{session.userAgent || 'Неизвестное устройство'}</p>{session.current ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500">Текущая</span> : null}</div><p className="mt-1 text-xs text-stone-500">{session.ipAddress || 'IP скрыт'} · активность {new Date(session.lastSeenAt).toLocaleString('ru-RU')}</p></div>
                  <button onClick={() => void revokeSession(session.id, session.current)} aria-label="Завершить сессию" className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:border-red-500/40 hover:text-red-500 dark:border-white/10"><X size={16}/></button>
                </div>
              ))}
              {!sessionsLoading && sessions.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">Активных сессий не найдено.</p> : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
