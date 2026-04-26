
import api from './axios';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// These use plain axios — no auth header needed
export const register = (data) =>
  axios.post(`${BASE_URL}/auth/register`, data);

export const login = (data) =>
  axios.post(`${BASE_URL}/auth/login`, data);

export const logout = () =>
  api.post('/auth/logout');