// src/lib/siteSettings.ts
// Получение настроек сайта с кэшированием

import { api } from './api';

export interface NavLink {
  label: string | Record<string, string>;
  url?: string;
  href?: string;
  position?: 'header' | 'footer' | string;
}

export interface PublicSiteSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string | null;
  navLinks?: NavLink[] | null;
  mobilePinchZoomEnabled?: boolean;
  googleAuthEnabled?: boolean;
  autoModerationEnabled?: boolean;
}

// Кэш настроек
let cachedSettings: PublicSiteSettings | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

/**
 * Получить публичные настройки сайта (с кэшированием)
 */
export const getSiteSettings = async (): Promise<PublicSiteSettings> => {
  const now = Date.now();

  // Возвращаем кэш, если он ещё актуален
  if (cachedSettings && now - lastFetchTime < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const { data } = await api.get('/site-settings/public');
    cachedSettings = {
      siteName: data.siteName || 'AVERON',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      logoUrl: data.logoUrl || null,
      navLinks: data.navLinks || null,
      mobilePinchZoomEnabled: data.mobilePinchZoomEnabled ?? true,
      googleAuthEnabled: data.googleAuthEnabled ?? true,
      autoModerationEnabled: data.autoModerationEnabled ?? false,
    };
    lastFetchTime = now;
    return cachedSettings;
  } catch {
    return {
      siteName: 'AVERON',
      contactEmail: '',
      contactPhone: '',
      logoUrl: null,
      navLinks: null,
      mobilePinchZoomEnabled: true,
      googleAuthEnabled: true,
      autoModerationEnabled: false,
    };
  }
};
