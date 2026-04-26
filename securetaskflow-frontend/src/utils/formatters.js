export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export const PROJECT_STATUS_COLORS = {
  ACTIVE:    { label: 'Active',    variant: 'green'  },
  ARCHIVED:  { label: 'Archived',  variant: 'gray'   },
  COMPLETED: { label: 'Completed', variant: 'blue'   },
};

export const TASK_STATUS_COLORS = {
  TODO:        { label: 'To Do',       variant: 'gray'   },
  IN_PROGRESS: { label: 'In Progress', variant: 'blue'   },
  IN_REVIEW:   { label: 'In Review',   variant: 'yellow' },
  DONE:        { label: 'Done',        variant: 'green'  },
  CANCELLED:   { label: 'Cancelled',   variant: 'red'    },
};

export const TASK_PRIORITY_COLORS = {
  LOW:      { label: 'Low',      variant: 'gray'   },
  MEDIUM:   { label: 'Medium',   variant: 'blue'   },
  HIGH:     { label: 'High',     variant: 'yellow' },
  CRITICAL: { label: 'Critical', variant: 'red'    },
};

export const ORG_ROLE_COLORS = {
  ORG_OWNER:  { label: 'Owner',  variant: 'purple' },
  ORG_MEMBER: { label: 'Member', variant: 'blue'   },
};

export const PROJECT_ROLE_COLORS = {
  PROJECT_OWNER:  { label: 'Owner',  variant: 'purple' },
  PROJECT_MEMBER: { label: 'Member', variant: 'blue'   },
  PROJECT_VIEWER: { label: 'Viewer', variant: 'gray'   },
};