import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Clock,
  User,
  Flag,
  X,
  AlertCircle,
} from 'lucide-react';

import { listTasks, updateTaskStatus, deleteTask, createTask } from '../../api/tasks';
import api from '../../api/axios';
import { getProject } from '../../api/projects';
import useAuthStore from '../../store/authStore';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import {
  formatDate,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
  PROJECT_ROLE_COLORS,
} from '../../utils/formatters';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    color: 'bg-gray-100',
    headerColor: 'bg-gray-200 text-gray-700',
    dotColor: 'bg-gray-400',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'bg-blue-50',
    headerColor: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'IN_REVIEW',
    label: 'In Review',
    color: 'bg-yellow-50',
    headerColor: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  {
    id: 'DONE',
    label: 'Done',
    color: 'bg-green-50',
    headerColor: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
  },
  {
    id: 'CANCELLED',
    label: 'Cancelled',
    color: 'bg-red-50',
    headerColor: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-400',
  },
];

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assignedToUserId: z.string().optional(),
  dueDate: z.string().optional(),
});

// ── Priority flag colors ───────────────────────────────────────────────────────

const PRIORITY_FLAG = {
  LOW:      'text-gray-400',
  MEDIUM:   'text-blue-400',
  HIGH:     'text-yellow-500',
  CRITICAL: 'text-red-500',
};

