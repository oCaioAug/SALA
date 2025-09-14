import React from 'react';
import { cn } from '@/lib/utils';
import { RoomStatusType } from '@/lib/types';

interface StatusBadgeProps {
  status: RoomStatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    livre: {
      color: 'bg-green-500',
      text: 'Livre',
      textColor: 'text-green-100'
    },
    'em-uso': {
      color: 'bg-red-500',
      text: 'Em Uso',
      textColor: 'text-red-100'
    },
    reservado: {
      color: 'bg-yellow-500',
      text: 'Reservado',
      textColor: 'text-yellow-100'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-2 w-2 rounded-full', config.color)} />
      <span className={cn('text-sm font-medium', config.textColor)}>
        {config.text}
      </span>
    </div>
  );
};

export { StatusBadge };
