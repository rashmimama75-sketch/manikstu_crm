// Calling report import for calling executives: turn an Excel / CSV / PDF report of calls into
// call records on their own leads. Pure functions (no browser code) apart from the template download.

import { STAGES, TODAY, CallOutcome, TrackerLead } from '../data/managerDashboard';
import { normalizePhone } from './leadImport';
import type { CallInput } from './trackerOps';

export type ReportRowStatus = 'ready' | 'no-phone' | 'not-your-lead' | 'no-outcome' | 'bad-status';

export const REPORT_STATUS_LABEL: Record<ReportRowStatus, string> = {
  ready: 'Ready',
  'no-phone': 'No phone number',
  'not-your-lead': 'Not one of your leads',
  'no-outcome': 'Outcome not recognised',
  'bad-status': 'Status not recognised',
};

export interface ReportRow {
  line: number;
  name: string;
  phone: string | null;
  lead: TrackerLead | null;
  outcomeText: string;
  outcome: CallOutcome | null;
  statusText: string;
  /** New stage; null when the report leaves the status blank (keep the current one). */
  stageId: number | null;
  durationSec: number | null;
  calledAt: string | null;
  note: string;
  nextDate: string | null;
  nextNote: string;
  status: ReportRowStatus;
}

type Field = 'phone' | 'name' | 'outcome' | 'stage' | 'duration' | 'when' | 'nextNote' | 'next' | 'note';

// Header words for each column, checked in this order (first match wins, each column used once).
const HEADERS: [Field, RegExp][] = [
  ['nextNote', /(follow.?up|callback|next).*(note|reason|remark)/i],
  ['next', /next|follow.?up|call.?back/i],
  ['phone', /phone|mobile|contact|number/i],
  ['outcome', /outcome|result|call.?status|response|disposition|connected/i],
  ['stage', /status|stage/i],
  ['duration', /duration|talk|minutes|mins|secs/i],
  ['when', /date|time|called|when/i],
  ['note', /note|remark|comment|summary|discussion/i],
  ['name', /name|customer|farmer|lead/i],
];

const SKIP_HEADER = /current|old|previous|product|vertical|source/i;

/** Call outcome from free text ("not picked", "RNR", "switched off", "spoke"…). */
export function parseOutcome(text: string): CallOutcome | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/wrong|invalid|incorrect|not exist|does ?n.?t exist/.test(t)) return 'Wrong number';
  if (/no.?answer|not.?answer|unanswer|no.?response|not.?pick|didn.?t pick|not.?reach|unreach|switch|ring|rnr|^na$|not.?connect|no.?reply/.test(t)) return 'No answer';
  if (/busy|engaged|call.?later|disconnect|cut/.test(t)) return 'Busy';
  if (/connect|spoke|spoken|talk|answer|picked|reached|done|yes|interested/.test(t)) return 'Connected';
  return null;
}

const WON = /won|sold|convert|order|purchas|bought|closed.?won/i;
/** Stage in the lead's product line from free text; undefined when unrecognised, null when blank. */
export function parseStage(text: string, verticalId: number): number | null | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const stages = STAGES.filter(s => s.vertical_id === verticalId).sort((a, b) => a.sort_order - b.sort_order);
  const exact = stages.find(s => s.name.toLowerCase() === t);
  if (exact) return exact.id;
  // "Not interested" must not read as "Interested"
  if (/lost|not.?interest|reject|no.?need|dead/.test(t)) return stages.find(s => s.name === 'Lost')?.id;
  const partial = stages.find(s => t.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(t));
  if (partial) return partial.id;
  if (WON.test(t)) return stages[stages.length - 2]?.id; // the stage before Lost is the won one
  return undefined;
}

/** "4:35", "4m 35s", "275", "5 min" → seconds. */
export function parseDuration(text: string, header = ''): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const hms = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) return hms[3] ? Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]) : Number(hms[1]) * 60 + Number(hms[2]);
  const m = t.match(/(\d+(?:\.\d+)?)\s*m/);
  const s = t.match(/(\d+)\s*s/);
  if (m || s) return Math.round((m ? Number(m[1]) * 60 : 0) + (s ? Number(s[1]) : 0));
  const n = Number(t.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || t.replace(/[^\d.]/g, '') === '') return null;
  if (/sec/i.test(header)) return Math.round(n);
  if (/min/i.test(header)) return Math.round(n * 60);
  return n <= 60 ? Math.round(n * 60) : Math.round(n); // bare small numbers are minutes
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Date (and optional time) in common Indian / ISO / Excel formats → "YYYY-MM-DDTHH:mm". */
export function parseWhen(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const time = t.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
  let h = time ? Number(time[1]) : 12;
  const min = time ? Number(time[2]) : 0;
  if (time?.[3]) h = (h % 12) + (/pm/i.test(time[3]) ? 12 : 0);
  let y: number, mo: number, d: number;
  const iso = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dmy = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (iso) [y, mo, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) [d, mo, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3])];
  else if (time && /^\s*\d{1,2}:\d{2}/.test(t)) [y, mo, d] = TODAY.split('-').map(Number) as [number, number, number];
  else {
    const parsed = new Date(t);
    if (Number.isNaN(parsed.getTime())) return null;
    [y, mo, d] = [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];
    if (!time) h = parsed.getHours() || 12;
  }
  if (mo > 12 && d <= 12) [d, mo] = [mo, d]; // month/day written the American way
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

