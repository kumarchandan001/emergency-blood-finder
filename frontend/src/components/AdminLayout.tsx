import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  AlertOctagon,
  Boxes,
  FileSpreadsheet,
  History,
  Home,
  User as UserIcon,
  Heart
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Route protection - ensure user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const menuItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Donor Verifications', path: '/admin/verify', icon: ShieldCheck },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Emergency Requests', path: '/admin/requests', icon: AlertOctagon },
    { label: 'Blood Inventory', path: '/admin/inventory', icon: Boxes },
    { label: 'System Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Audit Security Logs', path: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans relative bg-radial-overlay bg-grid-pattern overflow-hidden">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between sticky top-0 h-screen z-40 shrink-0 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white mb-8">
            <Heart className="w-5.5 h-5.5 text-red-500 fill-red-500 animate-pulse" />
            <span>LifeFlow <span className="text-red-500 font-extrabold text-gradient drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]">Portal</span></span>
          </div>

          <nav className="space-y-1.5 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2.5">Management</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-650 to-red-700 text-white shadow-lg shadow-red-600/15 border border-red-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/80 space-y-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all text-left"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Go to User App</span>
          </Link>

          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-850 p-3 rounded-2xl text-left relative overflow-hidden shadow-sm">
            <div className="w-8.5 h-8.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-red-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                <span>System Admin</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto z-10">
        <Outlet />
      </main>
    </div>
  );
};
