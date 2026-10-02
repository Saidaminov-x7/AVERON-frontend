'use client';

export function SmsUnavailableNotice({ locale }: { locale: string }) {
  const message = locale === 'uz'
    ? 'SMS orqali tasdiqlash hozir mavjud emas. Keyinroq urinib ko‘ring.'
    : locale === 'en'
      ? 'SMS verification is currently unavailable. Please try again later.'
      : 'Подтверждение по SMS сейчас недоступно. Попробуйте позже.';

  return (
    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300" role="status">
      {message}
    </p>
  );
}
