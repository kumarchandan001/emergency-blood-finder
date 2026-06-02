import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import { AlertCircle, CheckCircle, Compass, Search, Phone, User, Calendar, RefreshCcw, Bell } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, donor, token } = useAuth();

  // Recipient States
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [selectedDonorId, setSelectedDonorId] = useState<string | undefined>(undefined);

  // Search States
  const [searchBg, setSearchBg] = useState('O+');
  const [searchRadius, setSearchRadius] = useState(15);
  const [searchDonorsList, setSearchDonorsList] = useState<any[]>([]);

  // Donor States
  const [alerts, setAlerts] = useState<any[]>([]);
  const [donorSelectedAlert, setDonorSelectedAlert] = useState<any | null>(null);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load appropriate data based on role
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);

    try {
      if (user.role === 'recipient') {
        const res = await fetch(`${API_BASE}/requests/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMyRequests(data);
          if (data.length > 0) {
            handleSelectRequest(data[0]);
          }
        }
      } else if (user.role === 'donor') {
        await fetchDonorAlerts();
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
        // Default to select first pending/active alert
        if (data.length > 0) {
          setDonorSelectedAlert(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRequest = async (request: any) => {
    setSelectedRequest(request);
    setSelectedDonorId(undefined);
    try {
      const res = await fetch(`${API_BASE}/requests/${request._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Extract donors from notifications
        const donors = data.notifications.map((n: any) => ({
          id: n.donorId?._id || n.id,
          name: n.donorName,
          email: n.donorEmail,
          bloodGroup: request.bloodGroup,
          latitude: n.donorId?.location?.coordinates[1] || 12.97,
          longitude: n.donorId?.location?.coordinates[0] || 77.59,
          phone: n.phone,
          status: n.status,
          distance: 2.5, // placeholder distance if not saved
        }));
        setMatchedDonors(donors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchDonors = async () => {
    if (!token) return;
    setLoading(true);
    setSelectedRequest(null);
    try {
      // Default search centered around user location, or default Bangalore center
      let lat = 12.9716;
      let lon = 77.5946;
      if (donor && donor.location) {
        lat = donor.location.coordinates[1];
        lon = donor.location.coordinates[0];
      }

      const res = await fetch(
        `${API_BASE}/donors/search?bloodGroup=${searchBg}&latitude=${lat}&longitude=${lon}&radiusKm=${searchRadius}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchDonorsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'Accepted' | 'Rejected') => {
    try {
      const res = await fetch(`${API_BASE}/requests/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        await fetchDonorAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-8">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient capitalize">
              {user?.role} Dashboard
            </h1>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Real-time proximity matching engine status: Active</span>
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Recipient Dashboard Layout */}
        {user?.role === 'recipient' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Campaigns & Searches */}
            <div className="lg:col-span-5 space-y-6">
              {/* Active Requests List */}
              <div className="glass-panel p-6 rounded-2xl text-left border border-white/5 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>My Emergency Campaigns</span>
                </h2>

                {myRequests.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs mb-4">No blood request campaigns created yet.</p>
                    <a
                      href="/request/new"
                      className="inline-block px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-bold text-white rounded-xl shadow-md shadow-red-600/10 hover:shadow-red-600/20 transition-all border border-red-500/20"
                    >
                      Create Request
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {myRequests.map((req) => (
                      <div
                        key={req._id}
                        onClick={() => handleSelectRequest(req)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedRequest?._id === req._id
                            ? 'bg-slate-900/90 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                            : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 hover:bg-slate-950/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-200">{req.hospitalName}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Patient: {req.patientName}</p>
                          </div>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border capitalize tracking-wide ${
                              req.status === 'Fulfilled'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-slate-800/40 text-xs">
                          <span className="text-red-500 font-extrabold bg-red-500/5 px-2.5 py-1 rounded-lg border border-red-500/10">{req.bloodGroup}</span>
                          <span className="text-slate-300 font-semibold">{req.unitsRequired} Units Required</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Donor Compatibility Query search */}
              <div className="glass-panel p-6 rounded-2xl text-left border border-white/5 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-red-500" />
                  <span>Search Nearby Donors</span>
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Group</label>
                    <select
                      value={searchBg}
                      onChange={(e) => setSearchBg(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-red-500/50 rounded-xl text-xs outline-none text-white input-premium transition-all"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Radius ({searchRadius} km)</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                      className="w-full accent-red-550 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer mt-3"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSearchDonors}
                  className="w-full py-2.5 btn-premium text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Compatibility Base</span>
                </button>

                {searchDonorsList.length > 0 && (
                  <div className="mt-5 space-y-2.5 max-h-[220px] overflow-y-auto pr-1 pt-3 border-t border-slate-800/80">
                    {searchDonorsList.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDonorId(d.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          selectedDonorId === d.id
                            ? 'bg-slate-900 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.08)]'
                            : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-200">{d.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Contact: {d.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-bold text-[9px]">
                            Match: {d.score}%
                          </span>
                          <p className="text-[9px] text-slate-500 mt-1">{d.distance.toFixed(1)} km away</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Leaflet Map & Matches list */}
            <div className="lg:col-span-7 space-y-6">
              {/* Map Container */}
              <div className="glass-panel p-4 rounded-2xl h-[450px] border border-white/5 shadow-xl relative overflow-hidden">
                {selectedRequest ? (
                  <MapComponent
                    center={[selectedRequest.location.coordinates[1], selectedRequest.location.coordinates[0]]}
                    donors={matchedDonors}
                    hospitalName={selectedRequest.hospitalName}
                    selectedDonorId={selectedDonorId}
                  />
                ) : searchDonorsList.length > 0 ? (
                  <MapComponent
                    center={[12.9716, 77.5946]}
                    donors={searchDonorsList}
                    hospitalName="Search Center Location"
                    selectedDonorId={selectedDonorId}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/30 border border-slate-900 rounded-2xl text-slate-500">
                    <Compass className="w-10 h-10 mb-3 text-slate-600 animate-spin" style={{ animationDuration: '8s' }} />
                    <p className="text-xs font-semibold text-slate-400">Select a campaign or search radius to activate live mapping</p>
                    <p className="text-[10px] text-slate-600 mt-1">LifeFlow AI proximity search parses geo-hashes in real-time</p>
                  </div>
                )}
              </div>

              {/* Campaign Matching Details */}
              {selectedRequest && matchedDonors.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/5 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Matched Live Donor Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchedDonors.map((donor) => (
                      <div
                        key={donor.id}
                        onClick={() => setSelectedDonorId(donor.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedDonorId === donor.id
                            ? 'bg-slate-900 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.08)]'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-xs text-slate-200">{donor.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-450">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{donor.phone}</span>
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 capitalize tracking-wide ${
                              donor.status === 'Accepted'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : donor.status === 'Rejected'
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400'
                            }`}
                          >
                            Status: {donor.status}
                          </span>
                        </div>
                        <span className="text-md font-extrabold text-red-500 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
                          {donor.bloodGroup}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Donor Dashboard Layout */}
        {user?.role === 'donor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Proximity Alert Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-2xl text-left border border-white/5 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>Emergency Requests Broadcasted To You</span>
                </h2>

                {alerts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-slate-500 text-xs">
                    No active blood requests in your region. Check back later or make sure availability is on!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => {
                      const req = alert.requestId;
                      if (!req) return null;
                      return (
                        <div
                          key={alert._id}
                          onClick={() => setDonorSelectedAlert(alert)}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                            donorSelectedAlert?._id === alert._id
                              ? 'bg-slate-900/90 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2.5 py-0.5 bg-red-600/10 text-red-500 border border-red-600/20 rounded-full font-bold text-[8px] uppercase tracking-wider">
                                {req.urgency} Urgency
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-200 mt-2">{req.hospitalName}</h4>
                            </div>
                            <span className="text-md font-extrabold text-red-500 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                              {req.bloodGroup}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-3.5 leading-relaxed line-clamp-2">{alert.message}</p>

                          <div className="flex gap-2.5 mt-4 pt-3 border-t border-slate-800/40">
                            {alert.status === 'Sent' ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAlertAction(alert._id, 'Accepted');
                                  }}
                                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl transition-all border border-emerald-500/20 shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/15"
                                >
                                  Accept Donation
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAlertAction(alert._id, 'Rejected');
                                  }}
                                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all border border-slate-800"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span
                                className={`w-full py-2 text-center font-bold text-xs rounded-xl border block ${
                                  alert.status === 'Accepted'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                                }`}
                              >
                                Response: {alert.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI eligibility status box */}
              {donor && (
                <div className="glass-panel p-6 rounded-2xl text-left border-l-4 border-red-500/50 shadow-xl">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">AI Eligibility Diagnosis</h3>
                  <div className="bg-slate-950/60 rounded-xl p-4 text-xs space-y-3.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {donor.eligibilityStatus.isEligible ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                      )}
                      <span className="font-bold text-slate-200">
                        {donor.eligibilityStatus.isEligible ? 'Approved for Donation' : 'Currently Resting / Cooldown'}
                      </span>
                    </div>
                    <p className="text-slate-405 leading-relaxed text-[11px] bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/60">
                      {donor.eligibilityStatus.reason}
                    </p>
                    {donor.lastDonationDate && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-3 border-t border-slate-900">
                        <Calendar className="w-4 h-4" />
                        <span>Last Donation Date: {new Date(donor.lastDonationDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Alert Maps route details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel p-4 rounded-2xl h-[450px] border border-white/5 shadow-xl">
                {donorSelectedAlert && donorSelectedAlert.requestId ? (
                  <MapComponent
                    center={[
                      donorSelectedAlert.requestId.location.coordinates[1],
                      donorSelectedAlert.requestId.location.coordinates[0],
                    ]}
                    hospitalName={donorSelectedAlert.requestId.hospitalName}
                    donors={
                      donor
                        ? [
                            {
                              id: donor._id,
                              name: 'Me (Donor)',
                              bloodGroup: donor.bloodGroup,
                              latitude: donor.location.coordinates[1],
                              longitude: donor.location.coordinates[0],
                              phone: donor.phone,
                              distance: 0,
                            },
                          ]
                        : []
                    }
                    selectedDonorId={donor?._id}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/30 border border-slate-900 rounded-2xl text-slate-500">
                    <Compass className="w-10 h-10 mb-3 text-slate-600 animate-spin" style={{ animationDuration: '8s' }} />
                    <p className="text-xs font-semibold text-slate-400">Select an active broadcast card to load route tracking map</p>
                  </div>
                )}
              </div>

              {donorSelectedAlert && donorSelectedAlert.requestId && (
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/5 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-3">Emergency Metadata</h3>
                  <div className="grid grid-cols-2 gap-5 text-xs bg-slate-950/20 p-4 rounded-xl border border-slate-900">
                    <div>
                      <p className="text-slate-500 font-semibold uppercase tracking-wide text-[9px]">Hospital Center</p>
                      <p className="font-extrabold text-slate-200 mt-1 text-sm">{donorSelectedAlert.requestId.hospitalName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold uppercase tracking-wide text-[9px]">Required Volume</p>
                      <p className="font-extrabold text-red-500 mt-1 text-sm">{donorSelectedAlert.requestId.unitsRequired} Units ({donorSelectedAlert.requestId.bloodGroup})</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
