import { getErrorDetails } from '@/lib/errorDetails';

type Locale = 'ru' | 'uz' | 'en';
type ErrorContext = 'login' | 'registration' | 'passwordReset';

const messages: Record<Locale, Record<string, string>> = {
  ru: {
    smsDisabled: 'Подтверждение по SMS сейчас недоступно. Попробуйте позже.',
    phoneRegistered: 'Этот номер уже зарегистрирован. Войдите в аккаунт.',
    invalidCredentials: 'Не удалось подтвердить данные. Проверьте номер и пароль.',
    rateLimited: 'Слишком много попыток. Подождите и попробуйте снова.',
    server: 'Сервис временно недоступен. Попробуйте позже.',
    login: 'Не удалось войти. Проверьте данные и попробуйте снова.',
    registration: 'Не удалось выполнить регистрацию. Попробуйте позже.',
    passwordReset: 'Не удалось изменить пароль. Проверьте данные и попробуйте снова.',
  },
  uz: {
    smsDisabled: 'SMS orqali tasdiqlash hozir mavjud emas. Keyinroq urinib ko‘ring.',
    phoneRegistered: 'Bu raqam allaqachon ro‘yxatdan o‘tgan. Hisobingizga kiring.',
    invalidCredentials: 'Ma’lumotlarni tasdiqlab bo‘lmadi. Telefon raqami va parolni tekshiring.',
    rateLimited: 'Urinishlar soni oshib ketdi. Biroz kutib, qayta urinib ko‘ring.',
    server: 'Xizmat vaqtincha ishlamayapti. Keyinroq urinib ko‘ring.',
    login: 'Kirish amalga oshmadi. Ma’lumotlarni tekshirib qayta urinib ko‘ring.',
    registration: 'Ro‘yxatdan o‘tib bo‘lmadi. Keyinroq urinib ko‘ring.',
    passwordReset: 'Parolni almashtirib bo‘lmadi. Ma’lumotlarni tekshirib qayta urinib ko‘ring.',
  },
  en: {
    smsDisabled: 'SMS verification is currently unavailable. Please try again later.',
    phoneRegistered: 'This phone number is already registered. Sign in instead.',
    invalidCredentials: 'We could not verify your details. Check your phone number and password.',
    rateLimited: 'Too many attempts. Wait a moment and try again.',
    server: 'The service is temporarily unavailable. Please try again later.',
    login: 'Sign-in failed. Check your details and try again.',
    registration: 'Registration could not be completed. Please try again later.',
    passwordReset: 'The password could not be changed. Check your details and try again.',
  },
};

export function getLocalizedApiError(
  error: unknown,
  locale: string,
  context: ErrorContext,
): string {
  const localized = messages[(locale in messages ? locale : 'ru') as Locale];
  const { code, status } = getErrorDetails(error);

  if (code === 'FEATURE_DISABLED' || code === 'SMS_PROVIDER_NOT_CONFIGURED') {
    return localized.smsDisabled;
  }
  if (code === 'PHONE_ALREADY_REGISTERED') return localized.phoneRegistered;
  if (status === 429) return localized.rateLimited;
  if (status === 401 || status === 403) return localized.invalidCredentials;
  if (status !== undefined && status >= 500) return localized.server;
  return localized[context];
}
