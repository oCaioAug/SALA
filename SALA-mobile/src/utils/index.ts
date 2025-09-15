import { format, parseISO, isAfter, isBefore, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (date: string | Date) => {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
};

export const formatTime = (date: string | Date) => {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "HH:mm", { locale: ptBR });
};

export const formatDateTime = (date: string | Date) => {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date
) => {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  return `${formatTime(start)} - ${formatTime(end)}`;
};

export const isValidTimeRange = (startTime: Date, endTime: Date) => {
  return isAfter(endTime, startTime);
};

export const generateTimeSlots = (
  date: Date,
  startHour: number = 8,
  endHour: number = 18,
  intervalMinutes: number = 60
) => {
  const slots = [];
  let currentTime = new Date(date);
  currentTime.setHours(startHour, 0, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, 0, 0, 0);

  while (isBefore(currentTime, endTime)) {
    const nextTime = addHours(currentTime, intervalMinutes / 60);
    slots.push({
      start: new Date(currentTime),
      end: new Date(nextTime),
      label: `${formatTime(currentTime)} - ${formatTime(nextTime)}`,
    });
    currentTime = nextTime;
  }

  return slots;
};

export const getUserFriendlyId = (id: string) => {
  return id.slice(-8).toUpperCase();
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};
