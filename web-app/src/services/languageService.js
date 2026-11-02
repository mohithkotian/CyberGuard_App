import { PORTAL_DICTIONARY } from '../locales/portalDictionary';

// Cache dictionary entries sorted by length (descending) so longer phrases match before shorter fragments
const sortedEntries = Object.entries(PORTAL_DICTIONARY).sort(
  (a, b) => b[0].length - a[0].length
);

let isTranslating = false;
let observerInstance = null;
let activeLang = 'en';

export function getActiveLanguage() {
  return activeLang;
}

export function setGoogleTransCookie(langCode) {
  if (typeof document === 'undefined') return;
  try {
    const isEn = !langCode || langCode === 'en';
    const cookieVal = isEn ? '' : `/en/${langCode}`;
    const expires = isEn ? '; expires=Thu, 01 Jan 1970 00:00:00 UTC' : '; max-age=31536000';
    const host = window.location.hostname;

    document.cookie = `googtrans=${cookieVal}; path=/${expires}`;
    if (host) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host}${expires}`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${host}${expires}`;
    }
    if (isEn) {
      document.cookie = 'googtrans=/en/en; path=/';
    }
  } catch (e) {
    console.error('Error setting translation cookie:', e);
  }
}

export function triggerGoogleTranslateCombo(langCode) {
  if (typeof document === 'undefined') return false;
  try {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      const targetVal = (!langCode || langCode === 'en') ? '' : langCode;
      if (combo.value !== targetVal) {
        combo.value = targetVal;
        combo.dispatchEvent(new Event('change'));
      }
      return true;
    }
  } catch (e) {
    console.error('Error triggering Google Translate combo:', e);
  }
  return false;
}

export function syncGoogleTranslate(langCode) {
  setGoogleTransCookie(langCode);
  const ok = triggerGoogleTranslateCombo(langCode);
  if (!ok) {
    // Retry periodically in case the Google script is still bootstrapping
    [100, 300, 600, 1200, 2500].forEach((delay) => {
      setTimeout(() => {
        triggerGoogleTranslateCombo(langCode);
      }, delay);
    });
  }
}

const IGNORE_TAGS = new Set([
  'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'SVG', 'PATH', 'IFRAME'
]);

function shouldSkipElement(el) {
  if (!el || !el.tagName) return true;
  if (IGNORE_TAGS.has(el.tagName.toUpperCase())) return true;
  if (el.classList && (
    el.classList.contains('skiptranslate') ||
    el.classList.contains('goog-te-banner') ||
    el.classList.contains('notranslate')
  )) return true;
  return false;
}

export function translateDOM(targetLang) {
  if (typeof document === 'undefined' || !document.body) return;
  activeLang = targetLang || 'en';

  if (activeLang === 'en') {
    revertDOMToEnglish();
    return;
  }

  isTranslating = true;
  try {
    document.documentElement.lang = targetLang;

    // Fast TreeWalker for Text Nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToTranslate = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      nodesToTranslate.push(currentNode);
      currentNode = walker.nextNode();
    }

    // Process collected text nodes
    for (let i = 0; i < nodesToTranslate.length; i++) {
      const node = nodesToTranslate[i];
      if (!node.__cgOrig) {
        node.__cgOrig = node.nodeValue;
      }
      const originalText = node.__cgOrig;
      const trimmed = originalText.trim();
      if (!trimmed) continue;

      // 1. Direct exact dictionary match
      if (PORTAL_DICTIONARY[trimmed] && PORTAL_DICTIONARY[trimmed][targetLang]) {
        const trans = PORTAL_DICTIONARY[trimmed][targetLang];
        node.nodeValue = originalText.replace(trimmed, trans);
        continue;
      }

      // 2. Phrase matching from sorted dictionary
      let updated = originalText;
      let matched = false;
      for (let j = 0; j < sortedEntries.length; j++) {
        const [enPhrase, translations] = sortedEntries[j];
        if (enPhrase.length < 3) continue; // skip single short letters to preserve formatting
        if (updated.includes(enPhrase) && translations[targetLang]) {
          updated = updated.split(enPhrase).join(translations[targetLang]);
          matched = true;
        }
      }
      if (matched) {
        node.nodeValue = updated;
      }
    }

    // Translate placeholder attributes on inputs and textareas
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach((input) => {
      if (!input.getAttribute('data-cg-orig-ph')) {
        input.setAttribute('data-cg-orig-ph', input.placeholder);
      }
      const orig = input.getAttribute('data-cg-orig-ph').trim();
      if (PORTAL_DICTIONARY[orig] && PORTAL_DICTIONARY[orig][targetLang]) {
        input.placeholder = PORTAL_DICTIONARY[orig][targetLang];
      }
    });

  } catch (err) {
    console.error('Error during translateDOM:', err);
  } finally {
    isTranslating = false;
  }
}

export function revertDOMToEnglish() {
  if (typeof document === 'undefined' || !document.body) return;
  isTranslating = true;
  try {
    document.documentElement.lang = 'en';

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node && node.__cgOrig) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node = walker.nextNode();
    while (node) {
      if (node.__cgOrig) {
        node.nodeValue = node.__cgOrig;
      }
      node = walker.nextNode();
    }

    // Revert inputs
    const inputs = document.querySelectorAll('input[data-cg-orig-ph], textarea[data-cg-orig-ph]');
    inputs.forEach((input) => {
      input.placeholder = input.getAttribute('data-cg-orig-ph');
    });

  } catch (err) {
    console.error('Error reverting DOM to English:', err);
  } finally {
    isTranslating = false;
  }
}

let debounceTimer = null;

export function initLanguageObserver() {
  if (typeof window === 'undefined' || observerInstance || !document.body) return;

  observerInstance = new MutationObserver((mutations) => {
    if (isTranslating) return;
    if (activeLang === 'en') return;

    let hasRelevantMutation = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        for (let j = 0; j < m.addedNodes.length; j++) {
          const n = m.addedNodes[j];
          if (n.nodeType === Node.ELEMENT_NODE && !shouldSkipElement(n)) {
            hasRelevantMutation = true;
            break;
          }
        }
      }
      if (hasRelevantMutation) break;
    }

    if (hasRelevantMutation) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        translateDOM(activeLang);
      }, 60);
    }
  });

  observerInstance.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export function applyLanguage(langCode) {
  activeLang = langCode || 'en';
  initLanguageObserver();
  translateDOM(activeLang);
  syncGoogleTranslate(activeLang);
}

export default {
  applyLanguage,
  translateDOM,
  revertDOMToEnglish,
  syncGoogleTranslate,
  setGoogleTransCookie,
  triggerGoogleTranslateCombo,
  getActiveLanguage
};

