'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { ReservationWithUser, Room } from '@/lib/types';

interface CalendarProps {
  reservations: ReservationWithUser[];
  rooms: Room[];
  onReservationClick?: (reservation: ReservationWithUser) => void;
  onDateClick?: (date: Date) => void;
  onRoomClick?: (room: Room) => void;
  viewMode?: 'month' | 'week' | 'day';
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  reservations: ReservationWithUser[];
}

const Calendar: React.FC<CalendarProps> = ({
  reservations,
  rooms,
  onReservationClick,
  onDateClick,
  onRoomClick,
  viewMode = 'month',
  selectedDate = new Date(),
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
    onDateSelect?.(today);
  };

  const getReservationsForDate = (date: Date): ReservationWithUser[] => {
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.startTime);
      const endDate = new Date(reservation.endTime);
      const checkDate = new Date(date);
      
      // Reset time to compare only dates
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const getRoomById = (roomId: string): Room | undefined => {
    return rooms.find(room => room.id === roomId);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDay?.getTime() === date.getTime();
      const dayReservations = getReservationsForDate(date);
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        reservations: dayReservations
      });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day.date);
    onDateSelect?.(day.date);
    onDateClick?.(day.date);
  };

  const getReservationColor = (roomId: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500'
    ];
    
    const roomIndex = rooms.findIndex(room => room.id === roomId);
    return colors[roomIndex % colors.length] || 'bg-gray-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
      {/* Header do Calendário */}
      <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="px-3"
            >
              Hoje
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700/50">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-600 last:border-r-0 cursor-pointer transition-colors
              ${day.isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/50'}
              ${day.isToday ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30' : ''}
              ${day.isSelected ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-500' : ''}
              hover:bg-slate-100 dark:hover:bg-slate-700/50
            `}
            onClick={() => handleDayClick(day)}
          >
            <div className="flex flex-col h-full">
              {/* Número do dia */}
              <div className="relative mb-2">
                <div className={`
                  text-sm font-medium
                  ${day.isCurrentMonth ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}
                  ${day.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                  ${day.isSelected ? 'text-blue-700 dark:text-blue-300' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                {/* Indicador do dia atual */}
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                )}
              </div>

              {/* Reservas do dia */}
              <div className="flex-1 space-y-1">
                {day.reservations.slice(0, 4).map((reservation) => {
                  const room = getRoomById(reservation.roomId);
                  const isMultiDay = new Date(reservation.startTime).toDateString() !== new Date(reservation.endTime).toDateString();
                  
                  return (
                    <div
                      key={reservation.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer transition-all hover:scale-105
                        ${getReservationColor(reservation.roomId)} text-white
                        ${isMultiDay ? 'border-l-2 border-white/30' : ''}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick?.(reservation);
                      }}
                      title={`${room?.name || 'Sala desconhecida'} - ${reservation.user.name}${isMultiDay ? ' (Reserva de múltiplos dias)' : ''}`}
                    >
                      <div className="truncate font-medium">
                        {room?.name || 'Sala'}
                        {isMultiDay && ' 📅'}
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        <Clock className="w-3 h-3" />
                        {formatTime(new Date(reservation.startTime))}
                        {isMultiDay && ` - ${formatTime(new Date(reservation.endTime))}`}
                      </div>
                    </div>
                  );
                })}
                
                {day.reservations.length > 4 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 text-center py-1 bg-slate-100 dark:bg-slate-700/30 rounded">
                    +{day.reservations.length - 4} mais reservas
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Salas:</span>
          {rooms.slice(0, 6).map((room, index) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500', 
              'bg-purple-500',
              'bg-orange-500',
              'bg-pink-500',
              'bg-indigo-500'
            ];
            return (
              <div key={room.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`}></div>
                <span className="text-xs text-slate-700 dark:text-slate-300">{room.name}</span>
              </div>
            );
          })}
          {rooms.length > 6 && (
            <span className="text-xs text-slate-600 dark:text-slate-400">+{rooms.length - 6} mais</span>
          )}
        </div>
      </div>
    </div>
  );
};

export { Calendar };
