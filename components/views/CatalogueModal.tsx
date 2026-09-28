import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import type { CatalogProduct } from '../../data/catalogProducts';
import { TODAY } from '../../data/managerDashboard';
import { CatalogLayout, CatalogOptions, buildCatalogPdf, pageCount } from '../../lib/catalogPdf';
import Modal from '../Modal';

type Which = 'start' | 'active' | 'in-stock' | 'Health' | 'Nutrition' | 'pick';
const WHICH_LABEL: Record<Which, string> = { start: 'Current list', active: 'All products', 'in-stock': 'In stock only', Health: 'Health', Nutrition: 'Nutrition', pick: 'Choose…' };
const INCLUDE_LABEL: Record<keyof CatalogOptions['include'], string> = {
  highlights: 'Highlights', recommended: 'Recommended for', usage: 'How to use (dosage)', ingredients: 'Ingredients', sku: 'SKU', stock: 'Stock status',
};
/** Draw each PDF page to an image, so the preview works in every browser (no PDF viewer needed). */
async function renderPages(blob: Blob): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise;
  const out: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1.1 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
    out.push(canvas.toDataURL('image/jpeg', 0.8));
  }
  return out;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  products: CatalogProduct[];
  /** Products to start with (the Products page's filtered list, or the ticked ones). */
  initialIds?: number[];
  /** Name for that starting list, e.g. "Filtered list" or "Selected". */
  startLabel?: string;
  onToast: (message: string) => void;
  onClose: () => void;
}

