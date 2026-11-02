/**
 * oneeGuideSteps.js
 * Clean, compact guidance model for Onee — CyberGuard's Interactive Citizen Guide.
 * 1-2 punchy sentences per step. No large wizard text or legal jargon.
 * Animations strictly mapped to the 5 core states (idle, listening, curious, happy, confused, excited).
 */

export const GUIDE_STEPS = [
  {
    id: 'intro',
    target: '[data-onee-target="form-intro"]',
    message: "Let's complete this together. Let's start here.",
    animation: 'waking',
    isIntro: true
  },
  {
    id: 'incident-category',
    target: '[data-onee-target="incident-category"]',
    message: 'Choose what happened.',
    successMessage: "Great. Let's continue.",
    animation: 'curious',
    isCompleted: (formState) => Boolean(formState.category),
    validationMessage: 'Please select an incident category.',
    required: true
  },
  {
    id: 'financial-loss',
    target: '[data-onee-target="financial-loss"]',
    message: 'Enter the amount you actually lost.',
    successMessage: 'Amount recorded.',
    animation: 'listening',
    isCompleted: (formState) => {
      if (!formState.lostMoney) return true;
      return Boolean(formState.amountLost && Number(formState.amountLost) > 0);
    },
    validationMessage: 'Please enter the amount lost in INR.',
    required: false
  },
  {
    id: 'utr-number',
    target: '[data-onee-target="utr-number"]',
    message: 'Enter the transaction reference number from your bank or UPI details.',
    successMessage: 'Reference saved.',
    animation: 'listening',
    condition: (formState) => Boolean(formState.lostMoney),
    isCompleted: (formState) => {
      if (!formState.lostMoney) return true;
      return Boolean(formState.transactionReference);
    },
    required: false
  },
  {
    id: 'incident-title',
    target: '[data-onee-target="incident-title"]',
    message: 'Give a short headline for what happened.',
    successMessage: 'Got it.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.title && formState.title.trim().length >= 3),
    validationMessage: 'A short headline is needed here.',
    required: true
  },
  {
    id: 'incident-description',
    target: '[data-onee-target="incident-description"]',
    message: 'Describe what happened using the facts you know.',
    successMessage: 'Narrative recorded.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.description && formState.description.trim().length >= 20),
    validationMessage: 'Please write at least 20 characters describing the incident.',
    required: true
  },
  {
    id: 'contact-info',
    target: '[data-onee-target="contact-info"]',
    message: 'Enter your email and mobile so investigators can reach you.',
    successMessage: 'Contact saved.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.email && formState.email.includes('@') && formState.mobile && formState.mobile.length >= 10),
    validationMessage: 'A valid email and 10-digit mobile number are needed.',
    required: true
  },
  {
    id: 'evidence-upload',
    target: '[data-onee-target="evidence-upload"]',
    message: 'Add relevant evidence you have, such as supported transaction screenshots or messages.',
    successMessage: 'Evidence noted.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.filesCount > 0 || formState.hasNationalId || formState.skipEvidence),
    required: false
  },
  {
    id: 'review-declaration',
    target: '[data-onee-target="review-declaration"]',
    message: 'Take a quick look at everything before submitting.',
    successMessage: 'Confirmed.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.consentAgreed),
    validationMessage: 'Please check the declaration box to continue.',
    required: true
  },
  {
    id: 'submit-button',
    target: '[data-onee-target="submit-button"]',
    message: "Everything looks ready. Submit when you're ready.",
    successMessage: 'Your complaint was submitted successfully.',
    animation: 'excited',
    isFinal: true
  }
];
