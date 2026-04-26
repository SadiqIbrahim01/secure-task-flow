import api from './axios';

export const listUsers = (params) =>
  api.get('/admin/users', { params });

export const suspendUser = (userId) =>
  api.put(`/admin/users/${userId}/suspend`);

export const unsuspendUser = (userId) =>
  api.put(`/admin/users/${userId}/unsuspend`);

export const getAuditLogs = (params) =>
  api.get('/admin/audit-logs', { params });