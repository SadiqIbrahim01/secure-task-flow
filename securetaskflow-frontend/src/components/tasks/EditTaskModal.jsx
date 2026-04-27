import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToUserId: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  projectMembers = [],
  onSave,
  isLoading,
  error,
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editTaskSchema),
  });

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        assignedToUserId: task.assignedToUserId ?? '',
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [task, reset]);

  const onSubmit = (data) => {
    onSave({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      assignedToUserId: data.assignedToUserId || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Alert message={error} type="error" />

        <Input
          label="Task title"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={3}
            className="input-field resize-none"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select className="input-field" {...register('priority')}>
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
              {...register('assignedToUserId')}
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
          {...register('dueDate')}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}