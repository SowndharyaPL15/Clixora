import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { 
  Plus, Copy, Check, Trash2, Edit3, ExternalLink, BarChart3, 
  Calendar, QrCode, Search, X, Link as LinkIcon, Upload, Zap, 
  MousePointerClick, Clock, ArrowUpRight, Award, Activity 
} from 'lucide-react';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentUrlId, setCurrentUrlId] = useState(null);

  // Bulk Import State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCsvFile, setBulkCsvFile] = useState(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  // Form Fields
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Active QR Code state
  const [activeQrCode, setActiveQrCode] = useState(null);
  const [quickError, setQuickError] = useState('');

  const fetchUrls = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const response = await API.get('/urls');
      setUrls(response.data.data);
    } catch (err) {
      if (!isBackground) {
        setError('Failed to retrieve URLs');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();

    // Poll for link list and click statistics updates every 5 seconds in the background
    const interval = setInterval(() => {
      fetchUrls(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCopy = (code) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const link = `${backendUrl}/r/${code}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard!');
  };

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    setQuickError('');
    try {
      let url = originalUrl.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      const payload = {
        original_url: url,
        custom_alias: customAlias || undefined,
        expiry_date: expiryDate || undefined,
      };
      await API.post('/urls', payload);
      showToast('Link shortened successfully!');
      
      setOriginalUrl('');
      setCustomAlias('');
      setExpiryDate('');
      
      fetchUrls();
    } catch (err) {
      setQuickError(err.response?.data?.error || 'Shortening failed');
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modalMode === 'create') {
        let url = originalUrl.trim();
        if (url && !/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        const payload = {
          original_url: url,
          custom_alias: customAlias || undefined,
          expiry_date: expiryDate || undefined,
        };
        await API.post('/urls', payload);
        showToast('Link shortened successfully!');
      } else {
        let url = originalUrl.trim();
        if (url && !/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        const payload = {
          original_url: url,
          expiry_date: expiryDate || undefined,
        };
        await API.put(`/urls/${currentUrlId}`, payload);
        showToast('Link updated successfully!');
      }

      closeModal();
      fetchUrls();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!bulkCsvFile) {
      setBulkError('Please select a CSV file first');
      return;
    }

    setBulkUploading(true);
    setBulkError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        const parsedUrls = [];

        let startIndex = 0;
        if (lines[0].toLowerCase().includes('url') || lines[0].toLowerCase().includes('original_url')) {
          startIndex = 1;
        }

        const parseCsvLine = (csvLine) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < csvLine.length; i++) {
            const char = csvLine[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          
          if (result.length > 3) {
            const expiry = result.pop();
            const alias = result.pop();
            const url = result.join(',');
            return [url, alias, expiry];
          }
          return result;
        };

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = parseCsvLine(line);
          const original_url = parts[0];
          const custom_alias = parts[1] || undefined;
          const expiry_date = parts[2] || undefined;

          if (original_url) {
            parsedUrls.push({ original_url, custom_alias, expiry_date });
          }
        }

        if (parsedUrls.length === 0) {
          throw new Error('No valid URLs found in CSV. Expected headers: original_url,custom_alias,expiry_date');
        }

        const response = await API.post('/urls/bulk', { urls: parsedUrls });
        const { processed, results } = response.data;
        
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          showToast(`Bulk complete. Succeeded: ${processed - errors.length}, Failed: ${errors.length}.`);
        } else {
          showToast(`Bulk imported ${processed} URLs successfully!`);
        }

        setIsBulkModalOpen(false);
        setBulkCsvFile(null);
        fetchUrls();
      } catch (err) {
        setBulkError(err.response?.data?.error || err.message || 'Failed to parse CSV');
      } finally {
        setBulkUploading(false);
      }
    };
    reader.readAsText(bulkCsvFile);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortened URL? All visit records will be lost.')) return;
    try {
      await API.delete(`/urls/${id}`);
      showToast('URL deleted successfully!');
      fetchUrls();
    } catch (err) {
      showToast('Failed to delete URL');
    }
  };

  const openEditModal = (url) => {
    setModalMode('edit');
    setCurrentUrlId(url.id);
    setOriginalUrl(url.original_url);
    setCustomAlias(url.custom_alias || '');
    setExpiryDate(url.expiry_date ? new Date(url.expiry_date).toISOString().split('T')[0] : '');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUrlId(null);
    setOriginalUrl('');
    setCustomAlias('');
    setExpiryDate('');
  };

  // Filter URLs
  const filteredUrls = urls.filter((url) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      url.original_url.toLowerCase().includes(searchLower) ||
      url.short_code.toLowerCase().includes(searchLower) ||
      (url.custom_alias && url.custom_alias.toLowerCase().includes(searchLower))
    );
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Stats Computations
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + curr.click_count, 0);
  
  // Find Most Clicked Link
  let mostClicked = null;
  if (urls.length > 0) {
    mostClicked = [...urls].sort((a, b) => b.click_count - a.click_count)[0];
  }

  // Compute Recent Activity logs
  // We'll create list of recent events based on creation dates or visited dates
  const recentActivities = [];
  urls.forEach(url => {
    recentActivities.push({
      type: 'create',
      time: new Date(url.created_at),
      label: `Shortened: ${url.short_code}`,
      description: `Linked to ${url.original_url.substring(0, 35)}...`
    });
    if (url.last_visited) {
      recentActivities.push({
        type: 'visit',
        time: new Date(url.last_visited),
        label: `Visited: ${url.short_code}`,
        description: `Total clicks: ${url.click_count}`
      });
    }
  });
  // Sort activities by time descending
  const sortedActivities = recentActivities
    .sort((a, b) => b.time - a.time)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative page-enter">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 toast-light px-4 py-3 rounded-xl flex items-center space-x-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-semibold text-gray-700">{toast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Shorten links, view analytics, and export details in bulk.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setBulkError('');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold btn-secondary cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk CSV
          </button>
        </div>
      </div>

      {/* Quick Shorten Bar */}
      <div className="glass-light p-6 rounded-2xl mb-8 glow-border-light">
        <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" />
          Quick Shorten Link
        </h2>

        {quickError && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 font-medium">
            {quickError}
          </div>
        )}

        <form onSubmit={handleQuickCreate} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 relative">
            <input
              id="quick-original-url"
              type="text"
              required
              placeholder="Paste your long URL here (e.g. google.com/some/path)..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="input-light w-full px-4 py-3 text-sm"
            />
          </div>
          <div className="lg:col-span-3">
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="input-light w-full px-4 py-3 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <input
              type="date"
              value={expiryDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="input-light w-full px-4 py-3 text-sm text-gray-600"
            />
          </div>
          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-3 rounded-xl text-sm font-bold text-white btn-primary flex items-center justify-center cursor-pointer"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <LinkIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total URLs</div>
            <div className="text-2xl font-black text-gray-900">{totalUrls}</div>
          </div>
        </div>

        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-pink-50 rounded-xl">
            <MousePointerClick className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Clicks</div>
            <div className="text-2xl font-black text-gray-900">{totalClicks}</div>
          </div>
        </div>

        <div className="glass-light p-5 rounded-2xl flex items-center space-x-4 glow-border-light">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Most Clicked Link</div>
            {mostClicked ? (
              <div className="truncate">
                <a 
                  href={`${backendUrl}/r/${mostClicked.short_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-extrabold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group"
                >
                  <span className="truncate">{mostClicked.short_code}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0" />
                </a>
                <div className="text-[11px] text-gray-400">{mostClicked.click_count} clicks</div>
              </div>
            ) : (
              <div className="text-sm font-bold text-gray-500">None</div>
            )}
          </div>
        </div>

        <div className="glass-light p-5 rounded-2xl glow-border-light flex flex-col justify-between">
          <div className="relative flex-grow flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-10 pr-2 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Links Table Layout */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-light rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                Shortened URL Repository
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full pill-indigo">
                {filteredUrls.length} Active links
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredUrls.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">No links found</h3>
                <p className="text-gray-500 text-xs mt-1 max-w-sm">
                  {searchTerm ? "No matching shortened links found." : "Shorten your first URL to begin tracking performance metrics."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                      <th className="py-3 px-6">Original Destination</th>
                      <th className="py-3 px-6">Short Link</th>
                      <th className="py-3 px-6 text-center">Clicks</th>
                      <th className="py-3 px-6">Dates</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredUrls.map((url) => {
                      const shortLink = `${backendUrl}/r/${url.short_code}`;
                      const isExpired = url.expiry_date && new Date(url.expiry_date) < new Date();

                      return (
                        <tr key={url.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-4 px-6 max-w-[240px]">
                            <div className="font-semibold text-gray-800 truncate" title={url.original_url}>
                              {url.original_url}
                            </div>
                            {url.custom_alias && (
                              <span className="mt-1 inline-block text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded pill-indigo">
                                Alias: {url.custom_alias}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <a 
                              href={shortLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-1.5 group w-fit"
                            >
                              <span>{url.short_code}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </a>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-black text-gray-850 px-2 py-1 rounded bg-gray-100/60 text-xs">
                              {url.click_count}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-gray-400 space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-300" />
                              <span>Cr: {new Date(url.created_at).toLocaleDateString()}</span>
                            </div>
                            {url.last_visited ? (
                              <div className="flex items-center gap-1 text-teal-650">
                                <Clock className="w-3 h-3 text-teal-400" />
                                <span>Lt: {new Date(url.last_visited).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-300 italic">No visits yet</div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleCopy(url.short_code)}
                                title="Copy Short URL"
                                className="p-2 rounded-lg bg-white/50 border border-gray-100 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 transition-all cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveQrCode(url.qr_code)}
                                title="View QR Code"
                                className="p-2 rounded-lg bg-white/50 border border-gray-100 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 transition-all cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/analytics/${url.short_code}`}
                                title="View Analytics"
                                className="p-2 rounded-lg bg-white/50 border border-gray-100 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 transition-all"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => openEditModal(url)}
                                title="Edit URL"
                                className="p-2 rounded-lg bg-white/50 border border-gray-100 hover:border-amber-300 text-gray-500 hover:text-amber-600 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(url.id)}
                                title="Delete URL"
                                className="p-2 rounded-lg bg-white/50 border border-gray-100 hover:border-rose-300 text-gray-500 hover:text-rose-500 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-4">
          <div className="glass-light p-5 rounded-2xl glow-border-light border border-gray-100">
            <h2 className="text-sm font-bold text-gray-950 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-pink-500 animate-pulse" />
              Recent Activity
            </h2>

            {sortedActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 italic">
                No recent activity logs available.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {sortedActivities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 items-start relative pl-4">
                    <div className={`w-2.5 h-2.5 rounded-full absolute left-[3px] top-1.5 border-2 border-white ${
                      act.type === 'create' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-teal-500 shadow-teal-500/30'
                    }`}></div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900">{act.label}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{act.description}</div>
                      <div className="text-[9px] text-gray-350 mt-0.5">
                        {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Preview Modal */}
      {activeQrCode && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-light max-w-sm w-full p-6 rounded-2xl text-center relative glow-border-light">
            <button
              onClick={() => setActiveQrCode(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">QR Code</h3>
            <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-lg border border-gray-100">
              <img src={activeQrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-500 mb-4">Scan this QR code to visit the shortened URL.</p>
            <a
              href={activeQrCode}
              download="qrcode.png"
              className="inline-block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white btn-primary"
            >
              Download QR Code
            </a>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && modalMode === 'edit' && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-light max-w-lg w-full p-6 rounded-2xl shadow-2xl relative glow-border-light">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Edit Destination URL
            </h3>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Destination URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/very-long-path-goes-here"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full input-light px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full input-light px-3.5 py-2.5 text-sm text-gray-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-light max-w-md w-full p-6 rounded-2xl shadow-2xl relative glow-border-light">
            <button
              onClick={() => {
                setIsBulkModalOpen(false);
                setBulkCsvFile(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              Bulk Shorten via CSV
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload a CSV file with your URLs. The first column should be the long URL. Optional: custom alias, expiry date.
            </p>

            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 mb-4 text-left text-xs font-mono text-gray-500">
              <span className="text-gray-400 block mb-1">Expected Format:</span>
              original_url,custom_alias,expiry_date<br/>
              https://google.com,my-google,2026-12-31<br/>
              https://katomaran.com,,<br/>
            </div>

            {bulkError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium">
                {bulkError}
              </div>
            )}

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setBulkCsvFile(e.target.files[0])}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkCsvFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary flex items-center justify-center cursor-pointer"
                >
                  {bulkUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Upload & Process'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
