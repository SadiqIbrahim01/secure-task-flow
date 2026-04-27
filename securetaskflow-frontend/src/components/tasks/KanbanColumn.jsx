import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';
import TaskCard from './TaskCard';

const COLUMN_STYLES = {
  TODO:        { header: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400'   },
  IN_PROGRESS: { header: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  IN_REVIEW:   { header: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  DONE:        { header: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  CANCELLED:   { header: 'bg-red-100 text-red-700',     dot: 'bg-red-400'    },
};

const COLUMN_LABELS = {
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
  CANCELLED:   'Cancelled',
};

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  canEdit,
  canDelete,
  isOver,
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status] ?? COLUMN_STYLES.TODO;
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={clsx(
        'flex items-center justify-between px-3 py-2.5 rounded-xl mb-3',
        style.header
      )}>
        <div className="flex items-center gap-2">
          <div className={clsx('h-2.5 w-2.5 rounded-full', style.dot)} />
          <span className="text-sm font-semibold">
            {COLUMN_LABELS[status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium opacity-70">
            {tasks.length}
          </span>
          {canEdit && status === 'TODO' && (
            <button
              onClick={onAddTask}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx(
            'flex-1 space-y-3 min-h-32 p-2 rounded-xl transition-colors duration-200',
            isOver
              ? 'bg-primary-50 border-2 border-dashed border-primary-300'
              : 'bg-gray-50/50'
          )}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              canDelete={canDelete}
            />
          ))}

          {/* Empty column hint */}
          {tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-24 text-xs 
                            text-gray-400 border-2 border-dashed border-gray-200 
                            rounded-lg">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}