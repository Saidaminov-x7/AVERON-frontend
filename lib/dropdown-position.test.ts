import { describe, expect, it } from 'vitest';
import { calculateDropdownPosition } from './dropdown-position';

const viewport = { viewportWidth: 800, viewportHeight: 600 };

describe('calculateDropdownPosition', () => {
  it('enough space below: opens down when ample space exists below the trigger', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 100, bottom: 140, left: 20, right: 220, width: 200 },
      menuHeight: 200,
    });
    expect(result.placement).toBe('down');
    expect(result.top).toBe(144); // trigger.bottom (140) + gap (4)
    expect(result.maxHeight).toBe(200);
  });

  it('not enough below: flips upward when space below is insufficient', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 400, bottom: 440, left: 20, right: 220, width: 200 },
      menuHeight: 200, // below space is 600 - 8 - 440 - 4 = 148 < 200
    });
    expect(result.placement).toBe('up');
  });

  it('more space above: selects upward placement when above has more room than below', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 500, bottom: 540, left: 20, right: 220, width: 200 },
      menuHeight: 220,
    });
    expect(result.placement).toBe('up');
    expect(result.top + result.maxHeight).toBe(496); // trigger.top (500) - gap (4)
  });

  it('tiny viewport: constrains menu height and keeps within viewport', () => {
    const result = calculateDropdownPosition({
      viewportWidth: 320,
      viewportHeight: 200,
      trigger: { top: 80, bottom: 120, left: 10, right: 110, width: 100 },
      menuHeight: 300,
    });
    expect(result.maxHeight).toBeLessThanOrEqual(200);
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.left).toBeGreaterThanOrEqual(8);
  });

  it('long menu: constrains maxHeight to available space with scrolling enabled', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 250, bottom: 290, left: 50, right: 250, width: 200 },
      menuHeight: 1200,
    });
    expect(result.maxHeight).toBeLessThan(600);
    expect(result.maxHeight).toBeGreaterThan(0);
  });

  it('left collision: clamps menu to viewport gutter when trigger is offscreen to the left', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 100, bottom: 140, left: -50, right: 150, width: 200 },
      menuHeight: 100,
      gutter: 12,
    });
    expect(result.left).toBe(12);
  });

  it('right collision: clamps menu within viewport right edge gutter', () => {
    const result = calculateDropdownPosition({
      ...viewport,
      trigger: { top: 100, bottom: 140, left: 700, right: 900, width: 200 },
      menuHeight: 100,
      gutter: 8,
    });
    expect(result.left + result.width).toBe(792); // 800 - 8
  });
});
