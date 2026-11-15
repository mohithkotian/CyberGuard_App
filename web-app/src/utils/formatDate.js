import { format } from 'date-fns';

/**
 * Safely format dates without crashing React components on invalid, null, or undefined values.
 *
 * @param {Date|string|number} dateVal - Input date, timestamp, or ISO string.
 * @param {string} formatStr - date-fns format string (e.g. 'dd MMM yyyy').
 * @param {string} fallback - Fallback string returned when dateVal is missing or invalid.
 * @returns {string} Formatted date or fallback string.
 */
export const safeFormatDate = (dateVal, formatStr = 'dd MMM yyyy', fallback = 'Recent') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
};

export default safeFormatDate;
