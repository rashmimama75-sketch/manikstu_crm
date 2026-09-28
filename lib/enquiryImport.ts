// Import website / offline enquiries from an Excel, CSV or PDF file (telecalling head's Enquiries page).
// The file is read with readFileRows() from leadImport; everything here is plain functions.

import { TODAY, EnquiryType, WebEnquiry } from '../data/managerDashboard';
import { normalizePhone } from './leadImport';

export type EnquiryRowStatus = 'ready' | 'duplicate' | 'duplicate-in-file' | 'no-contact' | 'no-message';

export const ENQUIRY_ROW_LABEL: Record<EnquiryRowStatus, string> = {
  ready: 'Ready',
  duplicate: 'Already an enquiry',
  'duplicate-in-file': 'Repeated in file',
  'no-contact': 'No phone or email',
  'no-message': 'No message',
};

export interface EnquiryCandidate {
  line: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  type: EnquiryType;
  /** Why this type was chosen, e.g. "“price”, “order”". Empty when it fell back to general. */
  typeReason: string;
  createdAt: string | null;
  status: EnquiryRowStatus;
}

/** What the store needs to add an enquiry. */
export type NewEnquiryInput = Pick<WebEnquiry, 'name' | 'email' | 'phone' | 'type' | 'message'> & { created_at: string | null };

// ---- Type from the message ----------------------------------------------------------------

// Checked in this order; the first type with a match wins. English plus common Odia / Hindi words (roman script).
const TYPE_WORDS: [EnquiryType, RegExp][] = [
  ['career', /\b(job|jobs|vacanc\w*|apply|applying|application|resume|cv|hiring|hire me|recruit\w*|intern\w*|career|opening|position|role|salary|naukri|kaam chahiye)\b/gi],
  ['partnership', /\b(distributor\w*|dealer\w*|dealership|franchise\w*|fpo|shg|self help group|collaborat\w*|partner\w*|tie[- ]?up|bulk supply|wholesale|margin|stockist|retailer|agency|cooperative|co-operative|ngo)\b/gi],
  ['sales', /\b(buy|buying|purchase|price|prices|rate|rates|cost|quote|quotation|order|ordering|cod|cash on delivery|available|availability|deliver\w*|need \d+|want \d+|kg|pieces|pcs|blocks?|syrup|soap|tatwa|insurance|policy|premium|daam|kete|kinibi|kharid\w*|chahiye)\b/gi],
];

/** Type for an enquiry, and the words that decided it. Anything unclear is general. */
export function detectEnquiryType(text: string, typeCell = ''): { type: EnquiryType; reason: string } {
  const given = typeCell.trim().toLowerCase();
  const direct = (['sales', 'partnership', 'career', 'general'] as EnquiryType[]).find(t => given.startsWith(t.slice(0, 4)));
  if (direct) return { type: direct, reason: 'from the Type column' };
  // "Order not arrived / where is my order" is a general (service) question, not a new sale
  const serviceQuestion = /\b(not (arrived|received|delivered)|where is my|status of my|refund|complain\w*|damaged)\b/i.test(text);
  for (const [type, re] of TYPE_WORDS) {
    if (type === 'sales' && serviceQuestion) continue;
    const hits = Array.from(new Set((text.match(re) ?? []).map(w => w.toLowerCase())));
    if (hits.length) return { type, reason: hits.slice(0, 3).map(w => `“${w}”`).join(', ') };
  }
  return { type: 'general', reason: '' };
}

// ---- Reading the grid ---------------------------------------------------------------------

type Field = 'name' | 'phone' | 'email' | 'message' | 'type' | 'date';
const HEADERS: [Field, RegExp][] = [
  ['email', /e-?mail/i],
  ['phone', /phone|mobile|contact|whatsapp|number|\bno\b/i],
  ['message', /message|query|enquiry|inquiry|remark|comment|details|requirement|question|note/i],
  ['type', /type|category|purpose/i],
  ['date', /date|received|time|created/i],
  ['name', /name|customer|farmer|person|from/i],
];

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const pad = (n: number) => String(n).padStart(2, '0');

