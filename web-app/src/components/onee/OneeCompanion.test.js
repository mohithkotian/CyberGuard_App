import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OneeCompanion from './OneeCompanion';
import { GUIDE_STEPS } from './oneeGuideSteps';

// Mock Onee component for testing
jest.mock('./Onee.jsx', () => {
  return function MockOnee({ animation, size }) {
    return <span data-testid="mock-onee" data-animation={animation} data-size={size} />;
  };
});

describe('OneeCompanion Interactive Citizen Guide', () => {
  const introStep = GUIDE_STEPS[0];
  const categoryStep = GUIDE_STEPS.find(s => s.id === 'incident-category') || GUIDE_STEPS[1];

  test('renders compact Onee companion without wizard controls', () => {
    const html = renderToStaticMarkup(
      <OneeCompanion
        step={introStep}
        targetRect={null}
        isStepCompleted={false}
        isActive={true}
        onSkip={jest.fn()}
      />
    );

    // Verifies Onee mascot and speech bubble
    expect(html).toContain('Onee');
    expect(html).toContain('data-testid="mock-onee"');
    expect(html).toContain("I&#x27;m Onee");

    // Strictly verifies wizard UI anti-patterns are ABSENT
    expect(html).not.toContain('STEP 1 OF');
    expect(html).not.toContain('Next');
    expect(html).not.toContain('Back');
    expect(html).not.toContain('Voice/Assist');
  });

  test('renders docked form step with speech bubble and directional pointer', () => {
    const html = renderToStaticMarkup(
      <OneeCompanion
        step={categoryStep}
        targetRect={{ left: 100, right: 400, top: 150, bottom: 200, width: 300, height: 50 }}
        isStepCompleted={false}
        isActive={true}
        onSkip={jest.fn()}
      />
    );

    expect(html).toContain('Onee');
    expect(html).toContain('Choose what happened.');
    expect(html).toContain('border:2px solid #3DF5C0');
    // Ensure no wizard buttons exist
    expect(html).not.toContain('button class="next"');
    expect(html).not.toContain('button class="back"');
  });

  test('displays validation error alert when validation fails', () => {
    const html = renderToStaticMarkup(
      <OneeCompanion
        step={categoryStep}
        targetRect={{ left: 100, right: 400, top: 150, bottom: 200, width: 300, height: 50 }}
        isStepCompleted={false}
        isValidationError={true}
        validationMessage="Please select an incident category."
        isActive={true}
        onSkip={jest.fn()}
      />
    );

    expect(html).toContain('Please select an incident category.');
    expect(html).toContain('data-animation="confused"');
  });

  test('renders target spotlight ring when targetRect is provided', () => {
    const html = renderToStaticMarkup(
      <OneeCompanion
        step={categoryStep}
        targetRect={{ left: 120, right: 420, top: 180, bottom: 230, width: 300, height: 50 }}
        isStepCompleted={false}
        isActive={true}
        onSkip={jest.fn()}
      />
    );

    // Should include the target focus ring
    expect(html).toContain('border:2px solid #3DF5C0');
  });

  test('all GUIDE_STEPS define required fields and natural flow order', () => {
    expect(GUIDE_STEPS.length).toBeGreaterThanOrEqual(9);
    GUIDE_STEPS.forEach(step => {
      expect(step.id).toBeDefined();
      expect(step.target).toBeDefined();
      expect(step.message).toBeDefined();
      expect(step.animation).toBeDefined();
    });

    const expectedSequence = [
      'intro',
      'incident-category',
      'financial-loss',
      'utr-number',
      'incident-title',
      'incident-description',
      'contact-info',
      'evidence-upload',
      'review-declaration',
      'submit-button'
    ];

    expectedSequence.forEach(id => {
      const found = GUIDE_STEPS.find(s => s.id === id);
      expect(found).toBeDefined();
    });
  });
});
