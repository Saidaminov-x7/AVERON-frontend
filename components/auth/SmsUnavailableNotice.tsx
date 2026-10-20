'use client';

export function SmsUnavailableNotice({ locale }: { locale: string }) {
  const message = locale === 'uz'
    ? 'SMS orqali tasdiqlash hozir mavjud emas. Keyinroq urinib ko‘ring.'
    : locale === 'en'
      ? 'SMS verification is currently unavailable. Please try again later.'
      : 'Подтверждение по SMS сейчас недоступно. Попробуйте позже.';

  return (
    <p className="rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-warning" role="status">
      {message}
    </p>
  );
}
