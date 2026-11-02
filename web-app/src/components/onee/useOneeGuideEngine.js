import { useState, useEffect, useCallback, useRef } from 'react';
import { GUIDE_STEPS } from './oneeGuideSteps';

/**
 * useOneeGuideEngine.js
 * Headless controller for Onee's interactive visual walkthrough.
 * Strictly state-driven. No timer-based fake progression.
 * Observes real CyberGuard form state, manages target measurement,
 * smooth scrolling, user focus tracking, and seamless progression.
 */
export function useOneeGuideEngine(formState = {}) {
  const [isActive, setIsActive] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isValidationError, setIsValidationError] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const scrollTimeoutRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const lastCompletedStepRef = useRef(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const currentStep = GUIDE_STEPS[currentStepIndex] || null;

  // Measure target element position in viewport
  const updateTargetRect = useCallback(() => {
    if (!currentStep || !currentStep.target || typeof document === 'undefined') {
      setTargetRect(null);
      return;
    }

    try {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTargetRect(null);
      }
    } catch (_e) {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Bring target element smoothly into comfortable viewport position
  const scrollToTarget = useCallback((selector) => {
    if (!selector || typeof document === 'undefined') return;
    try {
      const el = document.querySelector(selector);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const isComfortable = (
        rect.top >= 70 &&
        rect.bottom <= (window.innerHeight - 70)
      );

      if (!isComfortable) {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center'
        });
      }

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        updateTargetRect();
      }, prefersReducedMotion ? 20 : 380);
    } catch (_e) {}
  }, [prefersReducedMotion, updateTargetRect]);

  // When step changes, scroll and measure
  useEffect(() => {
    if (!isActive || !currentStep) return;

    setIsValidationError(false);
    setValidationMessage('');

    if (currentStep.target) {
      scrollToTarget(currentStep.target);
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex, currentStep, scrollToTarget]);

  // Update target rect on window scroll and resize
  useEffect(() => {
    if (!isActive) return;

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isActive, updateTargetRect]);

  // Listen for keyboard Escape to dismiss / pause guide
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Detect when user focuses directly into any form target element and dock Onee there!
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFocusIn = (e) => {
      const targetEl = e.target.closest('[data-onee-target]');
      if (targetEl) {
        const targetAttr = targetEl.getAttribute('data-onee-target');
        const matchedIndex = GUIDE_STEPS.findIndex(
          (s) => s.target === `[data-onee-target="${targetAttr}"]`
        );
        if (matchedIndex !== -1 && matchedIndex !== currentStepIndex) {
          setIsActive(true);
          setCurrentStepIndex(matchedIndex);
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [currentStepIndex]);

  // Check if current step is completed based on live form state
  const isCurrentStepCompleted = Boolean(
    currentStep?.isCompleted ? currentStep.isCompleted(formState) : false
  );

  // Progression function to advance to next applicable step
  const advanceToNext = useCallback(() => {
    let nextIdx = currentStepIndex + 1;
    // Skip conditional steps if not applicable (e.g. UTR if lostMoney is false)
    while (
      nextIdx < GUIDE_STEPS.length - 1 &&
      GUIDE_STEPS[nextIdx].condition &&
      !GUIDE_STEPS[nextIdx].condition(formState)
    ) {
      nextIdx++;
    }
    if (nextIdx < GUIDE_STEPS.length) {
      setCurrentStepIndex(nextIdx);
    }
  }, [currentStepIndex, formState]);

  // State-driven progression: wait for user action, then advance
  useEffect(() => {
    if (!isActive || !currentStep || currentStep.isIntro || currentStep.isFinal) return;

    if (isCurrentStepCompleted) {
      if (lastCompletedStepRef.current === currentStep.id) return;
      lastCompletedStepRef.current = currentStep.id;

      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      // Give user ~850ms to register completion before Onee glides to next element
      advanceTimeoutRef.current = setTimeout(() => {
        advanceToNext();
      }, 850);
    } else {
      lastCompletedStepRef.current = null;
    }

    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, [isCurrentStepCompleted, isActive, currentStep, advanceToNext]);

  // Manual actions
  const startGuide = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
    lastCompletedStepRef.current = null;
  }, []);

  const stopGuide = useCallback(() => {
    setIsActive(false);
    setTargetRect(null);
  }, []);

  const jumpToTarget = useCallback((targetSelector) => {
    const idx = GUIDE_STEPS.findIndex((s) => s.target === targetSelector);
    if (idx !== -1) {
      setIsActive(true);
      setCurrentStepIndex(idx);
    }
  }, []);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: GUIDE_STEPS.length,
    targetRect,
    isCurrentStepCompleted,
    isValidationError,
    validationMessage,
    prefersReducedMotion,
    startGuide,
    stopGuide,
    advanceToNext,
    jumpToTarget
  };
}
