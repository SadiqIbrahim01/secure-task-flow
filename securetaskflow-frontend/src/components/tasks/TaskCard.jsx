import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Calendar,
  User,
  Flag,
  Trash2,
  Pencil,
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../ui/Badge';
import { formatDate, TASK_PRIORITY_COLORS } from '../../utils/formatters';

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  canDelete,
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

  const priorityInfo =
    TASK_PRIORITY_COLORS[task.priority] ?? TASK_PRIORITY_COLORS.MEDIUM;

  const priorityDotColors = {
    gray:   'bg-gray-400',
    blue:   'bg-blue-500',
    yellow: 'bg-yellow-500',
    red:    'bg-red-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
        'group hover:shadow-md hover:border-primary-200 transition-all duration-200',
        isDragging && 'shadow-xl border-primary-400 rotate-2 scale-105'
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-2 mb-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab 
                     active:cursor-grabbing flex-shrink-0 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <p className="text-sm font-medium text-gray-900 flex-1 leading-snug">
          {task.title}
        </p>

        {/* Action buttons — shown on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 
                        transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-primary-600 
                       hover:bg-primary-50 rounded transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(task)}
              className="p-1 text-gray-400 hover:text-red-500 
                         hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 ml-6">
          {task.description}
        </p>
      )}

      {/* Footer metadata */}
      <div className="flex items-center gap-2 flex-wrap ml-6">
        {/* Priority dot */}
        <div className="flex items-center gap-1">
          <div className={clsx(
            'h-2 w-2 rounded-full flex-shrink-0',
            priorityDotColors[priorityInfo.variant]
          )} />
          <span className="text-xs text-gray-400">{priorityInfo.label}</span>
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </div>
        )}

        {/* Assignee */}
        {task.assignedToEmail && (
          <div className="flex items-center gap-1 text-xs text-gray-400 
                          ml-auto">
            <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center 
                            justify-center flex-shrink-0">
              <span className="text-primary-700 text-xs font-semibold">
                {task.assignedToEmail[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}