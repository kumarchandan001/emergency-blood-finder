import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, MapPin, Heart, Calendar, Compass, UserCheck, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  // Basic Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'donor' | 'recipient'>('recipient');

  // Donor Details
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [lastDonationDate, setLastDonationDate] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Attempt to auto-locate on role selection change
  useEffect(() => {
    if (role === 'donor') {
      handleLocate();
    }
  }, [role]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error('Error getting location:', err);
        // Fallback: Default center of Bangalore
        setLatitude(12.9716);
        setLongitude(77.5946);
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let donorDetails = undefined;
    if (role === 'donor') {
      donorDetails = {
        bloodGroup,
        phone,
        age: Number(age),
        gender,
        city,
        coordinates: longitude && latitude ? [longitude, latitude] : [77.5946, 12.9716],
        lastDonationDate: lastDonationDate || undefined,
      };
    }

    const res = await registerUser(name, email, password, role, donorDetails);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern py-12 px-4">
      <div className="w-full max-w-lg p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden shadow-2xl">
        {/* Decorative Glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              <span className="text-gradient">Create Account</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Join the LifeFlow network to donate or request emergency blood</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm shadow-[0_0_12px_rgba(239,68,68,0.05)]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => setRole('recipient')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'recipient'
                    ? 'bg-slate-900 border-red-500/40 text-white ring-1 ring-red-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-450 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4 text-red-400" />
                <span>Recipient</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'donor'
                    ? 'bg-slate-900 border-red-500/40 text-white ring-1 ring-red-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-455 hover:text-slate-200'
                }`}
              >
                <Heart className="w-4 h-4 text-red-550 fill-red-500/20" />
                <span>Donor</span>
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-655 input-premium"
                  />
                </div>
              </div>

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
                    placeholder="john@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-655 input-premium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Password</label>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-855 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-655 input-premium"
                  />
                </div>
              </div>
            </div>

            {/* Donor Fields Section */}
            {role === 'donor' && (
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                  <Heart className="w-4 h-4 fill-red-500/20 text-red-400" />
                  <span>Donor Configuration Metrics</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-250 text-xs transition-all input-premium"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg} className="bg-slate-950">
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required={role === 'donor'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9988776655"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all placeholder:text-slate-655 input-premium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      required={role === 'donor'}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      min="18"
                      max="65"
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all input-premium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-255 text-xs transition-all input-premium"
                    >
                      <option value="Male" className="bg-slate-950">Male</option>
                      <option value="Female" className="bg-slate-950">Female</option>
                      <option value="Other" className="bg-slate-950">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">City</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required={role === 'donor'}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bangalore"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all placeholder:text-slate-655 input-premium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Last Donation Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={lastDonationDate}
                        onChange={(e) => setLastDonationDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-305 text-xs transition-all input-premium"
                      />
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates Display */}
                <div className="bg-slate-950/60 border border-slate-905 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-slate-500 animate-spin" style={{ animationDuration: '10s' }} />
                    <div className="text-left">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">GPS Proximity Coordinate Mapping</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {latitude && longitude
                          ? `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
                          : 'Unavailable (Bangalore defaults)'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-[10px] font-bold text-slate-300 rounded-lg border border-slate-800 transition-all hover:text-white"
                  >
                    {locating ? 'Locating...' : 'Locate GPS'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 btn-premium disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-650/10 hover:shadow-red-650/20 transition-all border border-red-500/20 mt-4 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 pt-4 border-t border-slate-900/60">
            Already have an account?{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
