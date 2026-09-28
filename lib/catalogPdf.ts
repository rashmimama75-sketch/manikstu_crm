// Product catalogue as a PDF (manager's Orders page → Catalogue). Browser only: loads the product
// photos from /public, shrinks them, and lays out a cover, contents, product pages and a last page.

import type { CatalogProduct } from '../data/catalogProducts';

export type CatalogLayout = 1 | 2 | 4;

export interface CatalogOptions {
  products: CatalogProduct[];
  showPrices: boolean;
  layout: CatalogLayout;
  include: { highlights: boolean; recommended: boolean; usage: boolean; ingredients: boolean; sku: boolean; stock: boolean };
  /** e.g. "September 2026" */
  edition: string;
  /** Product sheet: only the product page(s), 1 per page, no cover, contents or "How to order" page. */
  sheet?: boolean;
}

// Company details from the website settings (manikstu-backend ContentSeeder)
export const COMPANY = {
  name: 'Manikstu Agro',
  tagline: 'Revolutionizing Goat Farming. Empowering Lives.',
  phone: '+91 82703 31856',
  email: 'sales@manikstu.com',
  address: 'Plot No-754, 14, Gangadhar Meher Marg, Jayadev Vihar, Bhubaneswar, Odisha 751013',
};

const GREEN: [number, number, number] = [45, 80, 22];
const LEAF: [number, number, number] = [58, 112, 48];
const GOLD: [number, number, number] = [196, 149, 42];
const INK: [number, number, number] = [42, 40, 32];
const SOFT: [number, number, number] = [107, 106, 92];
const CREAM: [number, number, number] = [253, 246, 236];
const RUST: [number, number, number] = [166, 83, 46];
const W = 595.28;
const H = 841.89;
const M = 36;

/** jsPDF's built-in fonts have no ₹ sign. */
export const price = (p: CatalogProduct) => (p.price === null ? 'Price on request' : `Rs. ${p.price.toLocaleString('en-IN')}`);

/** Load an image from /public and shrink it to a JPEG data URL (white background), or null. */
async function loadImage(url: string, maxSide = 600, format: 'jpeg' | 'png' = 'jpeg'): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    if (format === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(bitmap, 0, 0, w, h);
    return { data: canvas.toDataURL(`image/${format}`, 0.72), w, h };
  } catch {
    return null;
  }
}

/** Page on which each product appears (cover = 1, contents = 2). */
export const pageOfProduct = (index: number, layout: CatalogLayout) => 3 + Math.floor(index / layout);
export const pageCount = (n: number, layout: CatalogLayout) => 2 + Math.max(1, Math.ceil(n / layout)) + 1;

