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
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-800/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm">Join the LifeFlow network to donate or request emergency blood</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => setRole('recipient')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === 'recipient'
                    ? 'bg-slate-900 border-red-500/50 text-white ring-1 ring-red-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Recipient</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === 'donor'
                    ? 'bg-slate-900 border-red-500/50 text-white ring-1 ring-red-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Donor</span>
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Donor Fields Section */}
            {role === 'donor' && (
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1.5 mb-2">
                  <Heart className="w-4 h-4 fill-red-500/20 text-red-400" />
                  <span>Donor Configuration Metrics</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg} className="bg-slate-950">
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Phone Number</label>
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
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      required={role === 'donor'}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      min="18"
                      max="65"
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all"
                    >
                      <option value="Male" className="bg-slate-950">Male</option>
                      <option value="Female" className="bg-slate-950">Female</option>
                      <option value="Other" className="bg-slate-950">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">City</label>
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
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Last Donation Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={lastDonationDate}
                        onChange={(e) => setLastDonationDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-sm transition-all text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates Display */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-slate-400" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Geolocation Coordinates</p>
                      <p className="text-xs text-slate-300">
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
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[10px] font-bold text-slate-300 rounded-lg border border-slate-700 transition-all"
                  >
                    {locating ? 'Locating...' : 'Locate GPS'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all border border-red-500/20 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
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
