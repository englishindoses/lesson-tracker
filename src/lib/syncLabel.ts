import { useStore } from '../data/store'
import { useT } from './i18n'

/**
 * The one-line sync status, in words. Shared, because the header hides it on a
 * phone and Settings shows it instead -- two copies would drift.
 */
export function useSyncLabel() {
  const { t } = useT()
  const sync = useStore((s) => s.sync)
  const pending = useStore((s) => s.pendingWrites)

  const text: Record<typeof sync, string> = {
    offline: pending ? t('sync.offlinePending', { n: pending }) : t('sync.offline'),
    syncing: t('sync.syncing'),
    synced: t('sync.synced'),
    error: pending ? t('sync.errorPending', { n: pending }) : t('sync.error'),
    unconfigured: t('sync.unconfigured'),
  }

  return {
    text: text[sync],
    className:
      sync === 'error' ? 'text-danger' : sync === 'synced' ? 'text-ink-faint' : 'text-ink-soft',
  }
}
