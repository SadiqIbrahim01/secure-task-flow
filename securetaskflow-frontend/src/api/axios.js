import axios from 'axios';
import useAuthStore from '../store/authStore';
import { isTokenExpired } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// The main API instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Separate instance for refresh calls — avoids infinite loops
const refreshApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Track if a refresh is in progress — prevents multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// REQUEST interceptor — attach access token to every request
api.interceptors.request.use(
  async (config) => {
    const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!accessToken) return config;

    // Proactively refresh if token is expired or about to expire
    if (isTokenExpired(accessToken) && refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const response = await refreshApi.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
          setTokens(newAccess, newRefresh);
          processQueue(null, newAccess);
          config.headers.Authorization = `Bearer ${newAccess}`;
        } catch (error) {
          processQueue(error, null);
          logout();
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        });
      }
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor — handle 401s (token expired mid-flight)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const response = await refreshApi.post('/auth/refresh', { refreshToken });
            const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
            setTokens(newAccess, newRefresh);
            processQueue(null, newAccess);
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;