import { describe, expect, it } from 'vitest';
import { repairMojibake } from './repair-mojibake';
import ru from '../messages/ru.json';

describe('repairMojibake', () => {
  it('normalizes nested message-bundle encoding instead of leaving a partial repair', () => {
    expect(repairMojibake(repairMojibake(ru.ResetPassword.title))).toBe('Сброс пароля');
  });

  it('restores garbled Russian UI copy', () => {
    expect(repairMojibake('РџСЂРёРјРµСЂРёС‚СЊ')).toBe('Примерить');
  });

  it('preserves valid English and Uzbek copy', () => {
    expect(repairMojibake('Virtual fitting room')).toBe('Virtual fitting room');
    expect(repairMojibake('Kiyib ko‘rish')).toBe('Kiyib ko‘rish');
  });
});
