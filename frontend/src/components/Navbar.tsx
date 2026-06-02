import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { LogOut, Heart, Compass, ShieldAlert, BrainCircuit, HeartHandshake } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, donor, token, logout, setDonor } = useAuth();
  const navigate = useNavigate();

  const handleToggleAvailability = async () => {
    if (!token || !donor) return;
    try {
      const res = await fetch(`${API_BASE}/donors/availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDonor(data.donor);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-white/5 backdrop-blur-md px-6 py-3 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:opacity-95 transition-all">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500/25 blur-md rounded-full scale-125 animate-pulse" />
            <Heart className="w-5.5 h-5.5 text-red-500 fill-red-500 relative z-10 animate-pulse" />
          </div>
          <span className="relative">LifeFlow <span className="text-red-500 font-extrabold text-gradient drop-shadow-[0_0_8px_rgba(239,68,68,0.25)]">AI</span></span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 px-3 py-2 rounded-xl transition-all">
                <Compass className="w-4 h-4 text-red-400" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'recipient' && (
                <Link to="/request/new" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 px-3 py-2 rounded-xl transition-all">
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" style={{ animationDuration: '3s' }} />
                  <span>Request Emergency Blood</span>
                </Link>
              )}

              {user.role === 'donor' && (
                <Link to="/eligibility" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 px-3 py-2 rounded-xl transition-all">
                  <HeartHandshake className="w-4 h-4 text-red-400" />
                  <span>AI Eligibility</span>
                </Link>
              )}

              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 px-3 py-2 rounded-xl transition-all border border-amber-500/10">
                  <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Admin Portal</span>
                </Link>
              )}

              <Link to="/chat" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 px-3 py-2 rounded-xl transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <BrainCircuit className="w-4 h-4 text-red-400" />
                <span>AI Assistant</span>
              </Link>

              {/* Donor Quick Toggle */}
              {user.role === 'donor' && donor && (
                <button
                  onClick={handleToggleAvailability}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                    donor.available
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full relative flex items-center justify-center`}>
                    {donor.available && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${donor.available ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  </span>
                  <span>{donor.available ? 'Available (Active)' : 'Unavailable'}</span>
                </button>
              )}

              {/* User details */}
              <div className="flex items-center gap-3.5 border-l border-slate-800/80 pl-5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white font-semibold">{user.name}</p>
                  <p className="text-[10px] text-red-400 font-extrabold capitalize tracking-wide">{user.role} {donor && `(${donor.bloodGroup})`}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 hover:text-red-400 transition-all text-slate-400 shadow-sm"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-bold text-white shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all border border-red-500/20"
              >
                Become a Donor
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
