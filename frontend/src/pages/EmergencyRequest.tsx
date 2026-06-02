import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ShieldAlert, MapPin, Compass, Droplet, User, Landmark, PlusCircle, Sparkles, AlertTriangle } from 'lucide-react';

export const EmergencyRequest: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [urgency, setUrgency] = useState<'Critical' | 'High' | 'Medium'>('High');

  // Location Coordinates
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  useEffect(() => {
    handleLocate();
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error(err);
        // Fallback to Bangalore center
        setLatitude(12.9716);
        setLongitude(77.5946);
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!latitude || !longitude) {
      setError('Coordinates are required. Please trigger "Locate Hospital" to fetch GPS coordinate tags.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName,
          hospitalName,
          bloodGroup,
          unitsRequired: Number(unitsRequired),
          urgency,
          coordinates: [longitude, latitude],
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.message || 'Failed to submit emergency blood request');
      } else {
        setSuccessData(data);
      }
    } catch (err: any) {
      setLoading(false);
      setError('Network error connecting to API');
    }
  };

  if (successData) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern py-12 px-6 flex items-center justify-center">
        <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-3">
            <span className="text-gradient-gold">Alerts Dispatched!</span>
          </h2>
          <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto leading-relaxed">
            Your emergency request has been successfully created. We have matched compatible donors and sent instant notifications.
          </p>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 mb-8 text-left space-y-3">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-xs uppercase tracking-wider">Campaign Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-slate-500">Patient:</span>
              <span className="text-slate-350 font-medium">{successData.request.patientName}</span>
              <span className="text-slate-500">Hospital:</span>
              <span className="text-slate-350 font-medium">{successData.request.hospitalName}</span>
              <span className="text-slate-500">Blood Required:</span>
              <span className="text-red-400 font-extrabold">{successData.request.bloodGroup} ({successData.request.unitsRequired} Units)</span>
              <span className="text-slate-500">Urgency:</span>
              <span className={`font-bold ${successData.request.urgency === 'Critical' ? 'text-red-500' : 'text-amber-505'}`}>
                {successData.request.urgency}
              </span>
            </div>
          </div>

          <div className="text-left mb-8">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-550 animate-ping inline-block" />
              <span>Notified Close-Range Donors ({successData.notifiedDonorsCount})</span>
            </h4>
            <div className="space-y-2">
              {successData.alertsDispatched.map((alert: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-slate-300">{alert.donorName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Contact: {alert.donorPhone}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold text-[9px]">
                    {alert.distance.toFixed(1)} km away
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Go to Proximity Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern py-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 border-b border-slate-800/80 pb-5 mb-8">
            <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
              <ShieldAlert className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-extrabold text-white">
                <span className="text-gradient">Create Emergency Request</span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Dispatch instant notification pings to surrounding compatible donors</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm shadow-[0_0_12px_rgba(239,68,68,0.05)]">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Patient Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="E.g., Anil Verma"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all placeholder:text-slate-655 input-premium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Hospital Name / Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="E.g., St. Johns Hospital"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-855 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all placeholder:text-slate-655 input-premium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Required Blood Group</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-red-500">
                    <Droplet className="w-4 h-4 fill-red-500" />
                  </span>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-250 text-xs transition-all input-premium"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg} className="bg-slate-950">
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Units Required</label>
                <input
                  type="number"
                  required
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-205 text-xs transition-all input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Urgency Priority</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className={`w-full px-4 py-2.5 bg-slate-900/60 border focus:border-red-500/45 rounded-xl outline-none text-xs transition-all font-bold input-premium ${
                    urgency === 'Critical'
                      ? 'border-red-650 text-red-400'
                      : urgency === 'High'
                      ? 'border-amber-600 text-amber-400'
                      : 'border-slate-800 text-slate-300'
                  }`}
                >
                  <option value="Medium" className="bg-slate-950 text-slate-300">Medium</option>
                  <option value="High" className="bg-slate-950 text-amber-400">High</option>
                  <option value="Critical" className="bg-slate-950 text-red-500 font-extrabold">🚨 Critical (Urgent)</option>
                </select>
              </div>
            </div>

            {/* Coordinates geolocation setup */}
            <div className="bg-slate-950/65 border border-slate-900 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Coordinates Mapping</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {latitude && longitude
                      ? `${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E`
                      : 'Not located. Using default city coordinates.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 rounded-lg border border-slate-800 transition-all flex items-center gap-1.5"
              >
                <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Locate Hospital'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-premium disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-650/10 hover:shadow-red-650/20 transition-all border border-red-500/20 mt-4 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Request & Find Donors</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
