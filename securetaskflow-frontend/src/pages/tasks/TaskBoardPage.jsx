// src/pages/tasks/TaskBoardPage.jsx
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';

import { listTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '../../api/tasks';
import { getProject } from '../../api/projects';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

import KanbanColumn from '../../components/tasks/KanbanColumn';
import TaskCard from '../../components/tasks/TaskCard';
import EditTaskModal from '../../components/tasks/EditTaskModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assignedToUserId: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function TaskBoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // UI state
  const [activeTask, setActiveTask] = useState(null);
  const [overId, setOverId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [serverError, setServerError] = useState('');
  const [editError, setEditError] = useState('');

  // Local task state for optimistic drag-and-drop
  const [localTasks, setLocalTasks] = useState(null);

  // Drag sensors — supports both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // ── Queries ───────────────────────────────────────────────────────────────

  // Need orgId from project — we get it from the project data
  const { data: projectData } = useQuery({
    queryKey: ['project-board-meta', projectId],
    queryFn: async () => {
      // We don't have orgId here so we use a different approach
      // Store orgId in project query or pass via router state
      const stored = sessionStorage.getItem(`project-org-${projectId}`);
      return stored ? JSON.parse(stored) : null;
    },
  });

  const { data: tasksData, isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => listTasks(projectId, { size: 200 }).then((r) => r.data),
    onSuccess: (data) => {
      setLocalTasks(data?.content ?? []);
    },
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      // Get members — we need orgId, stored from navigation
      const orgId = sessionStorage.getItem(`project-org-${projectId}`);
      if (!orgId) return [];
      const r = await api.get(`/organizations/${orgId}/projects/${projectId}/members`);
      return r.data;
    },
  });

  // Initialize localTasks from server data
  const serverTasks = tasksData?.content ?? [];
  const tasks = localTasks ?? serverTasks;

  // Group tasks by status
  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  // Check current user's role
  const currentMember = projectMembers.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === 'PROJECT_OWNER';
  const canEdit = isOwner || currentMember?.role === 'PROJECT_MEMBER';

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      updateTaskStatus(projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => {
      // Revert optimistic update on error
      setLocalTasks(serverTasks);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => updateTask(projectId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setEditingTask(null);
      setEditError('');
    },
    onError: (error) => {
      setEditError(error.response?.data?.detail || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setDeletingTask(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowCreateTask(false);
      createForm.reset({ priority: 'MEDIUM' });
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to create task');
    },
  });

  const createForm = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  // ── Drag and Drop Handlers ────────────────────────────────────────────────

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }, [tasks]);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    // Determine target status
    let targetStatus = null;

    // If dropped on a column (status string)
    if (STATUSES.includes(over.id)) {
      targetStatus = over.id;
    } else {
      // If dropped on another task, find that task's status
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus) return;

    // If same status, no API call needed
    if (activeTaskData.status === targetStatus) return;

    // Optimistic update — update locally immediately
    setLocalTasks((prev) =>
      (prev ?? serverTasks).map((t) =>
        t.id === activeTaskData.id ? { ...t, status: targetStatus } : t
      )
    );

    // Fire API call
    updateStatusMutation.mutate({
      taskId: activeTaskData.id,
      status: targetStatus,
    });
  }, [tasks, serverTasks, updateStatusMutation]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (tasksLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Board header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg 
                       hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
          </div>
          <span className="text-sm text-gray-400">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg 
                       hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {canEdit && (
            <Button
              onClick={() => {
                setServerError('');
                createForm.reset({ priority: 'MEDIUM' });
                setShowCreateTask(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 overflow-x-auto pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max px-1">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onAddTask={() => setShowCreateTask(true)}
                onEditTask={(task) => {
                  setEditError('');
                  setEditingTask(task);
                }}
                onDeleteTask={(task) => setDeletingTask(task)}
                canEdit={canEdit}
                canDelete={isOwner}
                isOver={overId === status}
              />
            ))}
          </div>

          {/* Drag overlay — the "ghost" card while dragging */}
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                canDelete={false}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => {
          setEditingTask(null);
          setEditError('');
        }}
        task={editingTask}
        projectMembers={projectMembers}
        isLoading={updateTaskMutation.isPending}
        error={editError}
        onSave={(data) => {
          updateTaskMutation.mutate({
            taskId: editingTask.id,
            data,
          });
        }}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => deleteTaskMutation.mutate(deletingTask?.id)}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        isLoading={deleteTaskMutation.isPending}
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="New Task"
        size="lg"
      >
        <form
          onSubmit={createForm.handleSubmit((data) => {
            setServerError('');
            createTaskMutation.mutate({
              ...data,
              dueDate: data.dueDate
                ? new Date(data.dueDate).toISOString()
                : undefined,
              assignedToUserId: data.assignedToUserId || undefined,
            });
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />

          <Input
            label="Task title"
            placeholder="What needs to be done?"
            error={createForm.formState.errors.title?.message}
            required
            {...createForm.register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Add more details..."
              className="input-field resize-none"
              {...createForm.register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                className="input-field"
                {...createForm.register('priority')}
              >
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
                {...createForm.register('assignedToUserId')}
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
            {...createForm.register('dueDate')}
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