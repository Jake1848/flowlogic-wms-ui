import type { ReactNode } from 'react';

type StatusVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'primary';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  pulse?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

// Auto-detect variant from common status strings
function getVariantFromStatus(status: string): StatusVariant {
  const s = status.toUpperCase();

  // Success statuses
  if (['COMPLETED', 'ACTIVE', 'DELIVERED', 'SHIPPED', 'RESOLVED', 'APPROVED', 'SUCCESS', 'DONE', 'AVAILABLE'].includes(s)) {
    return 'success';
  }

  // Warning statuses
  if (['PENDING', 'IN_PROGRESS', 'PROCESSING', 'PICKING', 'PACKING', 'ASSIGNED', 'WARNING', 'PARTIAL', 'ALLOCATED'].includes(s)) {
    return 'warning';
  }

  // Error statuses
  if (['CANCELLED', 'FAILED', 'ERROR', 'CRITICAL', 'REJECTED', 'SUSPENDED', 'OVERDUE', 'DAMAGED', 'QUARANTINE'].includes(s)) {
    return 'error';
  }

  // Info statuses
  if (['NEW', 'INFO', 'RECEIVED', 'OPEN'].includes(s)) {
    return 'info';
  }

  // Primary statuses
  if (['PRIORITY', 'URGENT', 'HIGH'].includes(s)) {
    return 'primary';
  }

  return 'neutral';
}

export function StatusBadge({
  status,
  variant,
  size = 'md',
  icon,
  pulse = false,
}: StatusBadgeProps) {
  const effectiveVariant = variant ?? getVariantFromStatus(status);

  // Format status for display (replace underscores with spaces, title case)
  const displayStatus = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap
        ${variantStyles[effectiveVariant]}
        ${sizeStyles[size]}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              effectiveVariant === 'error'
                ? 'bg-red-400'
                : effectiveVariant === 'warning'
                ? 'bg-yellow-400'
                : effectiveVariant === 'success'
                ? 'bg-green-400'
                : 'bg-blue-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              effectiveVariant === 'error'
                ? 'bg-red-500'
                : effectiveVariant === 'warning'
                ? 'bg-yellow-500'
                : effectiveVariant === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
          />
        </span>
      )}
      {icon}
      {displayStatus}
    </span>
  );
}

// Severity badge specifically for alerts
interface SeverityBadgeProps {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  size?: 'sm' | 'md' | 'lg';
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const variantMap: Record<string, StatusVariant> = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'error',
  };

  return (
    <StatusBadge
      status={severity}
      variant={variantMap[severity]}
      size={size}
      pulse={severity === 'CRITICAL'}
    />
  );
}

// Priority badge for tasks and orders
interface PriorityBadgeProps {
  priority: number | string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const numPriority = typeof priority === 'string' ? parseInt(priority) : priority;

  let variant: StatusVariant = 'neutral';
  let label = `P${numPriority}`;

  if (numPriority <= 1) {
    variant = 'error';
    label = 'Critical';
  } else if (numPriority <= 2) {
    variant = 'error';
    label = 'Urgent';
  } else if (numPriority <= 3) {
    variant = 'warning';
    label = 'High';
  } else if (numPriority <= 5) {
    variant = 'info';
    label = 'Normal';
  } else {
    variant = 'neutral';
    label = 'Low';
  }

  return (
    <StatusBadge
      status={label}
      variant={variant}
      size={size}
      pulse={numPriority <= 2}
    />
  );
}
