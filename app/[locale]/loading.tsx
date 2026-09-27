export default function Loading() {
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white"><div className="text-center"><div className="text-2xl font-black tracking-[.24em]">AVERON</div><div className="mx-auto mt-5 size-8 animate-spin rounded-full border-2 border-stone-300 border-t-violet-600"/><p className="mt-3 text-xs text-stone-500">Загружаем оформление</p></div></div>;
}
