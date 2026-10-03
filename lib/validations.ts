import { z } from 'zod';

/**
 * Узбекский номер телефона: +998 XX XXX-XX-XX
 * Код оператора: 33,50,55,61,62,65,66,67,70,71,72,73,74,75,76,77,78,88,90,91,93,94,95,97,98,99
 * Здесь используется упрощённая, но безопасная проверка формата.
 */
export const uzPhoneRegex = /^\+998\d{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => uzPhoneRegex.test(v), 'Введите номер в формате +998 90 123-45-67');

export const MAX_FILE_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** Client-side validation before uploading a product photo. */
export function validateImageFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || !ACCEPTED_IMAGE_EXTENSIONS.includes(ext)) {
    return 'Допустимы только файлы .jpg, .png, .webp';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Файл больше ${MAX_FILE_SIZE_MB} МБ`;
  }
  return null;
}
