import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, PenTool, Bot, Users, BarChart3, 
  X, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import api from '../utils/api.js';
import { updateCurrentUser } from '../redux/authSlice.js';
import confetti from 'canvas-confetti';

export default function BecomeWriterModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close on Escape key & lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose?.();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/users/become-author');
      if (res.data?.user) {
        dispatch(updateCurrentUser(res.data.user));
        
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore confetti errors
        }

        if (onSuccess) {
          onSuccess(res.data.user);
        } else {
          onClose();
          navigate('/editor');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upgrade account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    {
      icon: <PenTool className="w-5 h-5 text-amber-500" />,
      title: 'Interactive Block Editor',
      description: 'Craft beautiful articles with headings, callouts, quotes, and syntax-highlighted code blocks.'
    },
    {
      icon: <Bot className="w-5 h-5 text-amber-400" />,
      title: 'AI Writing & Grammar Studio',
      description: 'Leverage AI rewrites, instant grammar polish, multi-language translation, and smart tags.'
    },
    {
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      title: 'Community & Co-Writing',
      description: 'Publish into community spaces, invite collaborators, and host real-time sprint sessions.'
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
      title: 'Audience Reach & Analytics',
      description: 'Track article impressions, reader claps, newsletter subscribers, and reputation points.'
    }
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/75 backdrop-blur-md p-4 sm:p-6"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center py-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl my-auto overflow-hidden bg-white dark:bg-[#141720] border border-slate-200 dark:border-[#232734] rounded-3xl shadow-xl p-6 sm:p-8"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close modal"
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center space-y-2 mb-6">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-0.5 rounded-full mb-1 border border-amber-500/20">
                  Author Invitation • Free
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  Start Writing on BlogSphere
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Join our community of independent writers, essayists, and thinkers. Share your stories, build an audience, and publish with complete editorial control.
                </p>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              {/* Perks Grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {perks.map((perk, i) => (
                  <div 
                    key={i} 
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0b0d11] border border-slate-200/80 dark:border-[#232734] hover:border-amber-500/40 transition-all space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-[#141720] border border-slate-200 dark:border-[#232734] text-amber-500">
                        {perk.icon}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{perk.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {perk.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Activating Author Privileges...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Writing Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant activation • Retains your bookmarks, reading history, and profile</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
