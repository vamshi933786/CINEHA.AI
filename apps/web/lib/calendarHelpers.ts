export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateString(
  dateStr: string,
  style: "short" | "full" | "weekday" = "short"
): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const d = new Date(year, month - 1, day);

    if (style === "weekday") {
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    if (style === "full") {
      return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthIndex] || "";
}

export function formatDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatMonthYear(d: Date): string {
  return `${getMonthName(d.getMonth())} ${d.getFullYear()}`;
}

export interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthGrid(year: number, month: number): CalendarDayCell[] {
  // month is 0-indexed (0 = Jan, 9 = Oct)
  const todayStr = getTodayString();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Trailing days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, dayNumber);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
    const d = String(dayNumber).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    cells.push({
      dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Days of current month
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(dayNumber).padStart(2, "0");
    const dateStr = `${year}-${m}-${d}`;

    cells.push({
      dateStr,
      dayNumber,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Leading days from next month to fill grid to multiple of 7
  const remaining = (7 - (cells.length % 7)) % 7;
  // Ensure at least 35 cells for month view
  const targetTotal = cells.length + remaining < 35 ? cells.length + remaining + 7 : cells.length + remaining;

  let nextMonthDay = 1;
  while (cells.length < targetTotal) {
    const nextDate = new Date(year, month + 1, nextMonthDay);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, "0");
    const d = String(nextMonthDay).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    cells.push({
      dateStr,
      dayNumber: nextMonthDay,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
    nextMonthDay++;
  }

  return cells;
}

export interface WeekDayColumn {
  dateStr: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
}

export function getWeekDays(baseDateStr: string): WeekDayColumn[] {
  const todayStr = getTodayString();
  const [year, month, day] = baseDateStr.split("-").map(Number);
  const base = new Date(year, month - 1, day);
  const dayOfWeek = base.getDay(); // 0 = Sun

  const sunday = new Date(year, month - 1, day - dayOfWeek);
  const days: WeekDayColumn[] = [];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const current = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    days.push({
      dateStr,
      dayNumber: current.getDate(),
      dayName: dayNames[i],
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

export function addDays(dateStr: string, daysToAdd: number): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d + daysToAdd);
    const resY = dateObj.getFullYear();
    const resM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const resD = String(dateObj.getDate()).padStart(2, "0");
    return `${resY}-${resM}-${resD}`;
  } catch {
    return dateStr;
  }
}
