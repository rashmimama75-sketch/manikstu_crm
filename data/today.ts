// "Today" for every date on the dashboards (ages, "today", "this month", overdue).
//
// Offline demo: the sample data's own calendar, so it reads the same on any day.
// Connected to the CRM backend (CRM_API_BASE set; see next.config.mjs): the real date, because the records are
// real and dated by the real clock. Without this a new enquiry or order reads "-15 days ago".
const realToday = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const TODAY: string = process.env.NEXT_PUBLIC_CRM_LIVE ? realToday() : '2026-09-24';
