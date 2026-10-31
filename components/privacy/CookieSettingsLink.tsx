'use client';

export function CookieSettingsLink({ label }: { label: string }) {
  const open = () => window.dispatchEvent(new Event('averon-open-consent-settings'));
  return (
    <button type="button" onClick={open} className="averon-secondary-button min-h-11">
      {label}
    </button>
  );
}
