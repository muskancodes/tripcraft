import { useState } from 'react';
import { Trip } from '../../types';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Edit3, Check, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency, getBudgetPercentage } from '../../utils/helpers';
import { useTripStore } from '../../store/useTripStore';

interface Props { trip: Trip }

export default function BudgetTab({ trip }: Props) {
  const { updateBudgetCategory, updateBudgetTotal } = useTripStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ planned: 0, actual: 0 });
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(trip.budget.total.toString());

  const totalPlanned = trip.budget.categories.reduce((s, c) => s + c.planned, 0);
  const totalActual = trip.budget.categories.reduce((s, c) => s + c.actual, 0);
  const remaining = trip.budget.total - totalActual;
  const overBudget = totalActual > trip.budget.total;

  const chartData = trip.budget.categories
    .filter(c => c.planned > 0 || c.actual > 0)
    .map(c => ({ name: c.name, planned: c.planned, actual: c.actual, color: c.color }));

  const pieData = trip.budget.categories
    .filter(c => c.planned > 0)
    .map(c => ({ name: c.name, value: c.planned, color: c.color }));

  const startEdit = (cat: typeof trip.budget.categories[0]) => {
    setEditingId(cat.id);
    setEditValues({ planned: cat.planned, actual: cat.actual });
  };

  const saveEdit = () => {
    if (editingId) {
      updateBudgetCategory(trip.id, editingId, editValues);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Budget" value={formatCurrency(trip.budget.total, trip.currency)}
          color="indigo" icon="💰"
          editable
          onEdit={() => setEditingTotal(true)}
        />
        <SummaryCard label="Planned" value={formatCurrency(totalPlanned, trip.currency)} color="blue" icon="📋" />
        <SummaryCard label="Spent" value={formatCurrency(totalActual, trip.currency)}
          color={overBudget ? 'red' : 'pink'} icon="💳" />
        <SummaryCard label="Remaining" value={formatCurrency(remaining, trip.currency)}
          color={remaining < 0 ? 'red' : 'green'} icon="✅" />
      </div>

      {/* Edit total budget */}
      {editingTotal && (
        <div className="glass-card p-4 flex items-center gap-3">
          <label className="text-sm text-gray-400">Total Budget ({trip.currency}):</label>
          <input
            type="number"
            className="input-field w-40"
            value={totalInput}
            onChange={e => setTotalInput(e.target.value)}
            autoFocus
          />
          <button onClick={() => { updateBudgetTotal(trip.id, parseFloat(totalInput) || 0); setEditingTotal(false); }}
            className="btn-primary text-sm py-2">Save</button>
          <button onClick={() => setEditingTotal(false)} className="btn-secondary text-sm py-2">Cancel</button>
        </div>
      )}

      {overBudget && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            You're {formatCurrency(Math.abs(remaining), trip.currency)} over budget!
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Planned vs Actual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Budget Allocation</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                  formatter={(value: number) => [formatCurrency(value, trip.currency), '']}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
              Add budget amounts to see allocation
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {trip.budget.categories.map(cat => {
            const pct = getBudgetPercentage(cat.actual, cat.planned);
            const isEditing = editingId === cat.id;

            return (
              <motion.div key={cat.id} layout className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Plan:</span>
                              <input
                                type="number"
                                className="input-field w-20 py-1 text-xs"
                                value={editValues.planned}
                                onChange={e => setEditValues(p => ({ ...p, planned: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Actual:</span>
                              <input
                                type="number"
                                className="input-field w-20 py-1 text-xs"
                                value={editValues.actual}
                                onChange={e => setEditValues(p => ({ ...p, actual: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <button onClick={saveEdit} className="p-1.5 rounded-lg bg-green-500/20 text-green-400">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                <span className="text-white font-medium">{formatCurrency(cat.actual, trip.currency)}</span>
                                {' '}/{' '}
                                {formatCurrency(cat.planned, trip.currency)}
                              </p>
                            </div>
                            <button onClick={() => startEdit(cat)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isEditing && cat.planned > 0 && (
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, editable, onEdit }: {
  label: string; value: string; color: string; icon: string; editable?: boolean; onEdit?: () => void;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-600/20 border-indigo-500/20 text-indigo-300',
    blue: 'from-blue-600/20 border-blue-500/20 text-blue-300',
    pink: 'from-pink-600/20 border-pink-500/20 text-pink-300',
    green: 'from-green-600/20 border-green-500/20 text-green-300',
    red: 'from-red-600/20 border-red-500/20 text-red-300',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br to-transparent border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {editable && <button onClick={onEdit}><Edit3 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" /></button>}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
