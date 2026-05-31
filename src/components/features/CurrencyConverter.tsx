import { useState } from 'react';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { CURRENCY_RATES } from '../../data/sampleData';
import { motion } from 'framer-motion';

interface Props {
  baseCurrency?: string;
}

export default function CurrencyConverter({ baseCurrency = 'USD' }: Props) {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState(baseCurrency);
  const [to, setTo] = useState(from === 'INR' ? 'USD' : 'INR');

  const fromRate = CURRENCY_RATES.find(r => r.code === from)?.rate ?? 1;
  const toRate = CURRENCY_RATES.find(r => r.code === to)?.rate ?? 1;

  const converted = (parseFloat(amount) || 0) * (toRate / fromRate);
  const exchangeRate = toRate / fromRate;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const commonPairs = CURRENCY_RATES.slice(0, 8).filter(r => r.code !== from);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-white">Currency Converter</h3>
        <span className="text-xs text-gray-600 ml-auto">Offline rates</span>
      </div>

      {/* Amount input */}
      <div>
        <label className="label">Amount</label>
        <input
          type="number"
          className="input-field text-lg font-semibold"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      {/* Currency selectors */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="label">From</label>
          <select className="input-field" value={from} onChange={e => setFrom(e.target.value)}>
            {CURRENCY_RATES.map(r => (
              <option key={r.code} value={r.code} className="bg-surface-2">{r.code} — {r.name}</option>
            ))}
          </select>
        </div>
        <button onClick={swap} className="mt-5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <label className="label">To</label>
          <select className="input-field" value={to} onChange={e => setTo(e.target.value)}>
            {CURRENCY_RATES.map(r => (
              <option key={r.code} value={r.code} className="bg-surface-2">{r.code} — {r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      <motion.div
        key={`${amount}-${from}-${to}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20"
      >
        <p className="text-xs text-gray-400 mb-1">
          {parseFloat(amount) || 0} {from} =
        </p>
        <p className="text-2xl font-bold text-white">
          {CURRENCY_RATES.find(r => r.code === to)?.symbol}
          {converted.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          1 {from} = {exchangeRate.toFixed(4)} {to}
        </p>
      </motion.div>

      {/* Quick reference */}
      <div>
        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Quick reference vs {from}</p>
        <div className="space-y-1.5">
          {[10, 50, 100, 500].map(amt => (
            <div key={amt} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{amt} {from}</span>
              <span className="text-gray-300 font-mono">
                {CURRENCY_RATES.find(r => r.code === to)?.symbol}
                {(amt * exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })} {to}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
