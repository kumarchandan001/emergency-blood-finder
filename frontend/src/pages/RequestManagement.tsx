import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { AlertOctagon, HelpCircle, Search, Filter, Trash2, CheckCircle2, UserCheck, Flame, Info } from 'lucide-react';

export const RequestManagement: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Fulfilled' | 'Cancelled'>('All');

  // Assign Donor Modal State
  const [assigningRequest, setAssigningRequest] = useState<any | null>(null);
  const [compatibleDonors, setCompatibleDonors] = useState<any[]>([]);
  const [fetchingDonors, setFetchingDonors] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, search, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/requests/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        setError('Failed to fetch emergency requests');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching server API');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...requests];

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        r => r.patientName.toLowerCase().includes(q) || r.hospitalName.toLowerCase().includes(q)
      );
    }

    setFilteredRequests(result);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'Fulfilled' | 'Cancelled') => {
    if (!window.confirm(`Are you sure you want to mark this request as ${newStatus}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchRequests();
      } else {
        alert('Failed to update request status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating status');
    }
  };

  const openAssignModal = async (reqItem: any) => {
    setAssigningRequest(reqItem);
    setFetchingDonors(true);
    try {
      // Find compatible donors near request coordinates
      const lat = reqItem.location.coordinates[1];
      const lon = reqItem.location.coordinates[0];
      const res = await fetch(
        `${API_BASE}/donors/search?bloodGroup=${reqItem.bloodGroup}&latitude=${lat}&longitude=${lon}&radiusKm=30`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setCompatibleDonors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDonors(false);
    }
  };

  const handleManualAssign = async (donorId: string) => {
    if (!assigningRequest) return;
    if (!window.confirm('Do you want to assign this donor? This will complete the campaign and record the donation.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId,
          requestId: assigningRequest._id,
          remarks: `Assigned manually by administrator for ${assigningRequest.patientName}`
        }),
      });

      if (res.ok) {
        alert('Donation recorded and request resolved!');
        setAssigningRequest(null);
        await fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to record donation');
      }
    } catch (err) {
      console.error(err);
      alert('Network error registering assignment');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-4">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Emergency Request Campaigns</h2>
          <p className="text-slate-400 text-xs">Track active alerts, cancel false alarms, or assign compatible donor backups</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-lg outline-none text-xs text-slate-200 transition-all placeholder:text-slate-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs outline-none text-slate-300 self-stretch sm:self-auto"
        >
          <option value="All">All Request Statuses</option>
          <option value="Pending">Pending / Active</option>
          <option value="Fulfilled">Fulfilled</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No emergency requests found.
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Patient / Hospital</th>
                  <th className="p-4">Required</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-900/20 transition-all text-slate-300">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-white text-sm">{req.patientName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{req.hospitalName}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-red-500 mr-2">{req.bloodGroup}</span>
                      <span className="text-slate-400">{req.unitsRequired} Units</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          req.urgency === 'Critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-500 font-extrabold'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          req.status === 'Fulfilled'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : req.status === 'Cancelled'
                            ? 'bg-slate-800 border-slate-700 text-slate-500'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {req.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => openAssignModal(req)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] rounded-lg text-emerald-400 font-bold hover:text-emerald-300 transition-all inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'Fulfilled')}
                            className="p-1.5 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 rounded-lg text-slate-500 hover:text-emerald-400 transition-all inline-flex"
                            title="Resolve Request"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'Cancelled')}
                            className="p-1.5 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all inline-flex"
                            title="Cancel Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Donor Modal */}
      {assigningRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Assign Donor for {assigningRequest.patientName} ({assigningRequest.bloodGroup})
            </h3>

            {fetchingDonors ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : compatibleDonors.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
                No active, approved donors found matching blood compatibility rules within 30 km.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Compatible Surrounding Donors</p>
                {compatibleDonors.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center text-xs text-left"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{d.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{d.phone} • {d.distance.toFixed(1)} km away</p>
                    </div>
                    <button
                      onClick={() => handleManualAssign(d.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-all"
                    >
                      Assign Match
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setAssigningRequest(null)}
              className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 rounded-lg transition-all mt-5"
            >
              Cancel Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
