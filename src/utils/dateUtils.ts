export const dateUtils = {
  // Convert a Date object to 'YYYY-MM-DD' in local time
  getLocalDateString: (date: Date = new Date()): string => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  },

  // Get timestamp (ms) of the start of the day (00:00:00.000 local time)
  getStartOfDayMs: (date: Date = new Date()): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  },

  // Get timestamp (ms) of the end of the day (23:59:59.999 local time)
  getEndOfDayMs: (date: Date = new Date()): number => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  },

  // Get date string N days ago (relative to a base date)
  getLocalDateDaysAgo: (days: number, baseDate: Date = new Date()): string => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - days);
    return dateUtils.getLocalDateString(d);
  },

  // Get the start of the current week (Monday) and end (Sunday)
  getThisWeekRange: (baseDate: Date = new Date()): { start: string; end: string } => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return {
      start: dateUtils.getLocalDateString(monday),
      end: dateUtils.getLocalDateString(sunday),
    };
  },

  // Get the start of last week (Monday) and end (Sunday)
  getLastWeekRange: (baseDate: Date = new Date()): { start: string; end: string } => {
    const thisWeek = dateUtils.getThisWeekRange(baseDate);
    const monday = new Date(thisWeek.start);
    monday.setDate(monday.getDate() - 7);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return {
      start: dateUtils.getLocalDateString(monday),
      end: dateUtils.getLocalDateString(sunday),
    };
  },

  // Get the start of the month (YYYY-MM-01) for a given date
  getStartOfMonth: (date: Date = new Date()): string => {
    const d = new Date(date);
    d.setDate(1);
    return dateUtils.getLocalDateString(d);
  },

  // Get the end of the month for a given date
  getEndOfMonth: (date: Date = new Date()): string => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return dateUtils.getLocalDateString(d);
  },
};
