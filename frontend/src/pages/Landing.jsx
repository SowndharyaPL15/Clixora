import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, Link as LinkIcon, BarChart3, QrCode, Upload, Shield, 
  ArrowRight, CheckCircle, Globe, Users, Smile, HelpCircle 
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative page-enter z-10">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full pill-indigo mb-6 animate-bounce">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider">The Ultimate Link Management Platform</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-none mb-6">
          Shorten. Share. <br />
          <span className="gradient-text-light">Track in Real-Time.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          Create short, memorable links, generate QR codes instantly, and view deep analytics to optimize your reach. Built for creators, developers, and growing brands.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white btn-primary flex items-center justify-center cursor-pointer"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white btn-primary flex items-center justify-center cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold btn-secondary flex items-center justify-center cursor-pointer"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Platform Features Section */}
      <div className="py-16 border-t border-gray-100">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">Platform Features</h2>
          <p className="text-gray-500 text-sm mt-2">Everything you need to optimize and analyze your links.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card-light p-6 rounded-2xl glow-border-light flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-5">
              <LinkIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Short Links & Custom Aliases</h3>
            <p className="text-gray-500 text-sm leading-relaxed flex-grow">
              Create clean, standard links or customize them with readable aliases for custom branding.
            </p>
          </div>

          <div className="glass-card-light p-6 rounded-2xl glow-border-light flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Granular Analytics</h3>
            <p className="text-gray-500 text-sm leading-relaxed flex-grow">
              Track real-time daily click counts, device types, browser types, and recent traffic logs.
            </p>
          </div>

          <div className="glass-card-light p-6 rounded-2xl glow-border-light flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 mb-5">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">QR Code Generation</h3>
            <p className="text-gray-500 text-sm leading-relaxed flex-grow">
              Download beautiful, automatically generated base64 QR codes matching each shortened link.
            </p>
          </div>

          <div className="glass-card-light p-6 rounded-2xl glow-border-light flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-5">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bulk CSV Import</h3>
            <p className="text-gray-500 text-sm leading-relaxed flex-grow">
              Import hundreds of destination URLs simultaneously via a simple CSV payload.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-16 border-t border-gray-100 bg-white/40 rounded-3xl px-8 my-8 glass-light">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900">How Clixora Works</h2>
          <p className="text-gray-500 text-sm mt-2">Get up and running in three simple steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center relative">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-md">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Paste & Customize</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              Drop in your long URL. Option to specify a custom alias or set an optional expiration date.
            </p>
          </div>

          <div className="text-center relative">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 font-extrabold flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-md">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Deploy & Share</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              Copy your short code or download the QR code to post across your social channels or applications.
            </p>
          </div>

          <div className="text-center relative">
            <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 font-extrabold flex items-center justify-center mx-auto mb-4 border border-pink-100 shadow-md">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Track & Adapt</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              Log into your user dashboard to view detailed, interactive visual charts analyzing click behaviors.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-6">
              Grow Your Audience With <br />
              <span className="gradient-text-light">Advanced Link Management</span>
            </h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-8">
              Clixora helps you understand which campaigns or platforms perform best. By measuring click distributions, you can save marketing budget and focus resources on what actually brings clicks.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-gray-700">Completely secure user sessions with JWT encryption</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-gray-700">100% responsive and stunning SaaS glassmorphism dashboard</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-gray-700">High speed server-side redirects (302 redirects)</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-light p-6 rounded-2xl glow-border-light text-center">
              <Globe className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-xl font-black text-gray-900">99.9%</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">Uptime SLA</div>
            </div>
            <div className="glass-light p-6 rounded-2xl glow-border-light text-center">
              <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-xl font-black text-gray-900">Secure</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">JWT Hashing</div>
            </div>
            <div className="glass-light p-6 rounded-2xl glow-border-light text-center">
              <Users className="w-8 h-8 text-pink-500 mx-auto mb-3" />
              <div className="text-xl font-black text-gray-900">10k+</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">Links Created</div>
            </div>
            <div className="glass-light p-6 rounded-2xl glow-border-light text-center">
              <Smile className="w-8 h-8 text-teal-500 mx-auto mb-3" />
              <div className="text-xl font-black text-gray-900">Easy</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">UI Scaffolding</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="border-t border-gray-200 mt-16 pt-8 text-center text-sm text-gray-400">
        <div className="flex justify-center items-center space-x-2.5 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-lg">
            <span className="text-gray-900">Clix</span>
            <span className="gradient-text-light">ora</span>
          </span>
        </div>
        <p className="mb-2">© {new Date().getFullYear()} Clixora Inc. All rights reserved.</p>
        <p className="text-xs">Built for optimal performance and real-time click tracking.</p>
      </footer>
    </div>
  );
};

export default Landing;
