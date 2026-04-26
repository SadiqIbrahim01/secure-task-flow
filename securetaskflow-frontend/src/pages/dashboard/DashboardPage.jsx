import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Plus,
  Users,
  FolderKanban,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import { createOrganization } from '../../api/organizations';
import { listProjects } from '../../api/projects';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

// Schema for create org form
const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase letters, numbers, and hyphens only'
    ),
});

// Stat card component
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center 
                       flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// Org card component
function OrgCard({ org, onSelect }) {
  return (
    <div
      onClick={() => onSelect(org.id)}
      className="card hover:shadow-md hover:border-primary-200 
                 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center 
                        justify-center">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 
                               transition-colors" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{org.name}</h3>
      <p className="text-xs text-gray-400">/{org.slug}</p>
      <p className="text-xs text-gray-400 mt-2">
        Created {new Date(org.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isSuperAdmin } = useAuthStore();

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch all organizations the user belongs to
  // We use a custom query that fetches the user's orgs
  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: async () => {
      // We fetch org by checking what the user has access to
      // Since the backend returns only orgs the user is a member of
      const response = await api.get('/organizations/my');
      return response.data;
    },
    // Don't fail hard if this endpoint doesn't exist yet
    retry: false,
  });

  const createOrgMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      setShowCreateOrg(false);
      reset();
    },
    onError: (error) => {
      const detail = error.response?.data?.detail;
      setServerError(detail || 'Failed to create organization');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(createOrgSchema) });

  // Auto-generate slug from name
  const nameValue = watch('name', '');
  const autoSlug = nameValue
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);

  const onCreateOrg = async (data) => {
    setServerError('');
    createOrgMutation.mutate(data);
  };

  const orgs = orgsData?.content || orgsData || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 
                      rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Good to see you, {user?.firstName}! 👋
            </h2>
            <p className="text-primary-200 text-sm">
              Manage your organizations, projects, and tasks securely.
            </p>
          </div>
          <ShieldCheck className="h-16 w-16 text-primary-400 hidden sm:block" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Organizations"
          value={orgs.length}
          color="blue"
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value="—"
          color="green"
        />
        <StatCard
          icon={Users}
          label="Role"
          value={isSuperAdmin() ? 'Admin' : 'Member'}
          color="purple"
        />
      </div>

      {/* Organizations section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Organizations
          </h3>
          <Button
            onClick={() => {
              setServerError('');
              reset();
              setShowCreateOrg(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </div>

        {orgsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Create your first organization to start managing projects and tasks with your team."
            action={
              <Button onClick={() => setShowCreateOrg(true)}>
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onSelect={(id) => navigate(`/organizations/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        title="Create Organization"
      >
        <form onSubmit={handleSubmit(onCreateOrg)} className="space-y-4">
          <Alert message={serverError} type="error" />

          <Input
            label="Organization name"
            placeholder="Acme Corp"
            error={errors.name?.message}
            required
            {...register('name', {
              onChange: (e) => {
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .slice(0, 100);
                setValue('slug', slug, { shouldValidate: true });
              },
            })}
          />

          <Input
            label="Slug (URL identifier)"
            placeholder="acme-corp"
            error={errors.slug?.message}
            required
            {...register('slug')}
          />
          <p className="text-xs text-gray-400 -mt-2">
            Lowercase letters, numbers, and hyphens only
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateOrg(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={createOrgMutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}