/** Turn the file's rows into calls on this executive's leads. */
export function parseCallReport(rows: string[][], myLeads: TrackerLead[]): ReportRow[] {
  const headerIndex = rows.slice(0, 15).findIndex(r => r.some(c => /phone|mobile|contact/i.test(c)));
  if (headerIndex < 0) throw new Error('Could not find a header row with a "Phone" column. Use the template, or add a header row.');
  const header = rows[headerIndex];
  const col: Partial<Record<Field, number>> = {};
  header.forEach((cell, i) => {
    if (!cell.trim() || (SKIP_HEADER.test(cell) && !/phone|mobile/i.test(cell))) return;
    const hit = HEADERS.find(([field, re]) => col[field] === undefined && re.test(cell));
    if (hit) col[hit[0]] = i;
  });
  if (col.outcome === undefined) throw new Error('Could not find an "Outcome" column (e.g. Connected, No answer, Busy, Wrong number).');

  const byPhone = new Map(myLeads.map(l => [l.phone, l]));
  const get = (r: string[], f: Field) => (col[f] === undefined ? '' : (r[col[f]!] ?? '').trim());

  return rows.slice(headerIndex + 1)
    .map((r, i) => ({ r, line: headerIndex + i + 2 }))
    .filter(({ r }) => r.some(c => c.trim()) && !r.some(c => /phone|mobile/i.test(c) && c.length < 20 && !/\d/.test(c))) // skip blanks and repeated headers
    .map(({ r, line }) => {
      const phone = normalizePhone(get(r, 'phone'));
      const lead = phone ? byPhone.get(phone) ?? null : null;
      const outcomeText = get(r, 'outcome');
      const outcome = parseOutcome(outcomeText);
      const statusText = get(r, 'stage');
      const stage = lead ? parseStage(statusText, lead.vertical_id) : null;
      const status: ReportRowStatus =
        !phone ? 'no-phone' : !lead ? 'not-your-lead' : !outcome ? 'no-outcome' : stage === undefined ? 'bad-status' : 'ready';
      const next = parseWhen(get(r, 'next'));
      return {
        line,
        name: get(r, 'name') || lead?.customer_name || '',
        phone,
        lead,
        outcomeText,
        outcome,
        statusText,
        stageId: stage ?? null,
        durationSec: parseDuration(get(r, 'duration'), col.duration !== undefined ? header[col.duration] : ''),
        calledAt: parseWhen(get(r, 'when')),
        note: get(r, 'note'),
        nextDate: next ? next.slice(0, 10) : null,
        nextNote: get(r, 'nextNote'),
        status,
      };
    });
}

/** Ready rows as calls to send to the server. */
export const toCalls = (rows: ReportRow[]): CallInput[] =>
  rows.filter(r => r.status === 'ready').map(r => ({
    leadId: r.lead!.id,
    outcome: r.outcome!,
    stageId: r.stageId, // blank status keeps whatever the lead has when the call is saved
    note: r.note,
    durationSec: r.outcome === 'Connected' ? r.durationSec : null,
    calledAt: r.calledAt,
    next: r.nextDate ? { date: r.nextDate, note: r.nextNote } : null,
  }));

/** Excel template listing the executive's open leads, ready to fill in while calling. */
export async function downloadReportTemplate(leads: TrackerLead[], stageName: (id: number) => string, productName: (id: number) => string) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Calling report');
  ws.columns = [
    { header: 'Name', width: 22 },
    { header: 'Phone', width: 14 },
    { header: 'Product', width: 22 },
    { header: 'Current status', width: 15 },
    { header: 'Call date & time', width: 18 },
    { header: 'Outcome', width: 15 },
    { header: 'New status', width: 15 },
    { header: 'Duration (mm:ss)', width: 15 },
    { header: 'Note', width: 34 },
    { header: 'Next follow-up date', width: 18 },
    { header: 'Follow-up note', width: 26 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5016' } };
  leads.forEach(l => ws.addRow([l.customer_name, l.phone, productName(l.vertical_id), stageName(l.stage_id), '', '', '', '', '', '', '']));
  const list = (values: string[]) => ({ type: 'list' as const, allowBlank: true, formulae: [`"${values.join(',')}"`] });
  const stageNames = Array.from(new Set(STAGES.map(s => s.name)));
  for (let r = 2; r <= Math.max(50, leads.length + 20); r++) {
    ws.getCell(`F${r}`).dataValidation = list(['Connected', 'No answer', 'Busy', 'Wrong number']);
    ws.getCell(`G${r}`).dataValidation = list(stageNames);
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `calling-report-${TODAY}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