export async function buildCatalogPdf(opts: CatalogOptions): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const { products, include } = opts;
  const layout: CatalogLayout = opts.sheet ? 1 : opts.layout;

  const imgSide = layout === 1 ? 700 : layout === 2 ? 480 : 360;
  const [band, ...photos] = await Promise.all([
    loadImage('/patterns/saura-border-tight.png', 1200, 'png'),
    ...products.map(p => loadImage(p.image, imgSide)),
  ]);

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const color = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold' | 'italic', size: number) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
  const lines = (text: string, width: number, max: number) => {
    const all: string[] = doc.splitTextToSize(text, width);
    if (all.length <= max) return all;
    const cut = all.slice(0, max);
    cut[max - 1] = cut[max - 1].replace(/\s+\S*$/, '') + '…';
    return cut;
  };
  /** Warli band across the page at y (repeated image). */
  const drawBand = (y: number, height = 22) => {
    if (!band) { fill(GOLD); doc.rect(0, y, W, 3, 'F'); return; }
    const w = (band.w / band.h) * height;
    for (let x = 0; x < W; x += w) doc.addImage(band.data, 'PNG', x, y, w, height, 'band', 'FAST');
  };
  /** Photo fitted inside a box, centred, on a white rounded tile. */
  const drawPhoto = (i: number, x: number, y: number, box: number) => {
    doc.setDrawColor(230, 223, 201);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, box, box, 8, 8, 'FD');
    const img = photos[i];
    if (!img) { font('normal', 9); color(SOFT); doc.text('Photo', x + box / 2, y + box / 2, { align: 'center' }); return; }
    const pad = 6;
    const s = Math.min((box - pad * 2) / img.w, (box - pad * 2) / img.h);
    const w = img.w * s;
    const h = img.h * s;
    doc.addImage(img.data, 'JPEG', x + (box - w) / 2, y + (box - h) / 2, w, h, `p${i}`, 'FAST');
  };
  const footer = (page: number) => {
    doc.setDrawColor(230, 223, 201);
    doc.line(M, H - 34, W - M, H - 34);
    font('normal', 8);
    color(SOFT);
    doc.text(`${COMPANY.name}  ·  Call ${COMPANY.phone}  ·  ${COMPANY.email}`, M, H - 20);
    doc.text(String(page), W - M, H - 20, { align: 'right' });
  };
  const pageHeader = (label: string) => {
    fill(CREAM); doc.rect(0, 0, W, H, 'F');
    drawBand(0, 20);
    font('bold', 9); color(GREEN);
    doc.text(COMPANY.name.toUpperCase(), M, 42);
    font('normal', 9); color(SOFT);
    doc.text(label, W - M, 42, { align: 'right' });
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(1);
    doc.line(M, 50, W - M, 50);
    doc.setLineWidth(0.5);
  };

  let y = 0;
  if (!opts.sheet) {
  // ---- 1. Cover -------------------------------------------------------------------------
  fill(CREAM); doc.rect(0, 0, W, H, 'F');
  drawBand(0, 28);
  fill(GREEN); doc.rect(0, 28, W, 190, 'F');
  font('bold', 34); color([255, 255, 255]);
  doc.text(COMPANY.name, M, 110);
  font('normal', 13); doc.setTextColor(244, 232, 193);
  doc.text(COMPANY.tagline, M, 136);
  font('bold', 20); color([255, 255, 255]);
  doc.text('Product Catalogue', M, 186);
  font('normal', 11); doc.setTextColor(244, 232, 193);
  doc.text(`${opts.edition}  ·  ${products.length} products${opts.showPrices ? '  ·  with prices' : ''}`, M, 204);
  // 2 × 2 photo collage
  const tile = 200;
  const gx = (W - tile * 2 - 16) / 2;
  products.slice(0, 4).forEach((_, i) => drawPhoto(i, gx + (i % 2) * (tile + 16), 250 + Math.floor(i / 2) * (tile + 16), tile));
  font('bold', 11); color(GREEN);
  doc.text('To order, call us', W / 2, 720, { align: 'center' });
  font('bold', 18); color(INK);
  doc.text(COMPANY.phone, W / 2, 744, { align: 'center' });
  font('normal', 9); color(SOFT);
  doc.text(`${COMPANY.email}  ·  ${COMPANY.address}`, W / 2, 764, { align: 'center', maxWidth: W - M * 2 });
  drawBand(H - 28, 28);

  // ---- 2. Contents ----------------------------------------------------------------------
  doc.addPage();
  pageHeader('Contents');
  font('bold', 22); color(GREEN);
  doc.text('Contents', M, 90);
  y = 122;
  const cats = Array.from(new Set(products.map(p => p.category)));
  for (const cat of cats) {
    font('bold', 11); color(GOLD);
    doc.text(cat.toUpperCase(), M, y);
    y += 18;
    products.forEach((p, i) => {
      if (p.category !== cat) return;
      if (y > H - 70) { footer(doc.getNumberOfPages()); doc.addPage(); pageHeader('Contents'); y = 80; }
      font('normal', 11); color(INK);
      doc.text(p.name, M + 10, y);
      font('normal', 9); color(SOFT);
      doc.text(p.size, M + 230, y);
      if (opts.showPrices) doc.text(price(p), M + 320, y);
      font('bold', 10); color(GREEN);
      doc.text(String(pageOfProduct(i, layout)), W - M, y, { align: 'right' });
      doc.setDrawColor(230, 223, 201);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(M + 10, y + 5, W - M, y + 5);
      doc.setLineDashPattern([], 0);
      y += 20;
    });
    y += 10;
  }
  footer(2);
  }

  // ---- 3. Products ----------------------------------------------------------------------
  const stockTag = (p: CatalogProduct, x: number, yy: number) => {
    if (!include.stock) return;
    const out = p.stock_quantity <= 0;
    font('bold', 8);
    const label = out ? 'OUT OF STOCK' : p.stock_quantity <= 20 ? 'LIMITED STOCK' : 'IN STOCK';
    const w = doc.getTextWidth(label) + 12;
    fill(out ? RUST : p.stock_quantity <= 20 ? GOLD : LEAF);
    doc.roundedRect(x, yy - 9, w, 13, 6, 6, 'F');
    color([255, 255, 255]);
    doc.text(label, x + 6, yy);
  };

  /**
   * One product's text column; returns the y where it ended. parts: 'head' = name, size, price and
   * description; 'details' = highlights, recommended for, how to use, ingredients; 'all' = both.
   */
  const productText = (p: CatalogProduct, x: number, top: number, width: number, bottom: number, size: 'l' | 'm' | 's', parts: 'head' | 'details' | 'all' = 'all') => {
    let yy = top;
    const room = () => bottom - yy;
    const para = (text: string, fontSize: number, max: number, style: 'normal' | 'italic' = 'normal') => {
      if (!text || room() < fontSize * 2) return;
      font(style, fontSize); color(INK);
      const l = lines(text, width, Math.min(max, Math.floor(room() / (fontSize + 3))));
      doc.text(l, x, yy + fontSize);
      yy += l.length * (fontSize + 3) + 6;
    };
    const heading = (text: string) => {
      if (room() < 30) return false;
      font('bold', 9); color(GOLD);
      doc.text(text.toUpperCase(), x, yy + 9);
      yy += 14;
      return true;
    };
    const bullets = (items: string[], max: number, fontSize: number) => {
      items.slice(0, max).forEach(item => {
        if (room() < fontSize + 4) return;
        font('normal', fontSize); color(INK);
        const l = lines(item, width - 12, 2);
        fill(LEAF); doc.circle(x + 3, yy + fontSize - 3, 1.8, 'F');
        doc.text(l, x + 12, yy + fontSize);
        yy += l.length * (fontSize + 3) + 2;
      });
      yy += 4;
    };

    if (parts !== 'details') {
    font('bold', size === 'l' ? 22 : size === 'm' ? 16 : 12.5); color(GREEN);
    const title = lines(p.name, width, 2);
    doc.text(title, x, yy + (size === 'l' ? 18 : 12));
    yy += (size === 'l' ? 24 : size === 'm' ? 18 : 15) * title.length + 6;
    font('normal', size === 's' ? 9 : 10.5); color(SOFT);
    doc.text(`${p.category} · ${p.size}${include.sku && p.sku ? ` · SKU ${p.sku}` : ''}`, x, yy);
    yy += 16;
    if (opts.showPrices) {
      font('bold', size === 'l' ? 18 : size === 'm' ? 15 : 12); color(INK);
      doc.text(price(p), x, yy + 2);
      if (include.stock) stockTag(p, x + doc.getTextWidth(price(p)) + 10, yy);
      yy += size === 's' ? 16 : 22;
    } else if (include.stock) { stockTag(p, x, yy); yy += 18; }
    para(size === 'l' ? p.long_description || p.description : p.description, size === 's' ? 8.5 : 10, size === 'l' ? 9 : 3);
    }
    if (parts === 'head' || size === 's') return yy;
    if (include.highlights && p.highlights.length && heading('Highlights')) bullets(p.highlights, size === 'l' ? 8 : 4, size === 'l' ? 10 : 9);
    if (include.recommended && p.recommended_for.length && heading('Recommended for')) bullets(p.recommended_for, size === 'l' ? 5 : 3, size === 'l' ? 10 : 9);
    if (include.usage && p.usage_instructions && heading('How to use')) para(p.usage_instructions.replace(/\n/g, '  '), size === 'l' ? 9.5 : 8.5, size === 'l' ? 6 : 3);
    if (include.ingredients && p.ingredients && heading('Ingredients')) para(p.ingredients, size === 'l' ? 8.5 : 8, size === 'l' ? 6 : 3, 'italic');
    return yy;
  };

  const perPage = layout;
  for (let start = 0; start < products.length; start += perPage) {
    if (!(opts.sheet && start === 0)) doc.addPage(); // a sheet starts on the document's first page
    const page = doc.getNumberOfPages();
    const group = products.slice(start, start + perPage);
    pageHeader(`${Array.from(new Set(group.map(p => p.category))).join(' & ')} products`);
    const top = 68;
    const bottom = opts.sheet ? H - 100 : H - 48; // a sheet keeps room for the order strip

    group.forEach((p, k) => {
      const i = start + k;
      if (layout === 1) {
        const box = 260;
        drawPhoto(i, M, top + 10, box);
        productText(p, M + box + 20, top + 10, W - M * 2 - box - 20, top + 10 + box, 'l', 'head');
        // below the photo: the details across the full width
        productText(p, M, top + box + 30, W - M * 2, bottom, 'l', 'details');
      } else if (layout === 2) {
        const blockH = (bottom - top) / 2;
        const y0 = top + k * blockH + 8;
        const box = 190;
        drawPhoto(i, M, y0 + 4, box);
        productText(p, M + box + 18, y0 + 4, W - M * 2 - box - 18, y0 + blockH - 14, 'm');
        if (k === 0 && group.length > 1) {
          doc.setDrawColor(230, 223, 201);
          doc.line(M, top + blockH, W - M, top + blockH);
        }
      } else {
        const colW = (W - M * 2 - 20) / 2;
        const rowH = (bottom - top) / 2;
        const x0 = M + (k % 2) * (colW + 20);
        const y0 = top + Math.floor(k / 2) * rowH + 8;
        const box = 200;
        drawPhoto(i, x0 + (colW - box) / 2, y0, box);
        productText(p, x0, y0 + box + 10, colW, y0 + rowH - 12, 's');
      }
    });
    footer(page);
  }

  if (opts.sheet) {
    // Short "how to order" strip at the bottom of the sheet instead of a whole page
    fill(GREEN); doc.rect(0, H - 92, W, 52, 'F');
    font('bold', 12); color([255, 255, 255]);
    doc.text(`To order, call ${COMPANY.phone}`, M, H - 68);
    font('normal', 9); doc.setTextColor(244, 232, 193);
    doc.text(`${COMPANY.email}  ·  Cash on delivery or UPI  ·  Delivery in 3–5 days across Odisha`, M, H - 52);
    return doc.output('blob');
  }

  // ---- 4. How to order ------------------------------------------------------------------
  doc.addPage();
  pageHeader('How to order');
  font('bold', 22); color(GREEN);
  doc.text('How to order', M, 96);
  const steps: [string, string][] = [
    ['Call us', `${COMPANY.phone} — our telecalling team will take your order, answer questions and suggest the right product for your goats.`],
    ['Email', `${COMPANY.email} — for bulk orders, dealer and FPO enquiries.`],
    ['Delivery', 'We deliver to your village through our courier partners, usually in 3–5 days across Odisha.'],
    ['Payment', 'Cash on delivery (COD) or UPI. You receive the bill with your order.'],
  ];
  y = 130;
  steps.forEach(([title, text], n) => {
    fill(GREEN); doc.circle(M + 12, y + 2, 12, 'F');
    font('bold', 12); color([255, 255, 255]);
    doc.text(String(n + 1), M + 12, y + 6, { align: 'center' });
    font('bold', 13); color(INK);
    doc.text(title, M + 34, y + 6);
    font('normal', 10.5); color(SOFT);
    const l = doc.splitTextToSize(text, W - M * 2 - 34);
    doc.text(l, M + 34, y + 22);
    y += 34 + l.length * 13;
  });
  fill([255, 255, 255]);
  doc.setDrawColor(230, 223, 201);
  doc.roundedRect(M, y + 10, W - M * 2, 70, 8, 8, 'FD');
  font('bold', 10); color(GOLD);
  doc.text('OFFICE', M + 16, y + 30);
  font('normal', 10.5); color(INK);
  doc.text(doc.splitTextToSize(COMPANY.address, W - M * 2 - 32), M + 16, y + 48);
  font('italic', 8.5); color(SOFT);
  doc.text(`Prices${opts.showPrices ? '' : ' (on request)'} and availability as of ${opts.edition}; they may change. Product photos are for illustration.`, M, y + 104, { maxWidth: W - M * 2 });
  drawBand(H - 62, 22);
  footer(doc.getNumberOfPages());

  return doc.output('blob');
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "September 2026" for a "YYYY-MM-DD" date. */
export const editionFor = (date: string) => `${MONTH_NAMES[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;

/** Build and download a one-page product sheet (photo, details, how to order). */
export async function downloadProductSheet(p: CatalogProduct, date: string): Promise<void> {
  const blob = await buildCatalogPdf({
    products: [p], showPrices: true, layout: 1, sheet: true,
    include: { highlights: true, recommended: true, usage: true, ingredients: true, sku: true, stock: false },
    edition: editionFor(date),
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manikstu-${p.slug}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
