import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { History, Search, RefreshCcw, ShieldAlert, Clock, Terminal } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, search]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setError('Failed to fetch audit compliance logs');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching server API');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...logs];
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        l =>
          l.adminName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }
    setFilteredLogs(result);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Security Audit Log</h2>
            <p className="text-slate-400 text-xs">Chronological compliance record of administrative operations and inventory actions</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full max-w-sm">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by auditor name, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-lg outline-none text-xs text-slate-200 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No audit log entries available.
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Auditor</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Details Log</th>
                  <th className="p-4">IP Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/20 transition-all text-slate-300">
                    <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">{log.adminName}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold text-[9px] uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 min-w-[250px]">{log.details}</td>
                    <td className="p-4 font-mono text-slate-500">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
