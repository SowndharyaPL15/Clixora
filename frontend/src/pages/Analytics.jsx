import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  ArrowLeft, Calendar, Globe, Monitor, Smartphone, Tablet, 
  Tv, Compass, Copy, Check, Share2, AlertCircle, Clock 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const Analytics = () => {
  const { shortCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get(`/analytics/${shortCode}`);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [shortCode]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const copyPublicAnalyticsLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Public analytics link copied!');
  };

  const copyShortUrl = (code) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const link = `${backendUrl}/r/${code}`;
    navigator.clipboard.writeText(link);
    showToast('Shortened link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass p-8 rounded-2xl border border-slate-800 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Could not fetch analytics details.'}</p>
          <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { url, trends, devices, browsers, recentVisits } = data;
  const isExpired = url.expiry_date && new Date(url.expiry_date) < new Date();

  // Parse trends data for better chart labeling
  const formattedTrends = trends.map(t => ({
    date: new Date(t.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Clicks: parseInt(t.clicks, 10)
  }));

  // Parse device data for pie chart
  const deviceData = devices.map(d => ({
    name: d.device,
    value: parseInt(d.count, 10)
  }));

  // Parse browser data for lists/charts
  const browserData = browsers.map(b => ({
    name: b.browser,
    value: parseInt(b.count, 10)
  }));

  const getDeviceIcon = (device) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-violet-400" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-fuchsia-400" />;
      case 'smarttv': return <Tv className="w-4 h-4 text-amber-400" />;
      default: return <Monitor className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Background glow */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-violet-500/30 text-violet-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* URL Overview Card */}
      <div className="glass p-6 rounded-2xl border border-slate-800/80 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{url.short_code}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {url.click_count} total clicks
            </span>
            {isExpired && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-950/40 border border-red-800/30 text-red-300">
                Expired
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium truncate max-w-2xl mb-1">{url.original_url}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {new Date(url.created_at).toLocaleDateString()}
            </span>
            {url.expiry_date && (
              <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
                <Clock className="w-3.5 h-3.5" />
                Expires {new Date(url.expiry_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => copyShortUrl(url.short_code)}
            className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-violet-400 transition-colors"
            title="Copy Short URL"
          >
            <Copy className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={copyPublicAnalyticsLink}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-violet-400 hover:border-violet-500/30 transition-all"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Analytics
          </button>
        </div>
      </div>

      {/* Grid: Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Trend Area Chart */}
        <div className="glass p-6 rounded-2xl border border-slate-800/80 lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-4">Click History (Last 14 Days)</h3>
          {formattedTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No visits recorded in this period yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#a78bfa', fontSize: '13px' }}
                  />
                  <Area type="monotone" dataKey="Clicks" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="glass p-6 rounded-2xl border border-slate-800/80">
          <h3 className="text-base font-bold text-white mb-4">Device Distribution</h3>
          {deviceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No device data available.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with numbers */}
              <div className="w-full mt-2 grid grid-cols-2 gap-2 text-xs">
                {deviceData.map((d, index) => (
                  <div key={d.name} className="flex items-center space-x-2 bg-slate-900/40 px-2 py-1.5 rounded-lg border border-slate-800/60">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-slate-400 capitalize truncate">{d.name}</span>
                    <span className="font-extrabold text-white ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Browsers & Recent Visit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Browser List */}
        <div className="glass p-6 rounded-2xl border border-slate-800/80">
          <h3 className="text-base font-bold text-white mb-4">Top Browsers</h3>
          {browserData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No browser stats recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {browserData.map((b, index) => {
                const totalCount = browserData.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = totalCount > 0 ? ((b.value / totalCount) * 100).toFixed(0) : 0;
                
                return (
                  <div key={b.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
                        {b.name}
                      </span>
                      <span className="text-slate-400">
                        {b.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Visited Logs */}
        <div className="glass p-6 rounded-2xl border border-slate-800/80 lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-4">Recent Visits</h3>
          {recentVisits.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No visit logs available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/80">
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Date & Time</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">IP Address</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Device</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {recentVisits.map((visit, index) => (
                    <tr key={index} className="text-slate-300">
                      <td className="py-3 font-semibold text-slate-400">
                        {new Date(visit.visited_at).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono font-bold">{visit.ip_address}</td>
                      <td className="py-3 capitalize">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(visit.device)}
                          <span>{visit.device}</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold">{visit.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
