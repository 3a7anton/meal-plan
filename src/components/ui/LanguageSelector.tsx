import { useLanguageStore } from '../../store';
import { getTranslation } from '../../lib/i18n';
import type { Language } from '../../lib/i18n';
import { Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
  className?: string;
}

export function LanguageSelector({ variant = 'dropdown', className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguageStore();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: getTranslation('english', language), flag: '🇬🇧' },
    { code: 'bn', label: getTranslation('bangla', language), flag: '🇧🇩' },
  ];

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
          'bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors',
          className
        )}
        title={getTranslation('language', language)}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{language}</span>
      </button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              language === lang.code
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={cn('relative', className)}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className={cn(
          'appearance-none flex items-center gap-2 pl-3 pr-8 py-2 rounded-lg',
          'bg-white border border-gray-200 text-sm text-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'hover:border-gray-300 transition-colors cursor-pointer'
        )}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  );
}
