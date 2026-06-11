import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { 
  Plus, Copy, Check, Trash2, Edit3, ExternalLink, BarChart3, 
  Calendar, QrCode, Search, RefreshCw, X, Link as LinkIcon, Upload
} from 'lucide-react';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
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

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await API.get('/urls');
      setUrls(response.data.data);
    } catch (err) {
      setError('Failed to retrieve URLs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
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

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modalMode === 'create') {
        const payload = {
          original_url: originalUrl,
          custom_alias: customAlias || undefined,
          expiry_date: expiryDate || undefined,
        };
        await API.post('/urls', payload);
        showToast('Shortened link created successfully!');
      } else {
        const payload = {
          original_url: originalUrl,
          expiry_date: expiryDate || undefined,
        };
        await API.put(`/urls/${currentUrlId}`, payload);
        showToast('Shortened link updated successfully!');
      }

      // Reset & Refresh
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

        // CSV columns: original_url,custom_alias,expiry_date
        let startIndex = 0;
        if (lines[0].toLowerCase().includes('url') || lines[0].toLowerCase().includes('original_url')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          const original_url = parts[0]?.trim();
          const custom_alias = parts[1]?.trim() || undefined;
          const expiry_date = parts[2]?.trim() || undefined;

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

  const openCreateModal = () => {
    setModalMode('create');
    setOriginalUrl('');
    setCustomAlias('');
    setExpiryDate('');
    setError('');
    setIsModalOpen(true);
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
  };

  // Filter URLs based on search query
  const filteredUrls = urls.filter((url) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      url.original_url.toLowerCase().includes(searchLower) ||
      url.short_code.toLowerCase().includes(searchLower) ||
      (url.custom_alias && url.custom_alias.toLowerCase().includes(searchLower))
    );
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-violet-500/30 text-violet-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Shortened Links</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and inspect analytics for your active short links.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setBulkError('');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Shorten URL
          </button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="glass p-4 rounded-2xl border border-slate-800/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by original URL or alias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
          />
        </div>
        <div className="flex items-center space-x-6 text-sm text-slate-400">
          <div>
            Total Links: <span className="font-semibold text-violet-400">{urls.length}</span>
          </div>
          <div>
            Total Clicks: <span className="font-semibold text-fuchsia-400">{urls.reduce((acc, curr) => acc + curr.click_count, 0)}</span>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="glass p-16 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 mb-4">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No links found</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            {searchTerm ? "We couldn't find any URLs matching your search query." : "Shorten your first long URL to see it displayed here."}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-white transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUrls.map((url) => {
            const shortLink = `${backendUrl}/r/${url.short_code}`;
            const isExpired = url.expiry_date && new Date(url.expiry_date) < new Date();

            return (
              <div 
                key={url.id} 
                className="glass p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <a 
                      href={shortLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-lg font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 group"
                    >
                      {url.short_code}
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {url.custom_alias && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-950/50 border border-fuchsia-800/30 text-fuchsia-300">
                        Alias
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-950/50 border border-red-800/30 text-red-300">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-300 truncate max-w-xl mb-1">
                    {url.original_url}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created {new Date(url.created_at).toLocaleDateString()}
                    </span>
                    {url.expiry_date && (
                      <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        Expires {new Date(url.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {/* Click Badge */}
                  <div className="text-center px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-xl">
                    <div className="text-xs text-slate-400">Clicks</div>
                    <div className="text-base font-extrabold text-white">{url.click_count}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(url.short_code)}
                      title="Copy Short URL"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-violet-500/50 text-slate-300 hover:text-violet-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveQrCode(url.qr_code)}
                      title="View QR Code"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-violet-500/50 text-slate-300 hover:text-violet-400 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/analytics/${url.short_code}`}
                      title="View Analytics"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-violet-500/50 text-slate-300 hover:text-violet-400 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(url)}
                      title="Edit URL"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-violet-500/50 text-slate-300 hover:text-violet-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(url.id)}
                      title="Delete URL"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-red-500/30 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Preview Modal */}
      {activeQrCode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-slate-800 text-center relative">
            <button
              onClick={() => setActiveQrCode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Shortened URL QR Code</h3>
            <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-xl">
              <img src={activeQrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-slate-400 mb-4">Scan this QR Code to redirect directly to the long destination URL.</p>
            <a
              href={activeQrCode}
              download="qrcode.png"
              className="inline-block w-full text-center py-2 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              Download QR Code Image
            </a>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full p-6 rounded-2xl border border-slate-850 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Shorten a new long URL' : 'Edit destination URL'}
            </h3>

            {error && (
              <div className="mb-4 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Destination URL (Long URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very-long-path-goes-here"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Custom Alias (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. my-awesome-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Only letters, numbers, hyphens, and underscores.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-btn"
                >
                  {modalMode === 'create' ? 'Create Link' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-slate-850 shadow-2xl relative">
            <button
              onClick={() => {
                setIsBulkModalOpen(false);
                setBulkCsvFile(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-400" />
              Bulk Shorten via CSV
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a CSV file containing your links. The first column should be the long destination URL. Optional columns: custom alias, and expiry date.
            </p>

            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-4 mb-4 text-left text-xs font-mono text-slate-400">
              <span className="text-slate-500 block mb-1">Expected Format Example (No spaces around commas):</span>
              original_url,custom_alias,expiry_date<br/>
              https://google.com,my-google,2026-12-31<br/>
              https://katomaran.com,,<br/>
            </div>

            {bulkError && (
              <div className="mb-4 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs text-red-200">
                {bulkError}
              </div>
            )}

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setBulkCsvFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-950/50 file:text-violet-300 hover:file:bg-violet-900/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkCsvFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-btn flex items-center justify-center"
                >
                  {bulkUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Upload and Process'
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
