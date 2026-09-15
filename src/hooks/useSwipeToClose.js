// src/hooks/useSwipeToClose.js
import { useRef, useState } from 'react';

export function useSwipeToClose(onClose, { threshold = 100 } = {}) {
  const [translateY, setTranslateY] = useState(0);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!draggingRef.current) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      setTranslateY(Math.min(diff, 300));
    }
  };

  const handleTouchEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (translateY > threshold) {
      setTranslateY(0);
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  return {
    translateY,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}