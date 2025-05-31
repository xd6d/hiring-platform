/**
 * Convert an ISO timestamp (e.g. "2025-05-31T12:13:22.362477Z")
 * into "DD Mon, YYYY" (e.g. "31 May 2025").
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
