import { registerSW } from 'virtual:pwa-register'

/**
 * The service worker, and asking it to look for a new version now.
 *
 * The app already updates itself: registerType is 'autoUpdate', so a new build
 * is picked up in the background and applied on a later launch. The catch is
 * that an installed PWA only looks when it feels like it, so a change pushed
 * minutes ago can be invisible for a while with nothing to press.
 *
 * Registration moved here from the plugin's injected script (injectRegister is
 * null in vite.config.ts) purely so we can keep hold of the registration and
 * call update() on demand. Behaviour is otherwise unchanged.
 */

let registration: ServiceWorkerRegistration | undefined
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined

export function initPWA() {
  applyUpdate = registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registration = r
    },
  })
}

export type UpdateCheck = 'updating' | 'current' | 'unsupported' | 'failed'

/**
 * 'updating' means a new version was found and the page is about to reload
 * itself, so there is nothing more to say to the user.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!registration || !applyUpdate) return 'unsupported'
  try {
    await registration.update()
  } catch {
    // Offline, or the server is unreachable: not an update, not a real error.
    return 'failed'
  }
  if (registration.installing || registration.waiting) {
    void applyUpdate(true)
    return 'updating'
  }
  return 'current'
}