/** Catalogue PDF with the product photos: choose what goes in, preview the real PDF, download. */
export default function CatalogueModal({ products, initialIds, startLabel = 'Current list', onToast, onClose }: Props) {
  // Products hidden from the website are left out unless asked for
  const [includeHidden, setIncludeHidden] = useState(() => !!initialIds && initialIds.some(id => products.find(p => p.id === id)?.is_active === false));
  // Grouped by category (in website order within each), so each category's pages follow one another
  const active = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return products.filter(p => includeHidden || p.is_active).sort((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category) || a.order - b.order);
  }, [products, includeHidden]);
  const start = useMemo(() => new Set(initialIds ?? []), [initialIds]);
  const [which, setWhich] = useState<Which>(initialIds ? 'start' : 'active');
  const [picked, setPicked] = useState<Set<number>>(() => new Set(initialIds ?? products.filter(p => p.is_active).map(p => p.id)));
  const [showPrices, setShowPrices] = useState(true);
  const [layout, setLayout] = useState<CatalogLayout>(2);
  const [include, setInclude] = useState<CatalogOptions['include']>({ highlights: true, recommended: true, usage: true, ingredients: false, sku: true, stock: false });

  const chosen = active.filter(p =>
    which === 'start' ? start.has(p.id)
    : which === 'active' ? true
    : which === 'in-stock' ? p.stock_quantity > 0
    : which === 'pick' ? picked.has(p.id)
    : p.category === which);
  const [mon, year] = [Number(TODAY.slice(5, 7)), TODAY.slice(0, 4)];
  const edition = `${MONTHS[mon - 1]} ${year}`;
  const filename = `manikstu-catalogue-${MONTHS[mon - 1].slice(0, 3).toLowerCase()}-${year}.pdf`;

  // Build the real PDF for the preview (debounced), keep the latest one for download
  const [pdf, setPdf] = useState<{ url: string; size: number; pages: string[] } | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const key = JSON.stringify([chosen.map(p => p.id), showPrices, layout, include]);
  useEffect(() => {
    if (chosen.length === 0) { setPdf(null); return; }
    const id = ++run.current;
    setBuilding(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const blob = await buildCatalogPdf({ products: chosen, showPrices, layout, include, edition });
        if (id !== run.current) return; // a newer preview is on its way
        const pages = await renderPages(blob);
        if (id !== run.current) return;
        setPdf(prev => { if (prev) URL.revokeObjectURL(prev.url); return { url: URL.createObjectURL(blob), size: blob.size, pages }; });
      } catch {
        if (id === run.current) setError('Could not build the catalogue. Please try again.');
      } finally {
        if (id === run.current) setBuilding(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [key]);
  // Free the last PDF when the window closes
  const latest = useRef<string | null>(null);
  latest.current = pdf?.url ?? null;
  useEffect(() => () => { if (latest.current) URL.revokeObjectURL(latest.current); }, []);

  const download = () => {
    if (!pdf) return;
    const a = document.createElement('a');
    a.href = pdf.url;
    a.download = filename;
    a.click();
    onToast(`Catalogue downloaded: ${filename}`);
  };

  const pages = pageCount(chosen.length, layout);
  const mb = pdf ? (pdf.size / 1024 / 1024).toFixed(1) : null;

  return (
    <Modal isOpen onClose={onClose} title="Product catalogue" wide>
      <div className="catalogue">
        <div className="catalogue-options">
          <div className="form-group">
            <label>Products</label>
            <div className="filters">
              {(Object.keys(WHICH_LABEL) as Which[]).filter(w => w !== 'start' || initialIds).map(w => (
                <button key={w} type="button" className={`filter-chip ${which === w ? 'active' : ''}`} onClick={() => setWhich(w)}>
                  {w === 'start' ? `${startLabel} (${start.size})` : WHICH_LABEL[w]}
                </button>
              ))}
            </div>
            {which === 'pick' && (
              <div className="catalogue-pick">
                {active.map(p => (
                  <label key={p.id} className="check-line">
                    <input type="checkbox" checked={picked.has(p.id)} onChange={() => setPicked(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} />
                    {p.name} <span className="loc">{p.size}</span>
                  </label>
                ))}
              </div>
            )}
            <label className="check-line">
              <input type="checkbox" checked={includeHidden} onChange={e => setIncludeHidden(e.target.checked)} /> Include products hidden from the website
            </label>
            <div className="loc" style={{ marginTop: 6 }}>{chosen.length} {chosen.length === 1 ? 'product' : 'products'} in the catalogue</div>
          </div>

          <div className="form-group">
            <label>Layout</label>
            <div className="filters">
              {([1, 2, 4] as CatalogLayout[]).map(l => (
                <button key={l} type="button" className={`filter-chip ${layout === l ? 'active' : ''}`} onClick={() => setLayout(l)}>
                  {l} per page{l === 2 ? ' (recommended)' : ''}
                </button>
              ))}
            </div>
          </div>

          <label className="check-line">
            <input type="checkbox" checked={showPrices} onChange={e => setShowPrices(e.target.checked)} /> Show prices
          </label>

          <div className="form-group" style={{ marginTop: 10 }}>
            <label>Include</label>
            {(Object.keys(INCLUDE_LABEL) as (keyof CatalogOptions['include'])[]).map(k => (
              <label key={k} className="check-line">
                <input type="checkbox" checked={include[k]} onChange={e => setInclude(v => ({ ...v, [k]: e.target.checked }))} />
                {INCLUDE_LABEL[k]}{k !== 'stock' && k !== 'sku' && layout === 4 ? <span className="loc"> (not in 4-per-page)</span> : null}
              </label>
            ))}
          </div>

          <div className="catalogue-summary">
            <div><strong>{pages} pages</strong>{mb && <> · {mb} MB</>}</div>
            <div className="loc">Cover · contents · products · how to order</div>
          </div>
          <button type="button" className="btn-primary catalogue-download" disabled={!pdf || building} onClick={download}>
            <Download size={15} /> {building ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>

        <div className="catalogue-preview">
          {chosen.length === 0 ? (
            <div className="catalogue-empty loc">Choose at least one product.</div>
          ) : error ? (
            <div className="catalogue-empty inline-alert">{error}</div>
          ) : pdf ? (
            <>
              {building && <div className="catalogue-busy"><RefreshCw size={14} className="spin" /> Updating preview…</div>}
              <div className="catalogue-pages">
                {pdf.pages.map((src, n) => (
                  <figure key={n}>
                    <img src={src} alt={`Catalogue page ${n + 1}`} />
                    <figcaption>Page {n + 1} of {pdf.pages.length}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <div className="catalogue-empty loc"><RefreshCw size={16} className="spin" /> Building the catalogue with product photos…</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
