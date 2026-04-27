import api from './axios';

export const createTask = (projectId, data) =>
  api.post(`/projects/${projectId}/tasks`, data);

export const listTasks = (projectId, params) =>
  api.get(`/projects/${projectId}/tasks`, { params });

export const getTask = (projectId, taskId) =>
  api.get(`/projects/${projectId}/tasks/${taskId}`);

export const updateTask = (projectId, taskId, data) =>
  api.put(`/projects/${projectId}/tasks/${taskId}`, data);

export const updateTaskStatus = (projectId, taskId, status) =>
  api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });

export const deleteTask = (projectId, taskId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}`);

export const getProjectMembers = (projectId) =>
  api.get(`/projects/${projectId}/members`);