import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp hook
 * Animates a numeric score from 0 (or previous value) to the target value.
 * Strictly respects prefers-reduced-motion: returns the target value instantly
 * with zero animation if the user has requested reduced motion.
 * Total duration capped at 280ms to never delay interaction.
 */
export function useCountUp(target: number, duration: number = 280): number {
  const [value, setValue] = useState<number>(target);
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setValue(target);
      prevTargetRef.current = target;
      return;
    }

    const startValue = prevTargetRef.current;
    const diff = target - startValue;
    if (diff === 0) return;

    let startTime: number | null = null;
    let animFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Smooth ease-out cubic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeOut);

      setValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        setValue(target);
        prevTargetRef.current = target;
      }
    };

    animFrameId = requestAnimationFrame(step);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [target, duration]);

  return value;
}
