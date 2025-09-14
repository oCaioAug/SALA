import React from 'react';
import { cn } from '@/lib/utils';
import { RoomStatus, ROOM_STATUS_CONFIG } from '@/lib/types';

interface StatusBadgeProps {
  status: RoomStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    LIVRE: {
      color: 'bg-green-500',
      text: 'Livre',
      textColor: 'text-green-100'
    },
    EM_USO: {
      color: 'bg-red-500',
      text: 'Em Uso',
      textColor: 'text-red-100'
    },
    RESERVADO: {
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
