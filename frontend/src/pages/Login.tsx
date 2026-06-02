import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Login failed');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern px-4">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden shadow-2xl">
        {/* Glow effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              <span className="text-gradient">Welcome Back</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Sign in to report emergencies or manage your donor status</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm shadow-[0_0_12px_rgba(239,68,68,0.05)]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-655 input-premium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-655 input-premium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 btn-premium disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 hover:shadow-red-650/20 transition-all border border-red-500/20 mt-4 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 pt-4 border-t border-slate-900/60">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-semibold underline transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
