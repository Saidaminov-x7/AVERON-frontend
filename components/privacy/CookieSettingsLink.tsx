export function CookieSettingsLink({ label }: { label: string }) {
  const open = () => window.dispatchEvent(new Event('averon-open-consent-settings'));
  return (
    <button type="button" data-cookie-settings-trigger onClick={open} className="averon-secondary-button min-h-11">
      {label}
    </button>
  );
}
