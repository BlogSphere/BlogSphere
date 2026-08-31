import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import socket from '../utils/socket.js';

export default function Stats24hBadge({ className = '' }) {
  const [stats, setStats] = useState({ articles: 0, writers: 0, is24hOnly: false });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/blogs/24h-stats');
      if (res.data) {
        setStats({
          articles: res.data.articles ?? 0,
          writers: res.data.writers ?? 0,
          is24hOnly: !!res.data.is24hOnly
        });
      }
    } catch (err) {
      console.error('Failed to fetch 24h stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);

    // Listen to real-time socket updates when new articles are published
    socket.on('stats_updated', fetchStats);

    return () => {
      clearInterval(interval);
      socket.off('stats_updated', fetchStats);
    };
  }, []);

  return (
    <div
      title="Live database activity statistics"
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-900 select-none ${className}`}
    >
      <span className="font-medium text-slate-500 dark:text-slate-400 tracking-tight">Last 24h:</span>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {loading ? '...' : stats.articles.toLocaleString()}
          <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">articles</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-bold text-slate-900 dark:text-slate-100 ml-1">
          {loading ? '...' : stats.writers.toLocaleString()}
          <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">writers</span>
        </span>
      </div>
    </div>
  );
}
