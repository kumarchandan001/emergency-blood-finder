import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Users, Search, Filter, Trash2, Edit3, ShieldAlert, CheckCircle, UserMinus } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'donor' | 'recipient' | 'admin'>('All');
  const [bgFilter, setBgFilter] = useState('All');

  // Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, roleFilter, bgFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to fetch user list');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching server API');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...users];

    // Filter by role
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Filter by Blood Group
    if (bgFilter !== 'All') {
      result = result.filter(u => u.donorDetails?.bloodGroup === bgFilter);
    }

    // Filter by search query (name, email)
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    setFilteredUsers(result);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user account? This will also clear all linked donor profiles.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting user');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-4">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">User Base Management</h2>
          <p className="text-slate-400 text-xs">Search, filter, edit, or delete active donor and recipient accounts</p>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl items-center">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-red-500/50 rounded-lg outline-none text-xs text-slate-200 transition-all placeholder:text-slate-600"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs outline-none text-slate-300"
          >
            <option value="All">All User Roles</option>
            <option value="donor">Donors</option>
            <option value="recipient">Recipients</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div>
          <select
            value={bgFilter}
            onChange={(e) => setBgFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs outline-none text-slate-300"
          >
            <option value="All">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No users matching the filters.
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Name / Contact</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Blood group / City</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/20 transition-all text-slate-300">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-white text-sm">{u.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          u.role === 'admin'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : u.role === 'donor'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.donorDetails ? (
                        <div>
                          <span className="font-bold text-red-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 mr-2 text-[10px]">
                            {u.donorDetails.bloodGroup}
                          </span>
                          <span className="text-slate-400">{u.donorDetails.city}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.donorDetails ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                            u.donorDetails.verificationStatus === 'Approved'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : u.donorDetails.verificationStatus === 'Rejected'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}
                        >
                          {u.donorDetails.verificationStatus}
                        </span>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-400 border border-slate-800/80 hover:border-red-500/20 rounded-lg text-slate-500 transition-all ml-1.5"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
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
