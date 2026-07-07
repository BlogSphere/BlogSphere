import React, { useState, useEffect } from 'react';
import { DollarSign, Eye, MousePointer, TrendingUp, Sparkles, AlertCircle, Play, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdCenter() {
  const [balance, setBalance] = useState(() => {
    return parseFloat(localStorage.getItem('adsense_balance') || '45.20');
  });
  const [impressions, setImpressions] = useState(() => {
    return parseInt(localStorage.getItem('adsense_impressions') || '1204');
  });
  const [clicks, setClicks] = useState(() => {
    return parseInt(localStorage.getItem('adsense_clicks') || '42');
  });

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  const rpm = clicks > 0 ? ((balance / impressions) * 1000).toFixed(2) : '0.00';

  useEffect(() => {
    localStorage.setItem('adsense_balance', balance.toFixed(2));
    localStorage.setItem('adsense_impressions', impressions.toString());
    localStorage.setItem('adsense_clicks', clicks.toString());
  }, [balance, impressions, clicks]);

  const handleAdClick = (earningsAmount, sponsorName) => {
    setClicks((prev) => prev + 1);
    setBalance((prev) => prev + earningsAmount);
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, context.currentTime); // E5
      osc.frequency.setValueAtTime(880.00, context.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.04, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
      osc.start();
      osc.stop(context.currentTime + 0.25);
    } catch (e) {}
  };

  const resetStats = () => {
    if (window.confirm('Reset all simulated AdSense monetization metrics?')) {
      setBalance(0.00);
      setImpressions(0);
      setClicks(0);
    }
  };

  const incrementImpressions = () => {
    setImpressions(prev => prev + Math.floor(Math.random() * 15) + 5);
  };

  useEffect(() => {
    // Simulate organic background traffic impressions
    const timer = setInterval(() => {
      setImpressions((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const adUnits = [
    {
      id: 'ad-1',
      title: 'Interactive Responsive Web Apps',
      description: 'Build fast, high-performance UI components with Google Cloud services.',
      sponsor: 'Google Cloud Platform',
      reward: 0.75,
      bg: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30',
      tagColor: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
      bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'ad-2',
      title: 'Accelerate Developer Workflows',
      description: 'Deploy docker containers globally in seconds with next-gen edge hosting networks.',
      sponsor: 'Vercel Edge Host',
      reward: 1.15,
      bg: 'from-slate-900/10 to-slate-950/10 border-slate-500/30',
      tagColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      bannerUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'ad-3',
      title: 'Learn AI Modeling Free',
      description: 'Master large language models and neural architectures from leading experts.',
      sponsor: 'DeepMind Education',
      reward: 1.45,
      bg: 'from-purple-500/10 to-pink-500/10 border-purple-500/30',
      tagColor: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
      bannerUrl: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            <span>BlogSphere AdSense Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Monetize content, track metrics, click ads to generate simulated earnings.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={incrementImpressions}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Traffic</span>
          </button>
          <button
            onClick={resetStats}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400 text-xs font-bold rounded-xl transition-all"
          >
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-500/5 to-indigo-500/5 dark:from-primary-950/10 dark:to-indigo-950/10 border border-primary-100/50 dark:border-primary-900/20 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Balance</span>
            <DollarSign className="w-5 h-5 text-primary-550" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-850 dark:text-white">${balance.toFixed(2)}</span>
            <span className="block text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Fully Liquid simulated
            </span>
          </div>
        </div>

        {/* Impressions Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Impressions</span>
            <Eye className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-850 dark:text-white">{impressions.toLocaleString()}</span>
            <span className="block text-[10px] text-slate-400 mt-1">Organic page views</span>
          </div>
        </div>

        {/* Clicks Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ad Clicks</span>
            <MousePointer className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-850 dark:text-white">{clicks}</span>
            <span className="block text-[10px] text-slate-400 mt-1">Conversions triggered</span>
          </div>
        </div>

        {/* Click Thru Rate Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">CTR & RPM</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-850 dark:text-white">{ctr}%</span>
            <span className="block text-[10px] text-slate-400 mt-1">eCPM: ${rpm}</span>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ads Showcase Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Click to Generate Simulated Revenue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Clicking on any sponsor banner triggers conversions and earns simulated wallet credits instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adUnits.map((ad) => (
              <div
                key={ad.id}
                onClick={() => handleAdClick(ad.reward, ad.sponsor)}
                className={`group cursor-pointer border rounded-3xl overflow-hidden bg-gradient-to-br ${ad.bg} hover:scale-[1.02] hover:shadow-md transition-all flex flex-col justify-between`}
              >
                {/* Visual Ad Banner */}
                <div className="h-32 overflow-hidden relative">
                  <img src={ad.bannerUrl} alt={ad.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-2 right-2 bg-slate-950/70 backdrop-blur text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Sponsored
                  </span>
                </div>

                {/* Ad Description */}
                <div className="p-5 space-y-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${ad.tagColor}`}>
                    {ad.sponsor}
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-primary-655 transition-colors line-clamp-1">
                    {ad.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                    {ad.description}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800/40 text-[10px] text-slate-455 font-bold uppercase">
                    <span>CPC Value</span>
                    <span className="text-emerald-500 font-extrabold text-xs">+${ad.reward.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AdSense Info Insights */}
        <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AdSense Insights</h3>
            <p className="text-xs text-slate-400 mt-0.5">Learn how monetization works in BlogSphere.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">How to earn</h4>
                <p className="text-xs text-slate-450 mt-0.5 leading-relaxed">We place context-matching ad banners inside published article pages. When readers interact with these slots organically, earnings grow.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Simulate Impressions</h4>
                <p className="text-xs text-slate-450 mt-0.5 leading-relaxed">Organic views increment organically every few seconds. You can also trigger rapid automated page views by clicking "Simulate Traffic".</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Ad Block Shield</h4>
                <p className="text-xs text-slate-450 mt-0.5 leading-relaxed">Disable local ad-blockers if simulated banner ad views fail to display within post details.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-700 dark:bg-amber-950/15 dark:border-amber-900/30 dark:text-amber-450 text-xs flex gap-2.5 items-start leading-relaxed">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-semibold block">Simulated Integration Sandbox</span>
              This center operates in a client-side simulation. Earnings are saved in local storage and do not represent physical currency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
