import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalBaseURL } from '@/lib/axios';
import { GlobalErrorListener } from './GlobalErrorListener';

describe('GlobalErrorListener API isolation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends optional error reports only to the sanitized local API origin in tests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<GlobalErrorListener />);
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'safe test fixture',
      filename: window.location.href,
    }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0][0]).toBe(`${externalBaseURL}/error-reports`);
    expect(new URL(fetchMock.mock.calls[0][0]).origin).toBe('http://127.0.0.1:8080');
  });
});
