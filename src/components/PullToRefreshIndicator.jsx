import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefreshIndicator({ pulling, distance, threshold = 80 }) {
  if (!pulling) return null;
  const progress = Math.min(distance / threshold, 1);
  const ready = distance > threshold;
  return (
    <div 
      className="fixed left-1/2 z-[60] pointer-events-none"
      style={{ 
        top: `${Math.min(distance * 0.6, 70)}px`, 
        transform: 'translateX(-50%)',
        transition: 'none'
      }}>
      <div className={`w-11 h-11 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-colors ${ready ? 'bg-emerald-600' : 'bg-[#001757]'}`}>
        <RefreshCw 
          className="w-5 h-5 text-white"
          style={{ 
            transform: `rotate(${progress * 360}deg)`, 
            transition: 'transform 0.05s linear' 
          }}
        />
      </div>
    </div>
  );
}