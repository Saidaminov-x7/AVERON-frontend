import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollToTop } from './ScrollToTop';

const metricNames = ['pageYOffset', 'innerWidth', 'innerHeight'] as const;
const originalMetricDescriptors = new Map(metricNames.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]));

describe('ScrollToTop', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    for (const name of metricNames) {
      const descriptor = originalMetricDescriptors.get(name);
      if (descriptor) Object.defineProperty(window, name, descriptor);
      else Reflect.deleteProperty(window, name);
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('hides while its fixed area would cover a visible action and returns when clear', () => {
    const frames: FrameRequestCallback[] = [];
    const action = document.createElement('a');
    action.href = '/catalog';
    action.textContent = 'Browse catalog';
    document.body.append(action);

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 450 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });

    let actionRect = new DOMRect(330, 780, 40, 40);
    vi.spyOn(action, 'getBoundingClientRect').mockImplementation(() => actionRect);
    render(<ScrollToTop />);

    act(() => frames.splice(0).forEach((callback) => callback(0)));
    expect(document.querySelector('[data-scroll-to-top]')).not.toBeInTheDocument();

    actionRect = new DOMRect(16, 500, 120, 44);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      frames.splice(0).forEach((callback) => callback(0));
    });
    expect(document.querySelector('[data-scroll-to-top]')).toBeInTheDocument();
  });
});
