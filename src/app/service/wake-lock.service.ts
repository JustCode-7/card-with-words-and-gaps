import {Injectable, OnDestroy} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WakeLockService implements OnDestroy {
    private wakeLock: WakeLockSentinel | null = null;

    constructor() {
        // Re-request wake lock if visibility changes (browser requirement)
        document.addEventListener('visibilitychange', async () => {
            if (this.wakeLock !== null && document.visibilityState === 'visible') {
                await this.requestWakeLock();
            }
        });
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
                console.log('[WakeLock] Display is always on.');

                this.wakeLock?.addEventListener('release', () => {
                    console.log('[WakeLock] Wake Lock was released.');
                });
            } catch (err: any) {
                console.error(`[WakeLock] ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('[WakeLock] Screen Wake Lock API not supported.');
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    ngOnDestroy() {
        this.releaseWakeLock();
    }
}
