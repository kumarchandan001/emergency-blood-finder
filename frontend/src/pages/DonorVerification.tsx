import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ShieldCheck, UserCheck, UserX, AlertCircle, FileText, Search, Filter, Info, Eye } from 'lucide-react';

export const DonorVerification: React.FC = () => {
  const { token } = useAuth();
  const [donors, setDonors] = useState<any[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Suspended'>('Pending');

  // Modal State
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [modalRemarks, setModalRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donors, search, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter users who are donors
        const donorUsers = data.filter((u: any) => u.role === 'donor' && u.donorDetails);
        setDonors(donorUsers);
      } else {
        setError('Failed to fetch user profiles');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching server');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...donors];

    // Filter by verification status
    if (statusFilter !== 'All') {
      result = result.filter(d => d.donorDetails.verificationStatus === statusFilter);
    }

    // Filter by search query (name, email, phone, city)
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.donorDetails.phone.includes(q) ||
          d.donorDetails.city.toLowerCase().includes(q)
      );
    }

    setFilteredDonors(result);
  };

  const handleActionSubmit = async (status: 'Approved' | 'Rejected' | 'Suspended') => {
    if (!selectedDonor || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/admin/verify/${selectedDonor.donorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks: modalRemarks }),
      });

      if (res.ok) {
        // Refresh local items
        await fetchUsers();
        setSelectedDonor(null);
        setModalRemarks('');
      } else {
        const data = await res.json();
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to API');
    } finally {
      setSubmitting(false);
    }
  };

  const openAuditModal = (user: any) => {
    setSelectedDonor({
      userId: user.id,
      donorId: user.donorDetails._id || user.id, // Fallback if ID nested
      name: user.name,
      email: user.email,
      phone: user.donorDetails.phone,
      bloodGroup: user.donorDetails.bloodGroup,
      age: user.donorDetails.age,
      city: user.donorDetails.city,
      remarks: user.donorDetails.verificationRemarks || '',
      verificationStatus: user.donorDetails.verificationStatus
    });
    setModalRemarks(user.donorDetails.verificationRemarks || '');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-4">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Donor Verification Audits</h2>
          <p className="text-slate-400 text-xs">Verify credentials and approve registrations before dispatching alerts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-lg outline-none text-xs text-slate-200 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs outline-none text-slate-300"
          >
            <option value="All">All Verification Statuses</option>
            <option value="Pending">Pending Audit</option>
            <option value="Approved">Approved / Active</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No donors matching the specified filter criteria.
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Age / Gender</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredDonors.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/20 transition-all text-slate-300">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-white text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold text-xs">
                        {user.donorDetails.bloodGroup}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{user.donorDetails.city}</td>
                    <td className="p-4 text-slate-400">{user.donorDetails.age} Yrs / {user.donorDetails.phone}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          user.donorDetails.verificationStatus === 'Approved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : user.donorDetails.verificationStatus === 'Rejected'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : user.donorDetails.verificationStatus === 'Suspended'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {user.donorDetails.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openAuditModal(user)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg hover:text-white transition-all text-xs font-semibold flex items-center gap-1 inline-flex"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Auditing Verification: {selectedDonor.name}</h3>

            <div className="bg-slate-950/60 rounded-xl p-4 mb-5 text-xs space-y-2 border border-slate-850">
              <div className="grid grid-cols-2">
                <span className="text-slate-500">Blood Group:</span>
                <span className="text-red-400 font-extrabold">{selectedDonor.bloodGroup}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-500">Contact phone:</span>
                <span className="text-slate-300 font-medium">{selectedDonor.phone}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-300 truncate font-medium">{selectedDonor.email}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-500">City Location:</span>
                <span className="text-slate-300 font-medium">{selectedDonor.city}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-500">Status:</span>
                <span className="text-amber-500 font-bold uppercase">{selectedDonor.verificationStatus}</span>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Auditor Decision Remarks</label>
                <textarea
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="Enter remarks (e.g. verified coordinates, credentials correct...)"
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl outline-none text-xs text-slate-200 resize-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleActionSubmit('Approved')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleActionSubmit('Rejected')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleActionSubmit('Suspended')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                >
                  Suspend
                </button>
              </div>

              <button
                onClick={() => setSelectedDonor(null)}
                className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 rounded-lg transition-all"
              >
                Close Audit Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
