
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const variants = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconClass: 'text-red-500',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconClass: 'text-green-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconClass: 'text-blue-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertCircle,
    iconClass: 'text-yellow-500',
  },
};

export default function Alert({ type = 'error', message, className = '' }) {
  if (!message) return null;
  const { container, icon: Icon, iconClass } = variants[type];

  return (
    <div className={clsx(
      'flex items-start gap-3 p-4 rounded-lg border text-sm',
      container,
      className
    )}>
      <Icon className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', iconClass)} />
      <span>{message}</span>
    </div>
  );
}