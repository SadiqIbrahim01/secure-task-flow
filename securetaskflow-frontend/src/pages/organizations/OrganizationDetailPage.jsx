import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Plus,
  Users,
  FolderKanban,
  ArrowLeft,
  Trash2,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

import {
  getOrganization,
  getOrgMembers,
  addOrgMember,
  removeOrgMember,
} from '../../api/organizations';
import { createProject, listProjects } from '../../api/projects';
import useAuthStore from '../../store/authStore';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import {
  formatDate,
  getInitials,
  PROJECT_STATUS_COLORS,
  ORG_ROLE_COLORS,
  PROJECT_ROLE_COLORS,
} from '../../utils/formatters';

// Validation schemas
const addMemberSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  role: z.enum(['ORG_OWNER', 'ORG_MEMBER'], { required_error: 'Role is required' }),
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(2000).optional(),
});

// ── Tab component ─────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium 
                  border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
          active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, orgId, onNavigate }) {
  const statusInfo = PROJECT_STATUS_COLORS[project.status] ?? PROJECT_STATUS_COLORS.ACTIVE;
  return (
    <div
      onClick={() => onNavigate(project.id)}
      className="card hover:shadow-md hover:border-primary-200 
                 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center 
                        justify-center">
          <FolderKanban className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex items-center gap-2">
          <Badge label={statusInfo.label} variant={statusInfo.variant} />
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 
                                  transition-colors" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}
      <p className="text-xs text-gray-400">Created {formatDate(project.createdAt)}</p>
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────
function MemberRow({ member, canManage, currentUserId, onRemove, isRemoving }) {
  const roleInfo = ORG_ROLE_COLORS[member.role] ?? { label: member.role, variant: 'gray' };
  const isCurrentUser = member.userId === currentUserId;

  return (
    <div className="flex items-center justify-between py-3 border-b 
                    border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center 
                        justify-center flex-shrink-0">
          <span className="text-primary-700 font-semibold text-sm">
            {getInitials(member.firstName, member.lastName)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {member.firstName} {member.lastName}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-gray-400">(you)</span>
            )}
          </p>
          <p className="text-xs text-gray-500">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge label={roleInfo.label} variant={roleInfo.variant} />
        {canManage && !isCurrentUser && member.role !== 'ORG_OWNER' && (
          <button
            onClick={() => onRemove(member.userId)}
            disabled={isRemoving}
            className="text-gray-400 hover:text-red-500 transition-colors 
                       disabled:opacity-50 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrganizationDetailPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('projects');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [serverError, setServerError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Queries
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganization(orgId).then((r) => r.data),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getOrgMembers(orgId).then((r) => r.data),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => listProjects(orgId).then((r) => r.data),
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data) => addOrgMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setShowAddMember(false);
      memberForm.reset();
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to add member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => removeOrgMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setRemovingId(null);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => createProject(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
      setShowCreateProject(false);
      projectForm.reset();
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to create project');
    },
  });

  // Forms
  const memberForm = useForm({ resolver: zodResolver(addMemberSchema) });
  const projectForm = useForm({ resolver: zodResolver(createProjectSchema) });

  // Determine if current user is ORG_OWNER
  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === 'ORG_OWNER';

  const handleRemoveMember = (userId) => {
    setRemovingId(userId);
    removeMemberMutation.mutate(userId);
  };

  if (orgLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="error"
          message="Organization not found or you don't have access."
        />
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg 
                     hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center 
                            justify-center">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
              <p className="text-sm text-gray-500">/{org?.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <Tab
            label="Projects"
            active={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
            count={projects.length}
          />
          <Tab
            label="Members"
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
            count={members.length}
          />
        </div>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={() => {
              setServerError('');
              projectForm.reset();
              setShowCreateProject(true);
            }}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>

          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to start organizing tasks."
              action={
                <Button onClick={() => setShowCreateProject(true)}>
                  <Plus className="h-4 w-4" /> Create Project
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  orgId={orgId}
                  onNavigate={(projectId) =>
                    navigate(`/organizations/${orgId}/projects/${projectId}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
            {isOwner && (
              <Button onClick={() => {
                setServerError('');
                memberForm.reset();
                setShowAddMember(true);
              }}>
                <UserPlus className="h-4 w-4" /> Add Member
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="card">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  canManage={isOwner}
                  currentUserId={user?.id}
                  onRemove={handleRemoveMember}
                  isRemoving={removingId === member.userId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="Add Member"
      >
        <form
          onSubmit={memberForm.handleSubmit((data) => {
            setServerError('');
            addMemberMutation.mutate(data);
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@example.com"
            error={memberForm.formState.errors.email?.message}
            required
            {...memberForm.register('email')}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              {...memberForm.register('role')}
            >
              <option value="">Select a role</option>
              <option value="ORG_MEMBER">Member — can view and join projects</option>
              <option value="ORG_OWNER">Owner — can manage org and members</option>
            </select>
            {memberForm.formState.errors.role && (
              <p className="text-sm text-red-600">
                ⚠ {memberForm.formState.errors.role.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowAddMember(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={addMemberMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        title="Create Project"
      >
        <form
          onSubmit={projectForm.handleSubmit((data) => {
            setServerError('');
            createProjectMutation.mutate(data);
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />
          <Input
            label="Project name"
            placeholder="Alpha Project"
            error={projectForm.formState.errors.name?.message}
            required
            {...projectForm.register('name')}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What is this project about?"
              className="input-field resize-none"
              {...projectForm.register('description')}
            />
            {projectForm.formState.errors.description && (
              <p className="text-sm text-red-600">
                ⚠ {projectForm.formState.errors.description.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateProject(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={createProjectMutation.isPending}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}