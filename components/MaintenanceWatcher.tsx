'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function MaintenanceWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const locale = pathname.split('/')[1];
    if (!['ru', 'uz', 'en'].includes(locale) || pathname === `/${locale}/maintenance`) return;
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== 'visible' || document.cookie.split(';').some((part) => part.trim() === 'maintenance_bypass=true')) return;
      try {
        const response = await fetch('/api/backend/site-settings/public', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data.maintenanceMode) {
          const target = new URLSearchParams({ returnTo: `${pathname}${search ? `?${search}` : ''}` });
          router.replace(`/${locale}/maintenance?${target.toString()}`);
        }
      } catch { /* An unavailable settings endpoint does not redirect the user. */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    const timer = window.setInterval(check, 10000);
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [pathname, router, search]);
  return null;
}
