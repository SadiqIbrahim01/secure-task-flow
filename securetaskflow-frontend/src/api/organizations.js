import api from './axios';

export const createOrganization = (data) =>
  api.post('/organizations', data);

export const getOrganization = (orgId) =>
  api.get(`/organizations/${orgId}`);

export const getOrgMembers = (orgId) =>
  api.get(`/organizations/${orgId}/members`);

export const addOrgMember = (orgId, data) =>
  api.post(`/organizations/${orgId}/members`, data);

export const removeOrgMember = (orgId, userId) =>
  api.delete(`/organizations/${orgId}/members/${userId}`);