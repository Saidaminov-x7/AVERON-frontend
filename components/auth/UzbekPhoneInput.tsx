'use client';

import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { forwardRef, useId, useState } from 'react';
import { formatUzbekPhoneInput, hasUnsupportedInternationalPhoneCountryCode } from '@/lib/phone';

type UzbekPhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
  locale?: string;
};

export const UzbekPhoneInput = forwardRef<HTMLInputElement, UzbekPhoneInputProps>(function UzbekPhoneInput(
  { value, onValueChange, onKeyDown, locale = 'ru', className, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  const errorId = useId();
  const [unsupportedCountryCode, setUnsupportedCountryCode] = useState(false);
  const countryCodeMessage = locale === 'uz'
    ? '+998 kodi bilan raqam kiriting. Boshqa davlat kodlari qo‘llab-quvvatlanmaydi.'
    : locale === 'en'
      ? 'Enter a phone number with the +998 country code. Other country codes are not supported.'
      : 'Введите номер с кодом +998. Номера других стран не поддерживаются.';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (hasUnsupportedInternationalPhoneCountryCode(event.currentTarget.value)) {
      setUnsupportedCountryCode(true);
      event.currentTarget.setCustomValidity(countryCodeMessage);
      return;
    }

    setUnsupportedCountryCode(false);
    event.currentTarget.setCustomValidity('');
    onValueChange(formatUzbekPhoneInput(event.currentTarget.value));
  };

  return (
    <span className="relative block w-full min-w-0 flex-1">
      <input
        {...props}
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={formatUzbekPhoneInput(value)}
        onChange={handleChange}
        onKeyDown={(event) => {
          const selectionStart = event.currentTarget.selectionStart ?? 0;
          const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart;
          if ((event.key === 'Backspace' || event.key === 'Delete') && selectionStart <= 5 && selectionEnd <= 5) {
            event.preventDefault();
            event.currentTarget.setSelectionRange(5, 5);
          }
          onKeyDown?.(event);
        }}
        aria-invalid={unsupportedCountryCode || ariaInvalid || undefined}
        aria-describedby={unsupportedCountryCode ? [ariaDescribedBy, errorId].filter(Boolean).join(' ') : ariaDescribedBy}
        className={`w-full min-w-0 ${className ?? ''}`.trim()}
        pattern="\+998 \d{2} \d{3} \d{2} \d{2}"
        maxLength={17}
      />
      {unsupportedCountryCode ? <span id={errorId} role="alert" className="mt-1 block text-xs leading-4 text-red-600 dark:text-red-400">{countryCodeMessage}</span> : null}
    </span>
  );
});
