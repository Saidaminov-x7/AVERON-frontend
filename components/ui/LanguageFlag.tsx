import Image from 'next/image';

export type LocaleFlagCode = 'ru' | 'uz' | 'en';

const flags: Record<LocaleFlagCode, { label: string; src: string }> = {
  ru: { label: 'Русский', src: '/flags/ru.svg' },
  uz: { label: 'O‘zbekcha', src: '/flags/uz.svg' },
  en: { label: 'English', src: '/flags/us.svg' },
};

export function LanguageFlag({ locale, className = '' }: { locale: LocaleFlagCode; className?: string }) {
  const flag = flags[locale];
  return (
    <Image
      src={flag.src}
      alt={flag.label}
      role="img"
      width={30}
      height={20}
      className={`aspect-[3/2] h-4 w-6 shrink-0 rounded-sm border border-black/10 object-cover shadow-sm dark:border-white/20 ${className}`}
    />
  );
}
