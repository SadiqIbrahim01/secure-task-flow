import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  listProjects,
  getProject,
  addProjectMember,
  deleteProject,
} from '../api/projects';

export function useProjects(orgId) {
  return useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => listProjects(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useProject(orgId, projectId) {
  return useQuery({
    queryKey: ['project', orgId, projectId],
    queryFn: () => getProject(orgId, projectId).then((r) => r.data),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateProject(orgId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createProject(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    },
  });
}

export function useAddProjectMember(orgId, projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addProjectMember(orgId, projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });
}

export function useDeleteProject(orgId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId) => deleteProject(orgId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    },
  });
}