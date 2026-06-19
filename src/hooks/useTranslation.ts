import { useLanguageStore } from '../store';
import { getTranslation } from '../lib/i18n';

export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  const t = (key: string) => getTranslation(key, language);

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
  };
}