/** "24/09/2026 4:15 pm", "2026-09-24", "24-Sep-2026"… → "YYYY-MM-DDTHH:mm" (null if unreadable). */
export function parseEnquiryDate(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const time = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  let h = time ? Number(time[1]) : 10;
  const min = time ? Number(time[2]) : 0;
  if (time?.[3]) h = (h % 12) + (/pm/i.test(time[3]) ? 12 : 0);
  let y: number, mo: number, d: number;
  const iso = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dmy = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (iso) [y, mo, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) [d, mo, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3])];
  else {
    const parsed = new Date(t.replace(/-/g, ' '));
    if (Number.isNaN(parsed.getTime())) return null;
    [y, mo, d] = [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

const sameEnquiry = (a: { phone: string | null; email: string | null; message: string }, b: { phone: string | null; email: string | null; message: string }) =>
  ((!!a.phone && a.phone === b.phone) || (!!a.email && a.email.toLowerCase() === (b.email ?? '').toLowerCase())) &&
  clean(a.message).toLowerCase() === clean(b.message).toLowerCase();

/**
 * Turn the file's rows into enquiries. Uses the header row (Name / Phone / Email / Message / Type /
 * Date in any order and wording); without one, reads each line: contact details, the name before
 * them and the message after them.
 */
export function parseEnquiryRows(rows: string[][], existing: WebEnquiry[]): EnquiryCandidate[] {
  const lines = rows.map((r, i) => ({ cells: r.map(c => clean(String(c ?? ''))), line: i + 1 })).filter(r => r.cells.some(Boolean));
  const headerAt = lines.slice(0, 15).findIndex(r => r.cells.some(c => /phone|mobile|e-?mail|contact/i.test(c)) && r.cells.some(c => /name|message|query|enquiry|remark/i.test(c)));

  type RawRow = Omit<EnquiryCandidate, 'status' | 'type' | 'typeReason'> & { typeCell: string };
  const out: RawRow[] = [];

  if (headerAt >= 0) {
    const header = lines[headerAt].cells;
    const col: Partial<Record<Field, number>> = {};
    header.forEach((cell, i) => {
      const hit = HEADERS.find(([f, re]) => col[f] === undefined && re.test(cell));
      if (hit) col[hit[0]] = i;
    });
    const headerText = header.join('|').toLowerCase();
    for (const { cells, line } of lines.slice(headerAt + 1)) {
      if (cells.join('|').toLowerCase() === headerText) continue; // header repeated on a later PDF page
      const get = (f: Field) => (col[f] !== undefined ? cells[col[f]!] ?? '' : '');
      const email = (get('email') || cells.find(c => EMAIL.test(c)) || '').match(EMAIL)?.[0] ?? null;
      const phoneText = get('phone') || cells.find(c => normalizePhone(c)) || '';
      if (!get('name') && !phoneText && !email && !get('message')) continue;
      out.push({
        line,
        name: get('name'),
        phone: phoneText ? normalizePhone(phoneText) : null,
        email,
        message: get('message'),
        typeCell: get('type'),
        createdAt: parseEnquiryDate(get('date')),
      });
    }
  } else {
    for (const { cells, line } of lines) {
      const text = cells.join(' ');
      const email = text.match(EMAIL)?.[0] ?? null;
      const phoneMatch = text.match(/(?:\+?91[\s-]?|0)?([6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4})(?!\d)/);
      if (!email && !phoneMatch) continue; // titles, notes, page footers
      const firstContact = Math.min(...[email ? text.indexOf(email) : Infinity, phoneMatch?.index ?? Infinity]);
      const lastContactEnd = Math.max(email ? text.indexOf(email) + email.length : 0, phoneMatch ? (phoneMatch.index ?? 0) + phoneMatch[0].length : 0);
      out.push({
        line,
        name: clean(text.slice(0, firstContact).replace(/^\s*\d+[.)\-:]\s*/, '').replace(/[,|:;\-–]+\s*$/, '')),
        phone: phoneMatch ? normalizePhone(phoneMatch[1]) : null,
        email,
        message: clean(text.slice(lastContactEnd).replace(/^[,|:;\-–\s]+/, '')),
        typeCell: '',
        createdAt: parseEnquiryDate(text),
      });
    }
  }

  const accepted: { phone: string | null; email: string | null; message: string }[] = [];
  return out.map(r => {
    const { type, reason } = detectEnquiryType(r.message, r.typeCell);
    let status: EnquiryRowStatus = 'ready';
    if (!r.phone && !r.email) status = 'no-contact';
    else if (!r.message) status = 'no-message';
    else if (existing.some(e => sameEnquiry(r, e))) status = 'duplicate';
    else if (accepted.some(a => sameEnquiry(r, a))) status = 'duplicate-in-file';
    if (status === 'ready') accepted.push(r);
    const { typeCell: _t, ...rest } = r;
    return { ...rest, name: r.name || (r.email ? r.email.split('@')[0] : '') || 'Unknown', type, typeReason: reason, status };
  });
}

/** Ready rows (with the type the head chose) as enquiries for the store. */
export const toNewEnquiries = (rows: EnquiryCandidate[]): NewEnquiryInput[] =>
  rows.filter(r => r.status === 'ready').map(r => ({
    name: r.name, email: r.email ?? '', phone: r.phone, type: r.type, message: r.message, created_at: r.createdAt,
  }));

/** Excel template with the columns the importer understands. */
export async function downloadEnquiryTemplate() {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Enquiries');
  ws.columns = [
    { header: 'Name', width: 22 }, { header: 'Phone', width: 14 }, { header: 'Email', width: 26 },
    { header: 'Message', width: 50 }, { header: 'Date received', width: 18 }, { header: 'Type (optional)', width: 16 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5016' } };
  ws.addRow(['Ramesh Nayak', '9437012345', 'ramesh@gmail.com', 'Price for 10 mineral lick blocks with delivery to Baripada?', `${TODAY.split('-').reverse().join('/')} 10:30`, '']);
  ws.addRow(['Kalinga FPO', '9776543210', 'contact@kalingafpo.org', 'We want to become a distributor for our members.', '', '']);
  ws.addRow(['Priya Das', '', 'priya.das@gmail.com', 'Applying for the field officer job.', '', 'Career']);
  for (let r = 2; r <= 500; r++) {
    ws.getCell(`F${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Sales,Partnership,Career,General"'] };
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'enquiry-import-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
