export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="text-center">
        <div className="text-2xl font-black tracking-[.24em]">AVERON</div>
        <div className="mx-auto mt-5 size-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <p className="mt-3 text-xs text-[var(--color-muted)]">Загружаем оформление</p>
      </div>
    </div>
  );
}
