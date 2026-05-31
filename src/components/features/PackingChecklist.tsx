import { useState } from 'react';
import { Trip, PackingItem } from '../../types';
import { motion } from 'framer-motion';
import { Plus, Trash2, CheckSquare, Square, Package, Download } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { defaultPackingList } from '../../data/sampleData';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

export default function PackingChecklist({ trip }: Props) {
  const { addPackingItem, togglePackingItem, deletePackingItem } = useTripStore();
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const categories = [...new Set(trip.packingList.map(p => p.category))].sort();
  const packed = trip.packingList.filter(p => p.packed).length;
  const total = trip.packingList.length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

  const importDefaults = () => {
    defaultPackingList.forEach(item => {
      addPackingItem(trip.id, item);
    });
    toast.success('Default packing list imported');
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addPackingItem(trip.id, {
      category: newCategory || 'Other',
      item: newItem,
      packed: false,
    });
    setNewItem('');
    toast.success('Item added');
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      {total > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-white font-medium">{packed} / {total} items packed</span>
            <span className={`font-bold ${pct === 100 ? 'text-green-400' : 'text-indigo-400'}`}>{pct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && <p className="text-xs text-green-400 mt-2">🎉 All packed! Ready to go!</p>}
        </div>
      )}

      <div className="flex gap-2">
        {total === 0 && (
          <button onClick={importDefaults} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Import Default List
          </button>
        )}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input className="input-field flex-1" placeholder="New item..." value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input className="input-field w-32" placeholder="Category" value={newCategory}
          onChange={e => setNewCategory(e.target.value)} />
        <button onClick={handleAdd} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* By category */}
      {categories.map(cat => {
        const items = trip.packingList.filter(p => p.category === cat);
        const catPacked = items.filter(p => p.packed).length;
        return (
          <div key={cat} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{cat}</h3>
              <span className="text-xs text-gray-500">{catPacked}/{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button onClick={() => togglePackingItem(trip.id, item.id)}
                    className={`transition-colors flex-shrink-0 ${item.packed ? 'text-green-400' : 'text-gray-600 hover:text-green-400'}`}>
                    {item.packed ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                  </button>
                  <span className={`flex-1 text-sm transition-colors ${item.packed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                    {item.item}
                  </span>
                  <button onClick={() => deletePackingItem(trip.id, item.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {total === 0 && (
        <div className="text-center py-8 text-gray-600">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No packing list yet</p>
        </div>
      )}
    </div>
  );
}
