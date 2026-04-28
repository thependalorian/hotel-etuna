/**
 * Scroll Progress Indicator Component
 * 
 * Purpose: Visual indicator showing page scroll progress
 * Location: /components/ui/ScrollProgress.tsx
 * 
 * Features:
 * - Thin progress bar at top of viewport
 * - Smooth animation following scroll position
 * - Auto-hides when at top of page
 * - Follows Doherty Threshold (instant feedback)
 * 
 * Design System:
 * - Uses primary color for visibility
 * - Fixed position at top
 * - Height: 2px (non-intrusive)
 * 
 * Accessibility:
 * - Non-interactive decorative element
 * - Does not interfere with content
 * 
 * @module ScrollProgress
 */

'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const totalScrollable = documentHeight - windowHeight;
      const progress = totalScrollable > 0 
        ? (scrollTop / totalScrollable) * 100 
        : 0;
      
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    // Initial calculation
    updateScrollProgress();

    // Update on scroll (throttled for performance)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  // Don't show if at top of page
  if (scrollProgress === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50 transition-opacity duration-300"
      style={{ 
        width: `${scrollProgress}%`,
        opacity: scrollProgress > 5 ? 1 : 0 
      }}
      aria-hidden="true"
    />
  );
}
