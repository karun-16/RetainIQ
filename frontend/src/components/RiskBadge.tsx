import { RiskLevel } from '@/lib/types';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const config = {
    High: {
      color: 'bg-danger-light text-danger-DEFAULT border-danger-DEFAULT/20',
      icon: AlertCircle,
    },
    Medium: {
      color: 'bg-warning-light text-warning-DEFAULT border-warning-DEFAULT/20',
      icon: AlertTriangle,
    },
    Low: {
      color: 'bg-success-light text-success-DEFAULT border-success-DEFAULT/20',
      icon: CheckCircle2,
    },
    Unknown: {
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      icon: HelpCircle,
    },
  };

  const { color, icon: Icon } = config[level] || config.Unknown;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${color} ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} mr-1.5`} />
      {level}
    </span>
  );
}
