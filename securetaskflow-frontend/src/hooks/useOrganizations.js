import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrganization,
  getOrganization,
  getOrgMembers,
  addOrgMember,
  removeOrgMember,
} from '../api/organizations';

export function useOrganization(orgId) {
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganization(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId) {
  return useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getOrgMembers(orgId).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useAddOrgMember(orgId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addOrgMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}

export function useRemoveOrgMember(orgId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => removeOrgMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}