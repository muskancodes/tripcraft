import { useState, useRef } from 'react';
import { Trip, TravelDocument, DocumentType } from '../../types';
import { motion } from 'framer-motion';
import { Plus, X, Trash2, FileText, ShieldAlert, Download, Upload, Calendar } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const DOC_TYPES: { type: DocumentType; label: string; icon: string }[] = [
  { type: 'passport', label: 'Passport', icon: '🛂' },
  { type: 'visa', label: 'Visa', icon: '📋' },
  { type: 'insurance', label: 'Insurance', icon: '🛡️' },
  { type: 'ticket', label: 'Ticket', icon: '🎫' },
  { type: 'confirmation', label: 'Confirmation', icon: '✅' },
  { type: 'itinerary', label: 'Itinerary', icon: '🗺️' },
  { type: 'other', label: 'Other', icon: '📄' },
];

const DOC_COLORS: Record<DocumentType, string> = {
  passport: '#6366f1', visa: '#f59e0b', insurance: '#10b981',
  ticket: '#3b82f6', confirmation: '#22c55e', itinerary: '#8b5cf6', other: '#6b7280',
};

export default function DocumentsTab({ trip }: Props) {
  const { addDocument, deleteDocument } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'passport' as DocumentType, name: '', expiryDate: '', notes: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addDocument(trip.id, {
        type: form.type,
        name: form.name || file.name,
        fileData: ev.target?.result as string,
        fileName: file.name,
        fileSize: file.size,
        expiryDate: form.expiryDate,
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ type: 'passport', name: '', expiryDate: '', notes: '' });
      toast.success('Document saved');
    };
    reader.readAsDataURL(file);
  };

  const handleAddWithoutFile = () => {
    if (!form.name) { toast.error('Document name required'); return; }
    addDocument(trip.id, {
      type: form.type,
      name: form.name,
      expiryDate: form.expiryDate,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ type: 'passport', name: '', expiryDate: '', notes: '' });
    toast.success('Document record saved');
  };

  const grouped = DOC_TYPES.reduce((acc, dt) => {
    const docs = trip.documents.filter(d => d.type === dt.type);
    if (docs.length) acc[dt.type] = docs;
    return acc;
  }, {} as Record<string, TravelDocument[]>);

  return (
    <div className="space-y-5">
      {/* Security warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-300">Security Notice</p>
          <p className="text-xs text-yellow-400/80 mt-1">
            Do not store sensitive documents (passport numbers, visa copies) in production without secure encryption.
            This app stores data locally in your browser only. For production use, implement AES-256 encryption and
            secure cloud storage with access controls.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Documents ({trip.documents.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Document</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          <div>
            <label className="label">Document Type</label>
            <div className="flex gap-2 flex-wrap">
              {DOC_TYPES.map(dt => (
                <button key={dt.type} onClick={() => setForm(p => ({ ...p, type: dt.type }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                    form.type === dt.type ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300' : 'border-white/10 text-gray-400 hover:text-white'
                  }`}>
                  {dt.icon} {dt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Document Name</label>
              <input className="input-field" placeholder="e.g. John's Passport" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" className="input-field" value={form.expiryDate}
                onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input-field" placeholder="Optional notes" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} />

          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()}
              className="btn-primary text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload File
            </button>
            <button onClick={handleAddWithoutFile} className="btn-secondary text-sm">Save Record Only</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      {trip.documents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📄</div>
          <p className="text-gray-500 text-sm">No documents saved yet</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, docs]) => {
          const typeInfo = DOC_TYPES.find(dt => dt.type === type)!;
          return (
            <div key={type}>
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
                <span>{typeInfo.icon}</span> {typeInfo.label}
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-500">{docs.length}</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {docs.map((doc, i) => <DocCard key={doc.id} doc={doc} tripId={trip.id} index={i} docType={typeInfo} />)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DocCard({ doc, tripId, index, docType }: { doc: TravelDocument; tripId: string; index: number; docType: { type: DocumentType; icon: string; label: string } }) {
  const { deleteDocument } = useTripStore();
  const color = DOC_COLORS[doc.type];

  const handleDownload = () => {
    if (doc.fileData && doc.fileName) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName;
      a.click();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="glass-card p-4 flex items-start gap-3 group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}>
        {docType.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{doc.name}</p>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
          {doc.expiryDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Expires: {formatDate(doc.expiryDate)}
            </span>
          )}
          {doc.fileName && (
            <span className="text-gray-600">{doc.fileName}</span>
          )}
          {doc.fileSize && (
            <span>{Math.round(doc.fileSize / 1024)}KB</span>
          )}
        </div>
        {doc.notes && <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>}
        <p className="text-xs text-gray-600 mt-1">Added {formatDate(doc.createdAt)}</p>
      </div>
      <div className="flex gap-1">
        {doc.fileData && (
          <button onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => deleteDocument(tripId, doc.id)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
