import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from './axios';

const authStore = vi.hoisted(() => ({ getState: vi.fn() }));

vi.mock('@/store/useAuthStore', () => ({ useAuthStore: authStore }));

describe('authenticated API requests', () => {
  let token: string;
  let previousApiAdapter: typeof api.defaults.adapter;
  let previousAxiosAdapter: typeof axios.defaults.adapter;
  const setToken = vi.fn((value: string) => {
    token = value;
  });
  const clearAuth = vi.fn();

  beforeEach(() => {
    token = 'expired-access-token';
    setToken.mockClear();
    clearAuth.mockClear();
    authStore.getState.mockImplementation(() => ({
      accessToken: token,
      setToken,
      clearAuth,
    }));
    previousApiAdapter = api.defaults.adapter;
    previousAxiosAdapter = axios.defaults.adapter;
  });

  afterEach(() => {
    api.defaults.adapter = previousApiAdapter;
    axios.defaults.adapter = previousAxiosAdapter;
    vi.restoreAllMocks();
  });

  it('sends cookies and retries a 401 with a refreshed access token', async () => {
    const apiRequests: Array<{
      withCredentials?: boolean;
      authorization: unknown;
    }> = [];
    let refreshRequest: InternalAxiosRequestConfig | undefined;
    let apiAttempt = 0;

    api.defaults.adapter = async (config) => {
      apiRequests.push({
        withCredentials: config.withCredentials,
        authorization: config.headers.get('Authorization'),
      });
      apiAttempt += 1;
      if (apiAttempt === 1) {
        const response: AxiosResponse = {
          config,
          data: {},
          headers: new AxiosHeaders(),
          status: 401,
          statusText: 'Unauthorized',
        };
        throw new AxiosError(
          'Unauthorized',
          AxiosError.ERR_BAD_REQUEST,
          config,
          undefined,
          response,
        );
      }
      return {
        config,
        data: { ok: true },
        headers: new AxiosHeaders(),
        status: 200,
        statusText: 'OK',
      };
    };

    axios.defaults.adapter = async (config) => {
      refreshRequest = config;
      return {
        config,
        data: { accessToken: 'fresh-access-token' },
        headers: new AxiosHeaders(),
        status: 200,
        statusText: 'OK',
      };
    };

    await expect(api.get('/account')).resolves.toMatchObject({
      data: { ok: true },
    });

    expect(apiRequests).toHaveLength(2);
    expect(apiRequests[0].withCredentials).toBe(true);
    expect(apiRequests[0].authorization).toMatch(/^Bearer /);
    expect(refreshRequest?.url).toContain('/auth/refresh');
    expect(refreshRequest?.withCredentials).toBe(true);
    expect(setToken).toHaveBeenCalledWith('fresh-access-token');
    expect(apiRequests[1].authorization).toMatch(/^Bearer /);
    expect(apiRequests[1].authorization).not.toBe(apiRequests[0].authorization);
    expect(apiRequests[1].withCredentials).toBe(true);
  });
});
