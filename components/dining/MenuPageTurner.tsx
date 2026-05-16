/**
 * Realistic menu book page-turn — click, drag, keyboard; 3D CSS transforms.
 * Location: components/dining/MenuPageTurner.tsx
 */

'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type MenuBookPage = {
  id: string;
  front: ReactNode;
  back: ReactNode;
};

type MenuPageTurnerProps = {
  pages: MenuBookPage[];
  initialSpread?: number;
  /** Reset book when category changes */
  bookKey?: string;
  getSpreadLabel?: (spreadIndex: number, totalSpreads: number) => string;
};

type FlipState = {
  currentSpread: number;
  isFlipping: boolean;
  direction: 'forward' | 'backward' | null;
  flipAngle: number;
};

function getSheetIndexForFlip(
  currentSpread: number,
  direction: 'forward' | 'backward',
  totalSheets: number,
): number | null {
  if (direction === 'forward' && currentSpread < totalSheets) return currentSpread;
  if (direction === 'backward' && currentSpread > 0) return currentSpread - 1;
  return null;
}

export default function MenuPageTurner({
  pages,
  initialSpread = 0,
  bookKey,
  getSpreadLabel,
}: MenuPageTurnerProps) {
  const [state, setState] = useState<FlipState>({
    currentSpread: initialSpread,
    isFlipping: false,
    direction: null,
    flipAngle: 0,
  });

  const sheetRef = useRef<HTMLDivElement>(null);
  const startPointer = useRef<{ x: number; y: number } | null>(null);
  const startAngle = useRef(0);
  const dragDirection = useRef<'forward' | 'backward'>('forward');
  const clickAnimating = useRef(false);

  const totalSheets = pages.length;
  const maxSpread = totalSheets;

  useEffect(() => {
    setState({
      currentSpread: initialSpread,
      isFlipping: false,
      direction: null,
      flipAngle: 0,
    });
    startPointer.current = null;
    clickAnimating.current = false;
  }, [bookKey, initialSpread]);

  const leftContent =
    state.currentSpread > 0 ? pages[state.currentSpread - 1]?.back : null;
  const rightContent =
    state.currentSpread < totalSheets ? pages[state.currentSpread]?.front : null;

  const activeSheetIndex =
    state.direction !== null
      ? getSheetIndexForFlip(state.currentSpread, state.direction, totalSheets)
      : null;
  const activeSheet = activeSheetIndex !== null ? pages[activeSheetIndex] : null;

  const completeFlip = useCallback(() => {
    setState((prev) => {
      if (prev.direction === 'forward') {
        return {
          currentSpread: prev.currentSpread + 1,
          isFlipping: false,
          direction: null,
          flipAngle: 0,
        };
      }
      if (prev.direction === 'backward') {
        return {
          currentSpread: prev.currentSpread - 1,
          isFlipping: false,
          direction: null,
          flipAngle: 0,
        };
      }
      return prev;
    });
    clickAnimating.current = false;
  }, []);

  const startFlip = useCallback(
    (direction: 'forward' | 'backward') => {
      const sheetIdx = getSheetIndexForFlip(state.currentSpread, direction, totalSheets);
      if (sheetIdx === null || state.isFlipping) return;

      clickAnimating.current = true;
      const start = direction === 'forward' ? 0 : 180;
      setState((prev) => ({
        ...prev,
        isFlipping: true,
        direction,
        flipAngle: start,
      }));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setState((prev) => ({
            ...prev,
            flipAngle: direction === 'forward' ? -180 : 0,
          }));
        });
      });
    },
    [state.currentSpread, state.isFlipping, totalSheets],
  );

  const handleFlipTransitionEnd = useCallback(() => {
    if (!state.isFlipping || state.direction === null) return;

    const startAngleForDir = state.direction === 'forward' ? 0 : 180;
    if (Math.abs(state.flipAngle - startAngleForDir) < 1) {
      setState((prev) => ({
        ...prev,
        isFlipping: false,
        direction: null,
        flipAngle: 0,
      }));
      clickAnimating.current = false;
      return;
    }
    completeFlip();
  }, [state.isFlipping, state.direction, state.flipAngle, completeFlip]);

  const handlePointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    direction: 'forward' | 'backward',
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const sheetIdx = getSheetIndexForFlip(state.currentSpread, direction, totalSheets);
    if (sheetIdx === null || state.isFlipping) return;

    startPointer.current = { x: e.clientX, y: e.clientY };
    startAngle.current = direction === 'forward' ? 0 : 180;
    dragDirection.current = direction;
    clickAnimating.current = false;

    setState((prev) => ({
      ...prev,
      isFlipping: true,
      direction,
      flipAngle: startAngle.current,
    }));

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent | PointerEvent) => {
      if (!startPointer.current || !state.isFlipping) return;

      const deltaX = e.clientX - startPointer.current.x;
      const sensitivity = 0.5;
      let newAngle = startAngle.current;

      if (dragDirection.current === 'forward') {
        newAngle = Math.min(0, Math.max(-180, startAngle.current + deltaX * sensitivity));
      } else {
        newAngle = Math.min(180, Math.max(0, startAngle.current + deltaX * sensitivity));
      }

      setState((prev) => ({ ...prev, flipAngle: newAngle }));
    },
    [state.isFlipping],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent | PointerEvent) => {
      if (!startPointer.current || !state.isFlipping) return;

      const threshold = 90;
      const deltaAngle = Math.abs(state.flipAngle - startAngle.current);
      const crossed = deltaAngle >= threshold;

      if (crossed) {
        const finalAngle = dragDirection.current === 'forward' ? -180 : 0;
        setState((prev) => ({ ...prev, flipAngle: finalAngle }));
      } else {
        const snapAngle = dragDirection.current === 'forward' ? 0 : 180;
        setState((prev) => ({ ...prev, flipAngle: snapAngle }));
      }

      if (e.target instanceof HTMLElement && 'pointerId' in e) {
        try {
          (e.target as HTMLElement).releasePointerCapture((e as ReactPointerEvent).pointerId);
        } catch {
          /* capture may already be released */
        }
      }
      startPointer.current = null;
    },
    [state.flipAngle, state.isFlipping],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e);
    const onUp = (e: PointerEvent) => handlePointerUp(e);
    if (state.isFlipping && startPointer.current) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [state.isFlipping, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        startFlip('forward');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        startFlip('backward');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startFlip]);

  const isDragging = startPointer.current !== null;
  const sheetOffsetLeft = state.direction === 'forward' ? '50%' : '0%';
  const transformOrigin = state.direction === 'forward' ? 'left center' : 'right center';
  const animateTransition = !isDragging && (clickAnimating.current || !startPointer.current);

  const progress =
    state.direction === 'forward'
      ? Math.abs(state.flipAngle) / 180
      : (180 - state.flipAngle) / 180;

  const spreadLabel =
    getSpreadLabel?.(state.currentSpread, maxSpread + 1) ??
    `Page ${state.currentSpread + 1} of ${maxSpread + 1}`;

  if (totalSheets === 0) return null;

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      <div
        className="relative [perspective:1500px]"
        role="region"
        aria-label="Digital menu book"
      >
        <div className="relative flex h-[min(80vh,640px)] min-h-[420px] w-full overflow-hidden rounded-lg bg-[#f5f0e8] shadow-[0_4px_24px_rgba(45,35,28,0.28)]">
          <div
            className={cn(
              'relative flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3',
              'bg-linear-to-r from-[#e8e0d5] to-[#f5f0e8] shadow-[inset_-4px_0_6px_rgba(0,0,0,0.05)]',
            )}
          >
            {state.isFlipping && state.direction === 'forward'
              ? pages[state.currentSpread]?.back
              : leftContent}
          </div>
          <div
            className={cn(
              'relative flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3',
              'bg-linear-to-l from-[#e8e0d5] to-[#f5f0e8] shadow-[inset_4px_0_6px_rgba(0,0,0,0.05)]',
            )}
          >
            {state.isFlipping && state.direction === 'backward'
              ? pages[state.currentSpread - 1]?.front
              : rightContent}
          </div>

          {state.isFlipping && activeSheet ? (
            <div
              ref={sheetRef}
              className="absolute top-0 z-10 h-full w-1/2 touch-none"
              style={{
                left: sheetOffsetLeft,
                transform: `rotateY(${state.flipAngle}deg)`,
                transformOrigin,
                transformStyle: 'preserve-3d',
                transition: animateTransition
                  ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
              }}
              onTransitionEnd={handleFlipTransitionEnd}
              onPointerDown={(e) => state.direction && handlePointerDown(e, state.direction)}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <div className="h-full w-full overflow-hidden rounded-sm bg-linear-to-br from-[#fefefe] to-[#f9f6f0] shadow-[0_0_12px_rgba(0,0,0,0.18)]">
                  {activeSheet.front}
                </div>
              </div>
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="h-full w-full overflow-hidden rounded-sm bg-linear-to-br from-[#fefefe] to-[#f9f6f0] shadow-[0_0_12px_rgba(0,0,0,0.18)]">
                  {activeSheet.back}
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0 z-[11]"
                style={{
                  background: `linear-gradient(to right, rgba(0,0,0,${Math.sin(progress * Math.PI) * 0.15}) 0%, transparent 30%)`,
                }}
                aria-hidden
              />
            </div>
          ) : null}

          {!state.isFlipping ? (
            <>
              <button
                type="button"
                className="absolute left-0 top-0 z-[5] h-full w-[18%] cursor-w-resize bg-transparent"
                aria-label="Turn page back"
                disabled={state.currentSpread === 0}
                onClick={() => startFlip('backward')}
              />
              <button
                type="button"
                className="absolute right-0 top-0 z-[5] h-full w-[18%] cursor-e-resize bg-transparent"
                aria-label="Turn page forward"
                disabled={state.currentSpread === maxSpread}
                onClick={() => startFlip('forward')}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="btn btn-sm gap-1 border-terracotta-300 bg-terracotta-800 text-white hover:bg-terracotta-900"
          disabled={state.currentSpread === 0 || state.isFlipping}
          onClick={() => startFlip('backward')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </button>
        <span className="min-w-[10rem] text-center font-display text-sm text-terracotta-800">
          {spreadLabel}
        </span>
        <button
          type="button"
          className="btn btn-sm gap-1 border-terracotta-300 bg-khaki-600 text-white hover:bg-khaki-700"
          disabled={state.currentSpread === maxSpread || state.isFlipping}
          onClick={() => startFlip('forward')}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
