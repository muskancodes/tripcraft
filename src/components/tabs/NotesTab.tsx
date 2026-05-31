import { useState } from 'react';
import { Trip, Note } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Pin, PinOff, Edit3, Check, Tag } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const NOTE_COLORS = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3', '#ede9fe', '#e0f2fe'];

export default function NotesTab({ trip }: Props) {
  const { addNote, updateNote, deleteNote } = useTripStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tags: '', color: NOTE_COLORS[0], isPinned: false });

  const handleAdd = () => {
    if (!form.title) { toast.error('Title required'); return; }
    addNote(trip.id, {
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      color: form.color,
      isPinned: form.isPinned,
    });
    setForm({ title: '', content: '', tags: '', color: NOTE_COLORS[0], isPinned: false });
    setShowForm(false);
    toast.success('Note saved');
  };

  const pinned = trip.tripNotes.filter(n => n.isPinned);
  const unpinned = trip.tripNotes.filter(n => !n.isPinned);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Notes ({trip.tripNotes.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Note</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input-field" placeholder="Note title" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Content (Markdown supported)</label>
              <textarea
                className="input-field resize-none font-mono text-sm"
                rows={8}
                placeholder="## My Note&#10;&#10;- Item 1&#10;- Item 2&#10;&#10;### Tips&#10;- [ ] Checkbox&#10;- [x] Done item"
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input className="input-field" placeholder="tips, planning, food" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 mt-1">
                  {NOTE_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-sm text-gray-400">Pin this note</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Save Note</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned notes */}
      {pinned.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Pin className="w-3.5 h-3.5" /> Pinned
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pinned.map((note, i) => (
              <NoteCard key={note.id} note={note} tripId={trip.id} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Notes</h3>}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unpinned.map((note, i) => (
              <NoteCard key={note.id} note={note} tripId={trip.id} index={i} />
            ))}
          </div>
        </div>
      )}

      {trip.tripNotes.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-500 text-sm">No notes yet. Start writing!</p>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, tripId, index }: { note: Note; tripId: string; index: number }) {
  const { updateNote, deleteNote } = useTripStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const saveEdit = () => {
    updateNote(tripId, note.id, { content: editContent });
    setEditing(false);
  };

  // Simple markdown rendering
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-gray-800 mt-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-bold text-gray-800 mt-1">{line.slice(4)}</h3>;
        if (line.startsWith('- [x] ')) return <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 line-through"><span>✅</span>{line.slice(6)}</div>;
        if (line.startsWith('- [ ] ')) return <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700"><span>⬜</span>{line.slice(6)}</div>;
        if (line.startsWith('- ')) return <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700"><span>•</span>{line.slice(2)}</div>;
        if (line === '') return <br key={i} />;
        return <p key={i} className="text-xs text-gray-700 leading-relaxed">{line}</p>;
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl overflow-hidden border border-black/10 group relative"
      style={{ backgroundColor: note.color }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-bold text-sm text-gray-800 flex-1">{note.title}</h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => updateNote(tripId, note.id, { isPinned: !note.isPinned })}
              className="p-1.5 rounded-lg hover:bg-black/10 text-gray-600 transition-colors">
              {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setEditing(!editing)}
              className="p-1.5 rounded-lg hover:bg-black/10 text-gray-600 transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => deleteNote(tripId, note.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-black/10 rounded-lg p-2 text-xs text-gray-800 resize-none font-mono focus:outline-none"
              rows={6}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/15 text-xs text-gray-700 font-medium hover:bg-black/25 transition-colors">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="px-2.5 py-1 rounded-lg bg-black/10 text-xs text-gray-600 hover:bg-black/20 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs space-y-0.5 max-h-36 overflow-hidden relative">
            {renderContent(note.content)}
            {note.content.length > 200 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-current to-transparent opacity-30" />
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {note.tags.map(tag => (
              <span key={tag} className="text-xs bg-black/10 text-gray-600 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
          <span className="text-xs text-gray-500">{formatDate(note.updatedAt, 'MMM d')}</span>
        </div>
      </div>
    </motion.div>
  );
}
