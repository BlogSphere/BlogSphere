import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, Twitter, Linkedin, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { AnimatePresence, motion } from 'framer-motion';

export default function CollectionShareBtn({ collectionTitle, collectionSlug }) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  const shareUrl = `${window.location.origin}/collections/${collectionSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `Check out this curated collection "${collectionTitle}" on BlogSphere!\n${shareUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/80 border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm active:scale-95"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1"
          >
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-550" /> : <Link className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            
            <button
              onClick={shareOnTwitter}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
            >
              <Twitter className="w-3.5 h-3.5 text-sky-400" />
              <span>Share on X</span>
            </button>
            
            <button
              onClick={shareOnLinkedin}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
            >
              <Linkedin className="w-3.5 h-3.5 text-indigo-500" />
              <span>Share on LinkedIn</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