// ── Draggable Task Card ────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDelete,
  isOwner,
  isDragging = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const priorityInfo = TASK_PRIORITY_COLORS[task.priority] ?? TASK_PRIORITY_COLORS.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-xl p-3.5 shadow-sm group
                  ${isDragging
                    ? 'shadow-xl border-primary-300 rotate-2 cursor-grabbing'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  } transition-all duration-150`}
    >
      {/* Drag handle + delete */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab 
                     active:cursor-grabbing flex-shrink-0 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <h4 className="flex-1 text-sm font-medium text-gray-900 leading-snug">
          {task.title}
        </h4>

        {isOwner && (
          <button
            onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 
                       hover:text-red-500 transition-all flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 ml-6 mb-2.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between ml-6 gap-2">
        <div className="flex items-center gap-2">
          {/* Priority flag */}
          <Flag className={`h-3 w-3 flex-shrink-0 ${PRIORITY_FLAG[task.priority]}`} />

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignedToEmail && (
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center 
                            justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold text-[9px]">
                {task.assignedToEmail[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  isOwner,
  canEdit,
}) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className={`flex flex-col rounded-2xl ${column.color} min-h-96 w-72 
                     flex-shrink-0`}>
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 
                       rounded-t-2xl ${column.headerColor}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${column.dotColor}`} />
          <span className="text-sm font-semibold">{column.label}</span>
          <span className="text-xs opacity-70 font-medium">
            {tasks.length}
          </span>
        </div>

        {/* Add task button — only on TODO column for simplicity */}
        {column.id === 'TODO' && canEdit && (
          <button
            onClick={() => onAddTask(column.id)}
            className="hover:opacity-70 transition-opacity p-0.5 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Task list */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-screen">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              isOwner={isOwner}
            />
          ))}

          {tasks.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl 
                            p-6 text-center">
              <p className="text-xs text-gray-400">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────

function TaskDetailModal({ task, isOpen, onClose }) {
  if (!task) return null;
  const priorityInfo = TASK_PRIORITY_COLORS[task.priority] ?? TASK_PRIORITY_COLORS.MEDIUM;
  const statusInfo = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.TODO;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <Badge label={priorityInfo.label} variant={priorityInfo.variant} />
          </div>
          {task.assignedToEmail && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Assigned to</p>
              <p className="text-sm text-gray-900">{task.assignedToEmail}</p>
            </div>
          )}
          {task.dueDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Due date</p>
              <p className="text-sm text-gray-900">{formatDate(task.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Created by</p>
            <p className="text-sm text-gray-900">{task.createdByEmail}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-900">{formatDate(task.createdAt)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TaskBoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTask, setActiveTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [serverError, setServerError] = useState('');
  const [optimisticTasks, setOptimisticTasks] = useState(null);

  // Find orgId from project data
  const { data: projectsData } = useQuery({
    queryKey: ['project-for-board', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks?size=1`);
      return response.data;
    },
    retry: false,
  });

  // Fetch all tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => listTasks(projectId, { size: 200 }).then((r) => r.data),
    enabled: !!projectId,
    onSuccess: () => setOptimisticTasks(null), // clear optimistic on fresh data
  });

  // Fetch project members (for assignee dropdown)
  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () =>
      api.get(`/organizations/${projectId}/members`).then((r) => r.data),
    retry: false,
  });

  const { data: projectInfo = [] } = useQuery({
  queryKey: ['project-board-members', projectId],
  queryFn: () =>
    api.get(`/projects/${projectId}/members`).then((r) => r.data),
  retry: false,
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      updateTaskStatus(projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => {
      // Revert optimistic update on error
      setOptimisticTasks(null);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowCreateTask(false);
      taskForm.reset({ priority: 'MEDIUM' });
      setServerError('');
    },
    onError: (error) => {
      setServerError(error.response?.data?.detail || 'Failed to create task');
    },
  });

  const taskForm = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  // DnD sensors — require 8px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Group tasks by status — use optimistic state if available
  const allTasks = optimisticTasks ?? tasksData?.content ?? [];
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = allTasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleDragStart = useCallback(({ active }) => {
    const task = allTasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }, [allTasks]);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveTask(null);

    if (!over) return;

    const draggedTask = allTasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Find which column was dropped into
    // `over.id` could be a column id OR a task id (dropped over another task)
    let targetStatus = over.id;

    // If dropped over a task, find that task's column
    if (!COLUMNS.find((c) => c.id === over.id)) {
      const overTask = allTasks.find((t) => t.id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus || draggedTask.status === targetStatus) return;
    if (!COLUMNS.find((c) => c.id === targetStatus)) return;

    // Optimistic update — move the card immediately in the UI
    setOptimisticTasks(
      allTasks.map((t) =>
        t.id === draggedTask.id ? { ...t, status: targetStatus } : t
      )
    );

    // Fire the real API call
    updateStatusMutation.mutate({
      taskId: draggedTask.id,
      status: targetStatus,
    });
  }, [allTasks, updateStatusMutation]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setOptimisticTasks(null);
  }, []);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg 
                       hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
            <p className="text-sm text-gray-500">
              {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status legend */}
          <div className="hidden lg:flex items-center gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                <span className="text-xs text-gray-500">{col.label}</span>
                <span className="text-xs font-medium text-gray-700">
                  {tasksByStatus[col.id]?.length ?? 0}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={() => {
            setServerError('');
            taskForm.reset({ priority: 'MEDIUM' });
            setShowCreateTask(true);
          }}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => (
              // Each column is also a droppable — using its id as the droppable id
              <DroppableColumn key={column.id} id={column.id}>
                <KanbanColumn
                  column={column}
                  tasks={tasksByStatus[column.id] ?? []}
                  onAddTask={() => {
                    taskForm.reset({ priority: 'MEDIUM' });
                    setShowCreateTask(true);
                  }}
                  onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
                  isOwner={true}
                  canEdit={true}
                />
              </DroppableColumn>
            ))}
          </div>

          {/* Drag overlay — the floating card while dragging */}
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onDelete={() => {}}
                isOwner={false}
                isDragging={true}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
      />

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
            const payload = {
              ...data,
              dueDate: data.dueDate
                ? new Date(data.dueDate).toISOString()
                : undefined,
              assignedToUserId: data.assignedToUserId || undefined,
            };
            createTaskMutation.mutate(payload);
          })}
          className="space-y-4"
        >
          <Alert message={serverError} type="error" />

          <Input
            label="Task title"
            placeholder="What needs to be done?"
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
              placeholder="Add more details..."
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
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="HIGH">🟡 High</option>
                <option value="CRITICAL">🔴 Critical</option>
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
                {(projectInfo ?? []).map((m) => (
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

// ── Droppable Column Wrapper ───────────────────────────────────────────────────
// dnd-kit needs a droppable area for each column
// We use useDroppable to make the column accept drops

import { useDroppable } from '@dnd-kit/core';

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-150 rounded-2xl ${
        isOver ? 'ring-2 ring-primary-400 ring-offset-2' : ''
      }`}
    >
      {children}
    </div>
  );
}