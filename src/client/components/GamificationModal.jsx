import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trophy, Flame, Zap, Award, Star, CheckCircle2, Lock, X, 
  Sparkles, BookOpen, PenTool, MessageSquare, Mic
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../utils/api.js';

export default function GamificationModal({ isOpen, onClose, userId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchGamification = async () => {
    setLoading(true);
    try {
      const url = userId ? `/api/users/${userId}/gamification` : '/api/users/gamification';
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load gamification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGamification();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const badges = data?.badges || [];
  const filteredBadges = activeCategory === 'all' 
    ? badges 
    : activeCategory === 'unlocked'
    ? badges.filter(b => b.unlocked)
    : badges.filter(b => b.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All Badges' },
    { id: 'unlocked', label: `Unlocked (${data?.unlockedBadgesCount || 0})` },
    { id: 'writing', label: 'Writing' },
    { id: 'reading', label: 'Reading' },
    { id: 'streaks', label: 'Streaks' },
    { id: 'community', label: 'Community' },
  ];

  const triggerCelebrate = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/75 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div 
          className="relative w-full max-w-xl sm:max-w-2xl bg-white dark:bg-[#12151d] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Level & Streak (Fixed, shrink-0) */}
          <div className="shrink-0 relative p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-slate-100/90 dark:via-slate-900/90 to-slate-50 dark:to-[#0f1219] border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors z-10 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-4 pr-8">
              <div className="flex items-center gap-3.5">
                <div 
                  onClick={triggerCelebrate}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  title="Click for celebration confetti!"
                >
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Level {data?.level || 1}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {data?.levelTitle || 'Novice Scribe'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">
                    Milestones & Streaks
                  </h2>
                </div>
              </div>

              {/* Streak Counter Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#1a1e2b] border border-amber-500/30 shadow-xs shrink-0">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <div className="text-left">
                  <div className="text-xs font-black text-slate-900 dark:text-white leading-none">
                    {data?.streak?.current || 1}d Streak
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                    Best: {data?.streak?.longest || 1}d
                  </div>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{data?.xp || 0} Total XP</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                  {data?.nextLevelXp ? `${data.xp} / ${data.nextLevelXp} XP to Level ${(data?.level || 1) + 1}` : 'Max Level'}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${data?.progressPercent || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category Filters (shrink-0) */}
          <div className="shrink-0 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#10131b] flex items-center gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Badges Grid (flex-1 min-h-0: scrolls internally without pushing modal boundaries) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400 animate-pulse text-sm">
                Loading achievements & badges...
              </div>
            ) : filteredBadges.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No badges found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-950/10 dark:to-[#161a24] border-amber-500/30 shadow-xs hover:border-amber-500/60'
                        : 'bg-slate-50/60 dark:bg-[#10131c]/60 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                      badge.unlocked 
                        ? 'bg-white dark:bg-[#1b202e] border border-amber-500/20' 
                        : 'bg-slate-200 dark:bg-slate-800 grayscale'
                    }`}>
                      {badge.unlocked ? badge.icon : '🔒'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {badge.name}
                        </h4>
                        {badge.unlocked && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {badge.description}
                      </p>
                      {badge.unlocked && badge.unlockedAt && (
                        <span className="block text-[9px] text-slate-400 mt-1 font-medium">
                          Earned on {new Date(badge.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: How to Earn XP */}
          <div className="shrink-0 p-3.5 px-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c0f16] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium flex-wrap">
              <span className="flex items-center gap-1"><PenTool className="w-3 h-3 text-amber-500" /> Write (+100 XP)</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-amber-500" /> Read (+15 XP)</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-amber-500" /> Comment (+25 XP)</span>
              <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-amber-500" /> Voice (+25 XP)</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:opacity-90 transition-opacity ml-auto cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
