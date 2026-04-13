import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language } from '../lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      toggleLanguage: () => {
        const current = get().language;
        set({ language: current === 'en' ? 'bn' : 'en' });
      },
    }),
    {
      name: 'language-preference',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
