import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { FileSpreadsheet, Download, Search, Calendar, Filter, Droplet } from 'lucide-react';

type ReportType = 'donors' | 'requests' | 'donations';

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('donors');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All');
  const [city, setCity] = useState('');

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (reportType === 'donors') {
        endpoint = `${API_BASE}/admin/users`;
      } else if (reportType === 'requests') {
        endpoint = `${API_BASE}/requests/all`;
      } else {
        endpoint = `${API_BASE}/admin/donations`;
      }

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        let data = await res.json();

        // 1. Filter donors from user list if report type is donors
        if (reportType === 'donors') {
          data = data.filter((u: any) => u.role === 'donor' && u.donorDetails);
        }

        // 2. Apply local filters (Blood group, City, Date range)
        if (bloodGroup !== 'All') {
          if (reportType === 'donors') {
            data = data.filter((d: any) => d.donorDetails.bloodGroup === bloodGroup);
          } else {
            data = data.filter((item: any) => item.bloodGroup === bloodGroup);
          }
        }

        if (city.trim() !== '') {
          const c = city.toLowerCase();
          if (reportType === 'donors') {
            data = data.filter((d: any) => d.donorDetails.city.toLowerCase().includes(c));
          } else if (reportType === 'requests') {
            data = data.filter((r: any) => r.hospitalName.toLowerCase().includes(c));
          } else {
            data = data.filter((d: any) => d.hospital.toLowerCase().includes(c));
          }
        }

        if (startDate) {
          const start = new Date(startDate).getTime();
          data = data.filter((item: any) => {
            const date = new Date(item.createdAt || item.donationDate).getTime();
            return date >= start;
          });
        }

        if (endDate) {
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // end of day
          data = data.filter((item: any) => {
            const date = new Date(item.createdAt || item.donationDate).getTime();
            return date <= end;
          });
        }

        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'donors') {
      headers = ['Name', 'Email', 'Blood Group', 'Phone', 'Age', 'City', 'Status', 'Available'];
      rows = reportData.map((d: any) => [
        d.name,
        d.email,
        d.donorDetails.bloodGroup,
        d.donorDetails.phone,
        d.donorDetails.age.toString(),
        d.donorDetails.city,
        d.donorDetails.verificationStatus,
        d.donorDetails.available ? 'Yes' : 'No'
      ]);
    } else if (reportType === 'requests') {
      headers = ['Patient Name', 'Hospital', 'Blood Group', 'Units Needed', 'Urgency', 'Status', 'Date'];
      rows = reportData.map((r: any) => [
        r.patientName,
        r.hospitalName,
        r.bloodGroup,
        r.unitsRequired.toString(),
        r.urgency,
        r.status,
        new Date(r.createdAt).toLocaleDateString()
      ]);
    } else {
      headers = ['Donor Name', 'Patient Name', 'Blood Group', 'Hospital', 'Donation Date', 'Remarks'];
      rows = reportData.map((d: any) => [
        d.donorName,
        d.patientName,
        d.bloodGroup,
        d.hospital,
        new Date(d.donationDate).toLocaleDateString(),
        d.remarks
      ]);
    }

    // Generate CSV contents
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">System Reports Center</h2>
            <p className="text-slate-400 text-xs">Generate custom compliance reports and export matching history as CSV logs</p>
          </div>
        </div>
        {reportData.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-red-600/10 border border-red-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Query Filter configuration panel */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl items-end text-xs">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg outline-none text-slate-300"
          >
            <option value="donors">Donor Database Report</option>
            <option value="requests">Emergency Requests Report</option>
            <option value="donations">Completed Donations Log</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Blood Group</label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg outline-none text-slate-300"
          >
            <option value="All">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Hospital / City Filter</label>
          <input
            type="text"
            placeholder="E.g., Bangalore"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg outline-none text-slate-300"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg outline-none text-slate-400"
          />
        </div>

        <div>
          <button
            onClick={generateReport}
            className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : reportData.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No records match the filter criteria.
        </div>
      ) : (
        /* Report Data Preview Table */
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
          <div className="p-4 bg-slate-900/40 border-b border-slate-800/80 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Report Preview ({reportData.length} records)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  {reportType === 'donors' && (
                    <>
                      <th className="p-3">Name</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Status</th>
                    </>
                  )}
                  {reportType === 'requests' && (
                    <>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Hospital</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Units Required</th>
                      <th className="p-3">Status</th>
                    </>
                  )}
                  {reportType === 'donations' && (
                    <>
                      <th className="p-3">Donor Name</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Hospital</th>
                      <th className="p-3">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {reportData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-all text-slate-300">
                    {reportType === 'donors' && (
                      <>
                        <td className="p-3 font-bold text-white">{item.name}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
                            {item.donorDetails.bloodGroup}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{item.donorDetails.phone}</td>
                        <td className="p-3">{item.donorDetails.city}</td>
                        <td className="p-3 capitalize">{item.donorDetails.verificationStatus}</td>
                      </>
                    )}
                    {reportType === 'requests' && (
                      <>
                        <td className="p-3 font-bold text-white">{item.patientName}</td>
                        <td className="p-3 text-slate-400">{item.hospitalName}</td>
                        <td className="p-3 font-extrabold text-red-500">{item.bloodGroup}</td>
                        <td className="p-3">{item.unitsRequired}</td>
                        <td className="p-3 capitalize">{item.status}</td>
                      </>
                    )}
                    {reportType === 'donations' && (
                      <>
                        <td className="p-3 font-bold text-white">{item.donorName}</td>
                        <td className="p-3 text-slate-400">{item.patientName}</td>
                        <td className="p-3 font-extrabold text-red-500">{item.bloodGroup}</td>
                        <td className="p-3">{item.hospital}</td>
                        <td className="p-3">{new Date(item.donationDate).toLocaleDateString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
