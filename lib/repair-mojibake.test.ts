import { describe, expect, it } from 'vitest';
import { repairMojibake } from './repair-mojibake';

describe('repairMojibake', () => {
  it('restores garbled Russian UI copy', () => {
    expect(repairMojibake('Р’РёСЂС‚СѓР°Р»СЊРЅР°СЏ РїСЂРёРјРµСЂРѕС‡РЅР°СЏ')).toBe('Виртуальная примерочная');
  });

  it('preserves valid English and Uzbek copy', () => {
    expect(repairMojibake('Virtual fitting room')).toBe('Virtual fitting room');
    expect(repairMojibake('Kiyib koвЂrish')).toBe('Kiyib ko‘rish');
  });
});
