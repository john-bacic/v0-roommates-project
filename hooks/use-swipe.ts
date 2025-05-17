import { useState, useEffect, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // minimum distance required for swipe
  timeout?: number; // maximum time allowed for swipe
}

export function useSwipe<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
): void {
  const { threshold = 50, timeout = 300 } = options;
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    let startX: number;
    let startY: number;
    let startTime: number;
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime > timeout) return;
      
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontalSwipe && Math.abs(deltaX) >= threshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else if (!isHorizontalSwipe && Math.abs(deltaY) >= threshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers, threshold, timeout]);
}
