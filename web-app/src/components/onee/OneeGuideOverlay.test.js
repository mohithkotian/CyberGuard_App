import React, { useEffect, act } from 'react';
import { createRoot } from 'react-dom/client';
import OneeGuideOverlay from './OneeGuideOverlay';
import { useOneeGuideEngine } from './useOneeGuideEngine';
import { GUIDE_STEPS } from './oneeGuideSteps';

jest.mock('./Onee.jsx', () => () => <div data-testid="mock-onee" />);
jest.mock('./OneeGuidePointer.jsx', () => () => <div data-testid="mock-pointer" />);

// Mock window.matchMedia for JSDOM
beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
});

describe('OneeGuideOverlay & Engine - Issue I Validation & Persistence', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  test('Issue I: Next button calls onNext and renders in DOM', () => {
    const handleNext = jest.fn();
    const categoryStep = GUIDE_STEPS.find(s => s.id === 'incident-category');

    act(() => {
      root.render(
        <OneeGuideOverlay
          step={categoryStep}
          stepIndex={1}
          totalSteps={GUIDE_STEPS.length}
          targetRect={{ top: 100, bottom: 200, left: 100, right: 300, width: 200, height: 100 }}
          isStepCompleted={false}
          isValidationError={false}
          onNext={handleNext}
          onPrev={jest.fn()}
          onSkip={jest.fn()}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const nextBtn = buttons.find(b => b.textContent.includes('Next'));
    expect(nextBtn).toBeTruthy();
    act(() => {
      nextBtn.click();
    });
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  test('Issue I & K: Validation error displays alert role and validation message', () => {
    const categoryStep = GUIDE_STEPS.find(s => s.id === 'incident-category');

    act(() => {
      root.render(
        <OneeGuideOverlay
          step={categoryStep}
          stepIndex={1}
          totalSteps={GUIDE_STEPS.length}
          targetRect={{ top: 100, bottom: 200, left: 100, right: 300, width: 200, height: 100 }}
          isStepCompleted={false}
          isValidationError={true}
          validationMessage="Please select an incident category."
          onNext={jest.fn()}
          onPrev={jest.fn()}
          onSkip={jest.fn()}
        />
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Please select an incident category.');
  });

  test('Issue I & M: Engine onNext blocks incomplete required step, advances completed step, and persists state', () => {
    let engineRef = null;

    function TestHarness({ formState }) {
      const engine = useOneeGuideEngine(formState);
      useEffect(() => {
        engineRef = engine;
      });
      return null;
    }

    // 1. Initial render with incomplete formState (on category step)
    act(() => {
      root.render(<TestHarness formState={{ category: '' }} />);
    });

    // Advance from intro to category step
    act(() => {
      engineRef.advanceToNext();
    });
    expect(engineRef.currentStep.id).toBe('incident-category');
    expect(engineRef.currentStep.required).toBe(true);

    // Click onNext while required step is incomplete -> should NOT advance and show validation error
    act(() => {
      engineRef.onNext();
    });
    expect(engineRef.currentStep.id).toBe('incident-category');
    expect(engineRef.isValidationError).toBe(true);
    expect(engineRef.validationMessage).toBe('Please select an incident category.');

    // 2. Complete the step
    act(() => {
      root.render(<TestHarness formState={{ category: 'phishing' }} />);
    });
    expect(engineRef.isCurrentStepCompleted).toBe(true);

    // Click onNext while required step IS completed -> advances to next step
    act(() => {
      engineRef.onNext();
    });
    expect(engineRef.isValidationError).toBe(false);
    expect(engineRef.currentStep.id).toBe('financial-loss');

    // 3. Test non-required step advances without error even when incomplete
    expect(engineRef.currentStep.required).toBe(false);
    act(() => {
      engineRef.onNext();
    });
    expect(engineRef.isValidationError).toBe(false);
    expect(engineRef.currentStep.id).toBe('incident-title');

    // 4. Test persistence: dismiss sets localStorage flag
    act(() => {
      engineRef.stopGuide();
    });
    expect(engineRef.isActive).toBe(false);
    expect(localStorage.getItem('onee-guide-dismissed')).toBe('1');

    // Restart guide clears flag
    act(() => {
      engineRef.startGuide();
    });
    expect(engineRef.isActive).toBe(true);
    expect(engineRef.currentStepIndex).toBe(0);
    expect(localStorage.getItem('onee-guide-dismissed')).toBeNull();
  });
});
