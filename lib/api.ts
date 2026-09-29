import api, { externalBaseURL } from './axios';
export { api, externalBaseURL };
export { getSiteSettings } from './siteSettings';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────

export const register = async (data: RegisterPayload) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const login = async (identifierOrEmail: string, password: string) => {
  const response = await api.post('/auth/login', {
    email: identifierOrEmail,
    password,
  });
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const googleAuth = async (payload: {
  idToken: string;
  phone?: string;
}) => {
  const response = await api.post('/auth/google', payload);
  return response.data;
};

export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const forgotPassword = async (email: string, locale?: string) => {
  const response = await api.post('/auth/forgot-password', { email, locale: locale || 'ru' });
  return response.data;
};

export const resetPassword = async (payload: { token: string; password: string }) => {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
};

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (!response.data?.url) {
    throw new Error('Failed to upload image: no URL returned');
  }
  return response.data;
};
