// src/hooks/usePullToRefresh.js
import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const activeRef = useRef(false);
  const startYRef = useRef(0);
  const distanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY > 5) return;
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
      distanceRef.current = 0;
    };

    const handleTouchMove = (e) => {
      if (!activeRef.current || window.scrollY > 5) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        distanceRef.current = Math.min(diff * 0.5, 120);
        setPulling(true);
        setDistance(distanceRef.current);
      }
    };

    const handleTouchEnd = async () => {
      if (!activeRef.current) return;
      const dist = distanceRef.current;
      activeRef.current = false;
      distanceRef.current = 0;
      setPulling(false);
      setDistance(0);
      if (dist > threshold) {
        try { await onRefreshRef.current(); } catch (_) {}
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold]);

  return { pulling, distance };
}