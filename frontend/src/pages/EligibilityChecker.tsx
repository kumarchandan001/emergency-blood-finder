import React, { useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { HeartHandshake, Calendar, AlertCircle, CheckCircle, HelpCircle, Sparkles, Scale, Info } from 'lucide-react';

export const EligibilityChecker: React.FC = () => {
  const { token, donor, setDonor } = useAuth();

  const [weight, setWeight] = useState<number>(donor?.age ? 65 : 65);
  const [age, setAge] = useState<number>(donor?.age || 25);
  const [lastDonationDate, setLastDonationDate] = useState(donor?.lastDonationDate?.split('T')[0] || '');
  const [chronicConditions, setChronicConditions] = useState('');
  const [medications, setMedications] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccessStatus(null);

    try {
      const res = await fetch(`${API_BASE}/ai/eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: Number(weight),
          age: Number(age),
          lastDonationDate: lastDonationDate || undefined,
          chronicConditions: chronicConditions || 'None',
          medications: medications || 'None',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSuccessStatus(data.status);
        // Sync context donor state
        if (donor) {
          setDonor({
            ...donor,
            eligibilityStatus: data.status,
            lastDonationDate: lastDonationDate || null,
          });
        }
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Connection error. Failed to reach verification service.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-8 text-left">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>AI Donor Eligibility Verification</span>
            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9px] font-bold uppercase tracking-wider">
              AI Auditor
            </span>
          </h1>
          <p className="text-slate-400 text-xs">Verify your metrics against medical safe-donation guidelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="md:col-span-7">
          <div className="glass-panel p-6 rounded-xl">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Donor Age</label>
                    <span className="text-xs font-bold text-red-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {age} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="75"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                  <span className="text-[10px] text-slate-500 flex justify-between mt-1">
                    <span>Min: 15</span>
                    <span>Max: 75</span>
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Donor Weight</label>
                    <span className="text-xs font-bold text-red-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {weight} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="130"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                  <span className="text-[10px] text-slate-500 flex justify-between mt-1">
                    <span>Min: 40 kg</span>
                    <span>Max: 130 kg</span>
                  </span>
                </div>
              </div>

              {/* Date */}
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-xs transition-all text-slate-400"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Leave blank if this is your first donation campaign.</span>
              </div>

              {/* Chronic conditions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Chronic Conditions</label>
                <textarea
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  placeholder="E.g., High blood pressure under check, none, type-2 diabetes"
                  rows={2}
                  className="w-full p-3 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Active medications */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Active Medications</label>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="E.g., Aspirin daily, multivitamins, none"
                  rows={2}
                  className="w-full p-3 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all border border-red-500/20 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Run AI Diagnostics</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="md:col-span-5 space-y-4 text-left">
          {successStatus ? (
            <div className={`glass-panel p-6 rounded-xl border-l-4 ${successStatus.isEligible ? 'border-emerald-500' : 'border-red-500'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                {successStatus.isEligible ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400">Diagnosis: Eligible</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Diagnosis: Ineligible</span>
                  </>
                )}
              </h3>

              <div className="bg-slate-900/60 rounded-lg p-4 space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {successStatus.reason}
                </p>
                <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
                  <span>Audited by LifeFlow AI</span>
                  <span>{new Date(successStatus.checkedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : donor ? (
            <div className={`glass-panel p-6 rounded-xl border-l-4 ${donor.eligibilityStatus.isEligible ? 'border-emerald-500' : 'border-red-500'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                {donor.eligibilityStatus.isEligible ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400">Current Status: Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Current Status: Resting</span>
                  </>
                )}
              </h3>

              <div className="bg-slate-900/60 rounded-lg p-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {donor.eligibilityStatus.reason}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center py-12 text-slate-500 border border-dashed border-slate-800">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">Run diagnosis to display AI medical auditing logs</p>
            </div>
          )}

          <div className="glass-panel p-5 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-red-400" />
              <span>Diagnostic Rules</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Weight threshold: Must weigh &ge; 50 kg</li>
              <li>Age boundaries: Under 18 or over 65 excluded</li>
              <li>Donation interval: 90 days cooldown required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
