import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Boxes, AlertTriangle, RefreshCcw, Plus, Minus, Settings } from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { token } = useAuth();
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration Modal State
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [editUnits, setEditUnits] = useState(10);
  const [editThreshold, setEditThreshold] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStocks(data);
      } else {
        setError('Failed to fetch inventory logs');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching server API');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustInventory = async (bloodGroup: string, newUnits: number, threshold: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodGroup,
          availableUnits: Math.max(0, newUnits),
          lowStockThreshold: threshold
        }),
      });

      if (res.ok) {
        await fetchInventory();
        setSelectedStock(null);
      } else {
        alert('Failed to adjust inventory');
      }
    } catch (err) {
      console.error(err);
      alert('Network error adjusting stock');
    }
  };

  const openEditModal = (stockItem: any) => {
    setSelectedStock(stockItem);
    setEditUnits(stockItem.availableUnits);
    setEditThreshold(stockItem.lowStockThreshold);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Identify if any stock is low
  const lowStockGroups = stocks.filter(s => s.availableUnits < s.lowStockThreshold);

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Blood Bank Inventory</h2>
            <p className="text-slate-400 text-xs">Monitor stock levels, adjust available units, and configure warning thresholds</p>
          </div>
        </div>
        <button
          onClick={fetchInventory}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Critical Stock Alert banner */}
      {lowStockGroups.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500 animate-bounce" />
          <div>
            <h4 className="font-bold text-sm text-red-400">Critical Stock Warning!</h4>
            <p className="mt-1 text-slate-400 leading-relaxed">
              The following blood groups have fallen below safe thresholds: {' '}
              <span className="font-extrabold text-red-500">
                {lowStockGroups.map(s => `${s.bloodGroup} (${s.availableUnits} units)`).join(', ')}
              </span>.
              Please arrange immediate donation camps.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Stocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {stocks.map((stock) => {
          const isLow = stock.availableUnits < stock.lowStockThreshold;
          // Percentage calculation for progress bar
          const percent = Math.min(100, (stock.availableUnits / 25) * 100);

          return (
            <div
              key={stock._id}
              className={`glass-panel p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all hover:translate-y-[-2px] ${
                isLow ? 'border-red-500/30 ring-1 ring-red-500/20' : 'border-slate-800/80'
              }`}
            >
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <span className="text-2xl font-black text-red-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                  {stock.bloodGroup}
                </span>
                <button
                  onClick={() => openEditModal(stock)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400 hover:text-white transition-all"
                  title="Configure Stock"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Units Display */}
              <div className="my-5 text-left">
                <p className="text-4xl font-black text-white">{stock.availableUnits}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Available Units</p>
              </div>

              {/* Progress and Alerts */}
              <div className="space-y-3">
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span>Alert Threshold: {stock.lowStockThreshold}</span>
                  {isLow && (
                    <span className="text-red-500 font-extrabold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      <span>LOW STOCK</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Configuration Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-5 text-left">Adjust stock for {selectedStock.bloodGroup}</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdjustInventory(selectedStock.bloodGroup, editUnits, editThreshold);
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Available Units</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditUnits(Math.max(0, editUnits - 1))}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={editUnits}
                    onChange={(e) => setEditUnits(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setEditUnits(editUnits + 1)}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Low Stock Threshold Limit</label>
                <input
                  type="number"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Save Stock Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStock(null)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
