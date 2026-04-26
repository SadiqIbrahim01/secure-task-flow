import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  listTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../api/tasks';

export function useTasks(projectId, params = {}) {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: () => listTasks(projectId, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

export function useUpdateTaskStatus(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }) => updateTaskStatus(projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

export function useDeleteTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}