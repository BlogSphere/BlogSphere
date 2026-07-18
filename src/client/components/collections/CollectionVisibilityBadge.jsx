import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function CollectionVisibilityBadge({ visibility }) {
  const getBadgeStyle = () => {
    switch (visibility) {
      case 'public':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
          label: 'Public',
          icon: <Eye className="w-3 h-3" />
        };
      case 'unlisted':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
          label: 'Unlisted',
          icon: <EyeOff className="w-3 h-3" />
        };
      case 'private':
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400',
          label: 'Private',
          icon: <Lock className="w-3 h-3" />
        };
    }
  };

  const { bg, label, icon } = getBadgeStyle();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${bg}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
