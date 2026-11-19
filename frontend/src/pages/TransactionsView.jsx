import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import api, { parseError } from '../api/client';
import { Button, Pagination, Spinner, TxTable } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { TYPE_LABEL, dateTime, money } from '../utils/format';

const BLANK = { q: '', type: '', from: '', to: '' };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));

/** Search + filter + paging. Used by the customer history page and the admin transactions page. */
export default function TransactionsView({ admin = false }) {
  const toast = useToast();
  const base = admin ? '/admin/transactions' : '/transactions';
  const [draft, setDraft] = useState(BLANK);
  const [applied, setApplied] = useState(BLANK);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(base, { params: { ...clean(applied), page, size: 10 } });
      setData(r.data);
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setLoading(false);
    }
  }, [base, applied, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const apply = (e) => {
    e.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) return toast.error('The start date must be before the end date');
    setPage(0);
    setApplied(draft);
  };
  const clear = () => { setDraft(BLANK); setApplied(BLANK); setPage(0); };

  const downloadCsv = async () => {
    setExporting('csv');
    try {
      const r = await api.get('/transactions/export', { params: clean(applied), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'securebank-transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(parseError(e).message); }
    finally { setExporting(''); }
  };

  const downloadPdf = async () => {
    setExporting('pdf');
    try {
      let rows = [];
      for (let p = 0; p < 10; p++) { // up to 1,000 rows
        const r = await api.get(base, { params: { ...clean(applied), page: p, size: 100 } });
        rows = rows.concat(r.data.content);
        if (p + 1 >= r.data.totalPages) break;
      }
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('SecureBank - Transaction history (demo, simulated funds)', 14, 16);
      doc.setFontSize(9);
      doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, 14, 22);
      autoTable(doc, {
        startY: 27,
        head: [['Transaction ID', 'Date and time', 'Type', 'Amount (INR)', 'Credit/Debit', 'Description']],
        body: rows.map((t) => [
          t.transactionId, dateTime(t.createdAt), TYPE_LABEL[t.type] || t.type,
          `${t.direction === 'CREDIT' ? '+' : '-'}${Number(t.amount).toFixed(2)}`,
          t.direction === 'CREDIT' ? 'Credit' : 'Debit', t.description || '',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 95, 209] },
      });
      doc.save('securebank-transactions.pdf');
    } catch (e) { toast.error(parseError(e).message || 'Could not create the PDF'); }
    finally { setExporting(''); }
  };

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <>
      <h1 className="page-title">{admin ? 'All transactions' : 'Transaction history'}</h1>
      <form className="card filters" onSubmit={apply}>
        <div className="field grow">
          <label htmlFor="q">Search</label>
          <input id="q" className="input" placeholder={admin ? 'Transaction ID, account number or description' : 'Transaction ID or description'}
                 value={draft.q} onChange={set('q')} />
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" className="input" value={draft.type} onChange={set('type')}>
            <option value="">All types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" type="date" className="input" value={draft.from} onChange={set('from')} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" type="date" className="input" value={draft.to} onChange={set('to')} />
        </div>
        <div className="filter-actions">
          <Button type="submit"><Search size={16} /> Search</Button>
          <Button type="button" variant="ghost" onClick={clear}>Clear</Button>
        </div>
      </form>

      <section className="card">
        {!admin && (
          <div className="card-head">
            <h2>{data ? `${data.totalElements} transaction${data.totalElements === 1 ? '' : 's'}` : 'Transactions'}</h2>
            <div className="row">
              <Button variant="ghost" size="sm" busy={exporting === 'csv'} onClick={downloadCsv}><Download size={16} /> CSV</Button>
              <Button variant="ghost" size="sm" busy={exporting === 'pdf'} onClick={downloadPdf}><FileText size={16} /> PDF</Button>
            </div>
          </div>
        )}
        {loading && !data ? <Spinner /> : <TxTable rows={data?.content} showAccount={admin} />}
        {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      </section>
    </>
  );
}
