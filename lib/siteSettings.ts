// src/lib/siteSettings.ts
// Получение настроек сайта с кэшированием

import { api } from './api';

export interface PublicSiteSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string | null;
  navLinks?: any[] | null;
  mobilePinchZoomEnabled?: boolean;
  googleAuthEnabled?: boolean;
  autoModerationEnabled?: boolean;
  maxImagesPerListing?: number;
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
      maxImagesPerListing: data.maxImagesPerListing ?? 10,
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
      maxImagesPerListing: 10,
    };
  }
};
