import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  FolderKanban,
  Kanban,
  Plus,
  UserPlus,
  Users,
  Trash2,
} from 'lucide-react';

import { getProject, addProjectMember } from '../../api/projects';
import { getOrgMembers } from '../../api/organizations';
import { listTasks, createTask } from '../../api/tasks';
import api from '../../api/axios';
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
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  PROJECT_ROLE_COLORS,
} from '../../utils/formatters';

const addMemberSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  role: z.enum(['PROJECT_OWNER', 'PROJECT_MEMBER', 'PROJECT_VIEWER']),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assignedToUserId: z.string().optional(),
  dueDate: z.string().optional(),
});

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task }) {
  const statusInfo = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.TODO;
  const priorityInfo = TASK_PRIORITY_COLORS[task.priority] ?? TASK_PRIORITY_COLORS.MEDIUM;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 
                    hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <Badge label={priorityInfo.label} variant={priorityInfo.variant} />
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge label={statusInfo.label} variant={statusInfo.variant} />
        {task.assignedToEmail && (
          <span className="text-xs text-gray-400 truncate max-w-24">
            {task.assignedToEmail.split('@')[0]}
          </span>
        )}
      </div>
      {task.dueDate && (
        <p className="text-xs text-gray-400 mt-2">
          Due {formatDate(task.dueDate)}
        </p>
      )}
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────
function ProjectMemberRow({ member }) {
  const roleInfo = PROJECT_ROLE_COLORS[member.role]
    ?? { label: member.role, variant: 'gray' };

  return (
    <div className="flex items-center justify-between py-3 border-b 
                    border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center 
                        justify-center flex-shrink-0">
          <span className="text-primary-700 font-semibold text-xs">
            {getInitials(member.firstName, member.lastName)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {member.firstName} {member.lastName}
          </p>
          <p className="text-xs text-gray-500">{member.email}</p>
        </div>
      </div>
      <Badge label={roleInfo.label} variant={roleInfo.variant} />
    </div>
  );
}

// ── Tab component ─────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium 
                  border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [serverError, setServerError] = useState('');

  // Queries
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', orgId, projectId],
    queryFn: () => getProject(orgId, projectId).then((r) => r.data),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => listTasks(projectId, { size: 100 }).then((r) => r.data),
    enabled: !!projectId,
  });

  const { data: projectMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () =>
      api.get(`/organizations/${orgId}/projects/${projectId}/members`)
        .then((r) => r.data),
    enabled: !!projectId,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data) => addProjectMember(orgId, projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setShowAddMember(false);
      memberForm.reset();
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to add member');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowCreateTask(false);
      taskForm.reset();
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to create task');
    },
  });

  // Forms
  const memberForm = useForm({ resolver: zodResolver(addMemberSchema) });
  const taskForm = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  // Check if current user is PROJECT_OWNER
  const currentMember = projectMembers.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === 'PROJECT_OWNER';
  const canEdit = currentMember?.role === 'PROJECT_OWNER'
    || currentMember?.role === 'PROJECT_MEMBER';

  const tasks = tasksData?.content ?? [];
  const statusInfo = PROJECT_STATUS_COLORS[project?.status] ?? PROJECT_STATUS_COLORS.ACTIVE;

  if (projectLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert type="error" message="Project not found or you don't have access." />
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate(`/organizations/${orgId}`)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organization
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(`/organizations/${orgId}`)}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg 
                     hover:bg-gray-100 transition-colors mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center 
                            justify-center">
              <FolderKanban className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.name}
                </h1>
                <Badge label={statusInfo.label} variant={statusInfo.variant} />
              </div>
              {project?.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Task Board button */}
        <Button
          variant="secondary"
          onClick={() => {
          sessionStorage.setItem(`project-org-${projectId}`, orgId);
          navigate(`/projects/${projectId}/board`);
        }}
        >
          <Kanban className="h-4 w-4" />
          Task Board
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <Tab
            label="Tasks"
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            count={tasks.length}
          />
          <Tab
            label="Members"
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
            count={projectMembers.length}
          />
        </div>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {canEdit && (
                <Button onClick={() => {
                  setServerError('');
                  taskForm.reset({ priority: 'MEDIUM' });
                  setShowCreateTask(true);
                }}>
                  <Plus className="h-4 w-4" /> New Task
                </Button>
              )}
            </div>
          </div>

          {tasksLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No tasks yet"
              description="Create your first task or switch to the Kanban board view."
              action={
                canEdit && (
                  <Button onClick={() => setShowCreateTask(true)}>
                    <Plus className="h-4 w-4" /> Create Task
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
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
              {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}
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
              {projectMembers.map((member) => (
                <ProjectMemberRow key={member.userId} member={member} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="Add Project Member"
      >
        <form
          onSubmit={memberForm.handleSubmit((data) => {
            setServerError('');
            addMemberMutation.mutate(data);
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />
          <Alert
            type="info"
            message="User must already be a member of this organization."
          />
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
              <option value="PROJECT_VIEWER">Viewer — read-only access</option>
              <option value="PROJECT_MEMBER">Member — create and edit own tasks</option>
              <option value="PROJECT_OWNER">Owner — full project control</option>
            </select>
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

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create Task"
        size="lg"
      >
        <form
          onSubmit={taskForm.handleSubmit((data) => {
            setServerError('');
            // Convert dueDate string to ISO if provided
            const payload = {
              ...data,
              dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
              assignedToUserId: data.assignedToUserId || undefined,
            };
            createTaskMutation.mutate(payload);
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />

          <Input
            label="Task title"
            placeholder="Build the login page"
            error={taskForm.formState.errors.title?.message}
            required
            {...taskForm.register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the task..."
              className="input-field resize-none"
              {...taskForm.register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select className="input-field" {...taskForm.register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Assign to
              </label>
              <select
                className="input-field"
                {...taskForm.register('assignedToUserId')}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Due date"
            type="date"
            {...taskForm.register('dueDate')}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateTask(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={createTaskMutation.isPending}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}