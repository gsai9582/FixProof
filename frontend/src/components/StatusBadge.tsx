import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, XCircle, Clock, RotateCcw, HelpCircle } from 'lucide-react';

interface Props {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  const config: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    reported: {
      label: t('status.reported', 'Reported'),
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-500 dark:text-blue-400',
      icon: Clock,
    },
    in_progress: {
      label: t('status.in_progress', 'In Progress'),
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      text: 'text-indigo-500 dark:text-indigo-400',
      icon: Clock,
    },
    claimed_resolved: {
      label: t('status.claimed_resolved', 'Claimed Resolved'),
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-500 dark:text-amber-400',
      icon: HelpCircle,
    },
    verified_fixed: {
      label: t('status.verified_fixed', 'Verified Fixed'),
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-500 dark:text-emerald-400',
      icon: CheckCircle2,
    },
    needs_review: {
      label: t('status.needs_review', 'Needs Review'),
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: AlertTriangle,
    },
    rejected: {
      label: t('status.rejected', 'Rejected (Fake Fix)'),
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-500 dark:text-rose-400',
      icon: XCircle,
    },
    reopened: {
      label: t('status.reopened', 'Reopened by Community'),
      bg: 'bg-purple-500/10 border-purple-500/30',
      text: 'text-purple-500 dark:text-purple-400',
      icon: RotateCcw,
    },
  };

  const item = config[status] || {
    label: status,
    bg: 'bg-gray-500/10 border-gray-500/30',
    text: 'text-gray-500',
    icon: HelpCircle,
  };

  const Icon = item.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${item.bg} ${item.text} ${padding}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {item.label}
    </span>
  );
};
