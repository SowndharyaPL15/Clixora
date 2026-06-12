import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ArrowLeft, Calendar, Monitor, Smartphone, Tablet, 
  Tv, Compass, Copy, Check, Share2, AlertCircle, Clock, BarChart3,
  MousePointerClick, Globe, ArrowUpRight, Mail, MessageCircle
} from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

const Analytics = () => {
  const { shortCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);

  const fetchAnalytics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const response = await API.get(`/analytics/${shortCode}`);
      setData(response.data.data);
    } catch (err) {
      if (!isBackground) {
        setError(err.response?.data?.error || 'Failed to load analytics data');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Poll for analytics updates every 5 seconds in the background
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 5000);

    return () => clearInterval(interval);
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

  const shareViaWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out the analytics for this link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareViaEmail = () => {
    const url = window.location.href;
    const subject = `Clixora Analytics - ${shortCode}`;
    const body = `Here are the analytics for the shortened link:\n\n${url}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass-light p-8 rounded-2xl flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'Could not fetch analytics details.'}</p>
          <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary text-white">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { url, trends, devices, browsers, recentVisits } = data;
  const isExpired = url.expiry_date && new Date(url.expiry_date) < new Date();

  const formattedTrends = trends.map(t => ({
    date: new Date(t.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Clicks: parseInt(t.clicks, 10)
  }));

  const deviceData = devices.map(d => ({
    name: d.device,
    value: parseInt(d.count, 10)
  }));

  const browserData = browsers.map(b => ({
    name: b.browser,
    value: parseInt(b.count, 10)
  }));

  const getDeviceIcon = (device) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-pink-500" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-purple-500" />;
      case 'smarttv': return <Tv className="w-4 h-4 text-amber-500" />;
      default: return <Monitor className="w-4 h-4 text-indigo-500" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-light px-3.5 py-2.5 rounded-xl text-xs">
          <p className="font-bold text-gray-700 mb-0.5">{label}</p>
          <p className="text-indigo-600 font-semibold">{payload[0].value} clicks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative page-enter">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 toast-light px-4 py-3 rounded-xl flex items-center space-x-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-semibold text-gray-700">{toast}</span>
        </div>
      )}

      {/* Back */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* URL Overview Card */}
      <div className="glass-light p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glow-border-light" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{url.short_code}</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full pill-indigo">
              {url.click_count} total clicks
            </span>
            {isExpired && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full pill-rose">
                Expired
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium truncate max-w-2xl mb-1">{url.original_url}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {new Date(url.created_at).toLocaleDateString()}
            </span>
            {url.expiry_date && (
              <span className={`flex items-center gap-1 ${isExpired ? 'text-rose-500' : ''}`}>
                <Clock className="w-3.5 h-3.5" />
                Expires {new Date(url.expiry_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => copyShortUrl(url.short_code)}
            className="flex items-center justify-center p-2.5 rounded-xl btn-secondary cursor-pointer"
            title="Copy Short URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold btn-secondary cursor-pointer"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Analytics
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-light rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <button
                  onClick={() => { copyPublicAnalyticsLink(); setShowShareMenu(false); }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 mr-3 text-indigo-500" />
                  Copy Link
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 mr-3 text-emerald-500" />
                  Share via WhatsApp
                </button>
                <button
                  onClick={shareViaEmail}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 mr-3 text-pink-500" />
                  Share via Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <MousePointerClick className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Clicks</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{url.click_count}</div>
          </div>
        </div>

        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl">
            <Clock className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Visited</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5 truncate max-w-[200px]">
              {recentVisits.length > 0 ? new Date(recentVisits[0].visited_at).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Calendar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status / Expiry</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              {isExpired ? (
                <span className="text-rose-500 font-semibold">Expired</span>
              ) : url.expiry_date ? (
                new Date(url.expiry_date).toLocaleDateString()
              ) : (
                <span className="text-emerald-500">Never expires</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Area Chart */}
        <div className="glass-light p-6 rounded-2xl lg:col-span-2 glow-border-light">
          <h3 className="text-base font-bold text-gray-900 mb-4">Click History (Last 14 Days)</h3>
          {formattedTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No visits recorded in this period yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#d1d5db" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#d1d5db" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Clicks" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="glass-light p-6 rounded-2xl glow-border-light">
          <h3 className="text-base font-bold text-gray-900 mb-4">Device Distribution</h3>
          {deviceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
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
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.92)', 
                        borderColor: '#e5e7eb', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full mt-2 grid grid-cols-2 gap-2 text-xs">
                {deviceData.map((d, index) => (
                  <div key={d.name} className="flex items-center space-x-2 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-gray-500 capitalize truncate">{d.name}</span>
                    <span className="font-extrabold text-gray-800 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Browsers & Recent Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Browser List */}
        <div className="glass-light p-6 rounded-2xl glow-border-light">
          <h3 className="text-base font-bold text-gray-900 mb-4">Top Browsers</h3>
          {browserData.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No browser stats recorded yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {browserData.map((b, index) => {
                const totalCount = browserData.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = totalCount > 0 ? ((b.value / totalCount) * 100).toFixed(0) : 0;
                
                return (
                  <div key={b.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        {b.name}
                      </span>
                      <span className="text-gray-400">
                        {b.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${percentage}%`,
                          background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Visit Logs */}
        <div className="glass-light p-6 rounded-2xl lg:col-span-2 glow-border-light">
          <h3 className="text-base font-bold text-gray-900 mb-4">Recent Visits</h3>
          {recentVisits.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No visit logs available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Date & Time</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">IP Address</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Device</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider">Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentVisits.map((visit, index) => (
                    <tr key={index} className="text-gray-600">
                      <td className="py-3 font-semibold text-gray-500">
                        {new Date(visit.visited_at).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-500">{visit.ip_address}</td>
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
