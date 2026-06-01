import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon, Heart, Compass, ShieldAlert, BrainCircuit, HeartHandshake } from 'lucide-react';

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
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
          <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
          <span>LifeFlow <span className="text-red-500 font-extrabold">AI</span></span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
                <Compass className="w-4 h-4 text-red-400" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'recipient' && (
                <Link to="/request/new" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Request Emergency Blood</span>
                </Link>
              )}

              {user.role === 'donor' && (
                <Link to="/eligibility" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
                  <HeartHandshake className="w-4 h-4 text-red-400" />
                  <span>AI Eligibility</span>
                </Link>
              )}

              <Link to="/chat" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
                <BrainCircuit className="w-4 h-4 text-red-400" />
                <span>AI Assistant</span>
              </Link>

              {/* Donor Quick Toggle */}
              {user.role === 'donor' && donor && (
                <button
                  onClick={handleToggleAvailability}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    donor.available
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${donor.available ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span>{donor.available ? 'Available (Active)' : 'Unavailable (Cooldown)'}</span>
                </button>
              )}

              {/* User details */}
              <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white font-medium">{user.name}</p>
                  <p className="text-[10px] text-red-400 capitalize">{user.role} {donor && `(${donor.bloodGroup})`}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-red-400 transition-all text-slate-400"
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
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all"
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
