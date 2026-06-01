import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Users, Heart, Activity, ShieldCheck, CheckCircle2, AlertTriangle, UserMinus } from 'lucide-react';

const COLORS = ['#ef4444', '#f87171', '#3b82f6', '#60a5fa', '#10b981', '#34d399', '#f59e0b', '#fbbf24'];

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to retrieve statistics.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error reaching administrative API.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-panel p-6 rounded-xl border-red-500/20 text-center text-red-400 text-xs">
        {error || 'An unexpected error occurred loading statistics.'}
      </div>
    );
  }

  const cardData = [
    { label: 'Total Registered Users', value: stats.cards.totalUsers, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Active Blood Donors', value: stats.cards.totalDonors, icon: Heart, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    { label: 'Recipients Base', value: stats.cards.totalRecipients, icon: Activity, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label: 'Pending Audits', value: stats.cards.pendingVerifications, icon: ShieldCheck, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', alert: stats.cards.pendingVerifications > 0 },
    { label: 'Active Request Campaigns', value: stats.cards.activeRequests, icon: FlameIcon, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    { label: 'Fulfilled Match Records', value: stats.cards.completedDonations, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Rejected Donor Accounts', value: stats.cards.rejectedDonors, icon: UserMinus, color: 'text-slate-400 bg-slate-800/60 border-slate-700/60' },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Administrative Operations Dashboard</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time indicators across matching inventory channels</p>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-xl border flex items-center justify-between relative overflow-hidden ${
                card.alert ? 'ring-1 ring-amber-500/30 border-amber-500/30' : ''
              }`}
            >
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{card.label}</p>
                <p className="text-3xl font-extrabold text-white">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Line Chart */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Monthly Campaigns vs Matches Trend</h3>
          <div className="h-[300px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#f87171" strokeWidth={2.5} name="Blood Requests" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="donations" stroke="#34d399" strokeWidth={2.5} name="Donations Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Groups Distribution Bar Chart */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Blood Groups Proportions</h3>
          <div className="h-[300px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bloodGroups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="value" name="Donors Count">
                  {stats.bloodGroups.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// SVG local Flame helper icon
const FlameIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
