import { registerSW } from 'virtual:pwa-register';

export function setupPWARegistration() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] Versi baru tersedia, memuat pembaruan...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] OptiSim Fiber Pro siap beroperasi 100% offline via Service Worker');
      },
      onRegistered(r) {
        console.log('[PWA] Service Worker berhasil didaftarkan:', r?.scope);
      },
      onRegisterError(error) {
        console.warn('[PWA] Gagal mendaftarkan Service Worker:', error);
      }
    });

    return updateSW;
  }
  return undefined;
}
