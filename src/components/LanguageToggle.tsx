import { useT } from '../lib/i18n'

/**
 * EN | PT, always in the top corner — including on the sign-in page, which is
 * the first thing anyone reading Portuguese sees.
 *
 * `shrink-0` on the box is load-bearing: `overflow-hidden` cancels a flex
 * item's automatic minimum size, so in a crowded phone header this would be
 * squeezed and the PT half clipped off rather than the row just being tight.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { t, lang, setLang } = useT()

  return (
    <div
      role="radiogroup"
      aria-label={t('app.language')}
      className={`flex shrink-0 overflow-hidden rounded border border-ink-faint text-xs ${className}`}
    >
      {(
        [
          ['en', 'EN', 'English'],
          ['pt', 'PT', 'Português (Brasil)'],
        ] as const
      ).map(([value, label, full]) => (
        <button
          key={value}
          role="radio"
          aria-checked={lang === value}
          title={full}
          onClick={() => setLang(value)}
          className={`shrink-0 px-2 py-1 sm:px-1.5 sm:py-0.5 ${
            lang === value ? 'bg-accent text-paper' : 'text-ink-soft hover:bg-accent-soft'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
