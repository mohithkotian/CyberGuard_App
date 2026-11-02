import { create } from 'zustand';
import { translations, SUPPORTED_LANGUAGES } from '../locales/translations';
import { PORTAL_DICTIONARY } from '../locales/portalDictionary';
import { applyLanguage } from '../services/languageService';

const STORAGE_KEY = 'cyberguard_lang';

const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading language from localStorage:', e);
  }
  return 'en';
};

const resolveNestedKey = (obj, path) => {
  if (!obj || !path) return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
};

const initialLang = getSavedLanguage();

export const useTranslationStore = create((set, get) => ({
  currentLanguage: initialLang,
  languages: SUPPORTED_LANGUAGES,

  setLanguage: (langCode) => {
    if (translations[langCode] || langCode === 'en') {
      try {
        localStorage.setItem(STORAGE_KEY, langCode);
      } catch (e) {
        console.error('Error saving language to localStorage:', e);
      }
      set({ currentLanguage: langCode });
      applyLanguage(langCode);
    }
  },

  t: (key, fallback = '') => {
    const { currentLanguage } = get();
    const currentDict = translations[currentLanguage] || translations.en;
    
    // 1. Check in structured translations.js
    let value = resolveNestedKey(currentDict, key);
    if (value !== null && value !== undefined) {
      return value;
    }

    // 2. Check PORTAL_DICTIONARY for direct match
    if (fallback && PORTAL_DICTIONARY[fallback.trim()]?.[currentLanguage]) {
      return PORTAL_DICTIONARY[fallback.trim()][currentLanguage];
    }
    if (PORTAL_DICTIONARY[key.trim()]?.[currentLanguage]) {
      return PORTAL_DICTIONARY[key.trim()][currentLanguage];
    }

    // 3. Fallback to English in translations
    const enValue = resolveNestedKey(translations.en, key);
    if (enValue !== null && enValue !== undefined) {
      return enValue;
    }

    return fallback || key;
  }
}));

// Apply saved non-English language on bootstrap
if (typeof window !== 'undefined' && initialLang !== 'en') {
  setTimeout(() => {
    applyLanguage(initialLang);
  }, 100);
}

export default useTranslationStore;
