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
    title: 'Welcome',
    message: "I'm Onee — I'll guide you through each section. Your report helps investigators act faster.",
    animation: 'waking',
    isIntro: true
  },
  {
    id: 'incident-category',
    target: '[data-onee-target="incident-category"]',
    title: 'Incident Category',
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
    title: 'Financial Loss',
    message: 'Enter the amount you actually lost.',
    successMessage: 'Amount recorded.',
    animation: 'listening',
    tip: 'Enter the exact amount debited, not including interest or fees.',
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
    title: 'Transaction Reference',
    message: 'Enter the transaction reference number from your bank or UPI details.',
    successMessage: 'Reference saved.',
    animation: 'listening',
    tip: 'Find the UTR/Reference number in your bank SMS, UPI app history, or bank statement.',
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
    title: 'Incident Title',
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
    title: 'Incident Description',
    message: 'Describe what happened using the facts you know.',
    successMessage: 'Narrative recorded.',
    animation: 'listening',
    tip: 'Include: when it happened, what platform was used, and what was said or done. Exact amounts, phone numbers, and URLs help investigators most.',
    hasDraftHelper: true,
    isCompleted: (formState) => Boolean(formState.description && formState.description.trim().length >= 20),
    validationMessage: 'Please write at least 20 characters describing the incident.',
    required: true
  },
  {
    id: 'contact-info',
    target: '[data-onee-target="contact-info"]',
    title: 'Contact Details',
    message: 'Confirm the contact details investigators should use to reach you.',
    successMessage: 'Contact saved.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.email && formState.email.includes('@') && formState.mobile && formState.mobile.length >= 10),
    validationMessage: 'A valid email and 10-digit mobile number are needed.',
    required: true
  },
  {
    id: 'evidence-upload',
    target: '[data-onee-target="evidence-upload"]',
    title: 'Evidence Upload',
    message: 'Upload screenshots, PDFs, or chat exports. Max 5 files, 10 MB each. Unedited screenshots work best.',
    successMessage: 'Evidence noted.',
    animation: 'listening',
    tip: 'Screenshots should be unedited and show timestamps. WhatsApp chats can be exported as .txt files.',
    isCompleted: (formState) => Boolean(formState.filesCount > 0 || formState.hasNationalId || formState.skipEvidence),
    required: false
  },
  {
    id: 'review-declaration',
    target: '[data-onee-target="review-declaration"]',
    title: 'Declaration',
    message: 'Review your details carefully. Check the declaration box when everything is accurate.',
    successMessage: 'Confirmed.',
    animation: 'listening',
    isCompleted: (formState) => Boolean(formState.consentAgreed),
    validationMessage: 'Please check the declaration box to continue.',
    required: true
  },
  {
    id: 'submit-button',
    target: '[data-onee-target="submit-button"]',
    title: 'Submit',
    message: "Everything looks ready. Submit when you're ready.",
    successMessage: 'Your complaint was submitted successfully.',
    animation: 'excited',
    isFinal: true
  }
];
