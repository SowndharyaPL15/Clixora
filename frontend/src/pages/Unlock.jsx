import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, Unlock as UnlockIcon, AlertCircle, ShieldCheck } from 'lucide-react';

const Unlock = () => {
  const { shortCode } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/urls/unlock/${shortCode}`, { password });

      if (response.data.success && response.data.original_url) {
        setUnlocked(true);
        // Wait a tiny bit for unlock animation, then redirect
        setTimeout(() => {
          window.location.replace(response.data.original_url);
        }, 800);
      } else {
        setError('Verification failed. Invalid response.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Blur Blobs */}
      <div className="aurora-blob-1 top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full blur-3xl opacity-30 bg-indigo-500"></div>
      <div className="aurora-blob-2 bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full blur-3xl opacity-30 bg-pink-500"></div>

      <div className="w-full max-w-[420px] relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            {unlocked ? (
              <UnlockIcon className="w-7 h-7 text-white animate-bounce" strokeWidth={2.5} />
            ) : (
              <Lock className="w-7 h-7 text-white" strokeWidth={2.5} />
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Secure Link Locked
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            This link is password-protected. Enter the passcode to proceed.
          </p>
        </div>

        <div className="glass-light dark:bg-white/5 dark:border-white/10 p-8 rounded-2xl shadow-2xl glow-border-light">
          {error && (
            <div className="mb-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-sm text-rose-700 dark:text-rose-450 font-medium">{error}</span>
            </div>
          )}

          {unlocked ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Access Granted!</h3>
              <p className="text-xs text-gray-400">Redirecting you to the destination...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Link Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-light dark:bg-black/20 dark:text-white dark:border-white/10 block w-full pl-10 pr-3 py-2.5 text-sm"
                    placeholder="Enter link password"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UnlockIcon className="w-4 h-4 mr-2" />
                      Decrypt & Open Link
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unlock;
