import { useState, useRef } from 'react';
import { Trip, GalleryItem, GalleryItemType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Instagram, Youtube, Image, Film, Link, Upload, ExternalLink } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const MEDIA_TYPES: { type: GalleryItemType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'photo', label: 'Photo', icon: <Image className="w-4 h-4" />, color: '#6366f1' },
  { type: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: '#e1306c' },
  { type: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" />, color: '#ff0000' },
  { type: 'tiktok', label: 'TikTok', icon: <Film className="w-4 h-4" />, color: '#00f2ea' },
  { type: 'video', label: 'Video Link', icon: <Link className="w-4 h-4" />, color: '#10b981' },
];

export default function GalleryTab({ trip }: Props) {
  const { addGalleryItem, deleteGalleryItem } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'photo' as GalleryItemType, url: '', caption: '', city: '', tags: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addGalleryItem(trip.id, {
        type: 'photo',
        fileData: ev.target?.result as string,
        fileName: file.name,
        caption: '',
        tags: [],
      });
      toast.success('Photo uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!form.url) { toast.error('URL required'); return; }
    addGalleryItem(trip.id, {
      type: form.type,
      url: form.url,
      caption: form.caption,
      city: form.city,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setForm({ type: 'photo', url: '', caption: '', city: '', tags: '' });
    setShowForm(false);
    toast.success('Media added');
  };

  const photos = trip.gallery.filter(g => g.type === 'photo' || g.type === 'screenshot');
  const media = trip.gallery.filter(g => !['photo', 'screenshot'].includes(g.type));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Gallery ({trip.gallery.length})</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Upload Photo
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Link
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Add Media Link</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {MEDIA_TYPES.map(mt => (
                <button key={mt.type} onClick={() => setForm(p => ({ ...p, type: mt.type }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                    form.type === mt.type ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300' : 'border-white/10 text-gray-400 hover:text-white'
                  }`}>
                  {mt.icon} {mt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">URL *</label>
                <input className="input-field" placeholder="https://..." value={form.url}
                  onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div>
                <label className="label">Caption</label>
                <input className="input-field" placeholder="Describe this media..." value={form.caption}
                  onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input-field" placeholder="e.g. Tokyo" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Tags (comma-separated)</label>
                <input className="input-field" placeholder="sakura, food, temple" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Add Media</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📷 Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((item, i) => (
              <PhotoCard key={item.id} item={item} tripId={trip.id} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Media links */}
      {media.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔗 Media Links</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item, i) => (
              <MediaCard key={item.id} item={item} tripId={trip.id} index={i} />
            ))}
          </div>
        </div>
      )}

      {trip.gallery.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📸</div>
          <p className="text-gray-500 text-sm mb-3">No media yet</p>
          <p className="text-gray-600 text-xs">Upload photos or add Instagram, YouTube, TikTok links</p>
        </div>
      )}
    </div>
  );
}

function PhotoCard({ item, tripId, index }: { item: GalleryItem; tripId: string; index: number }) {
  const { deleteGalleryItem } = useTripStore();
  const src = item.fileData || item.url;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
      className="relative group aspect-square rounded-xl overflow-hidden bg-white/5">
      {src && <img src={src} alt={item.caption || 'photo'} className="w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all" />
      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all">
          <p className="text-xs text-white">{item.caption}</p>
        </div>
      )}
      <button onClick={() => deleteGalleryItem(tripId, item.id)}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function MediaCard({ item, tripId, index }: { item: GalleryItem; tripId: string; index: number }) {
  const { deleteGalleryItem } = useTripStore();

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    instagram: { icon: <Instagram className="w-5 h-5" />, color: '#e1306c', label: 'Instagram' },
    youtube: { icon: <Youtube className="w-5 h-5" />, color: '#ff0000', label: 'YouTube' },
    tiktok: { icon: <Film className="w-5 h-5" />, color: '#00f2ea', label: 'TikTok' },
    video: { icon: <Link className="w-5 h-5" />, color: '#10b981', label: 'Video' },
  };

  const config = typeConfig[item.type] || typeConfig.video;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="glass-card p-4 flex items-start gap-3 group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${config.color}20`, color: config.color }}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
          {item.city && <span className="text-xs text-gray-600">· {item.city}</span>}
        </div>
        {item.caption && <p className="text-sm text-gray-300 truncate">{item.caption}</p>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-indigo-400 transition-colors flex items-center gap-1 mt-1">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
        {item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => deleteGalleryItem(tripId, item.id)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
