import {Injectable, NgZone} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BehaviorSubject} from 'rxjs';

const SNOOZE_KEY = 'pwa_install_snooze_until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable({providedIn: 'root'})
export class PwaInstallService {
  public canInstall$ = new BehaviorSubject<boolean>(false);
  private deferredPrompt: any = null;

  constructor(private snackBar: MatSnackBar, private zone: NgZone) {
    // Listen to install prompt availability
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.updateCanInstall();
      this.maybeAutoPrompt();
    });

    // When app installed, clear state
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall$.next(false);
    });

    // Initial check in case of standalone
    this.updateCanInstall();
  }

  isStandalone(): boolean {
    // Chrome/Edge PWAs
    const isStandaloneMql = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    // iOS Safari PWA
    const isIOSStandalone = (window as any).navigator?.standalone === true;
    return isStandaloneMql || isIOSStandalone;
  }

  askToInstall() {
    if (!this.deferredPrompt || this.isStandalone()) return;

    const ref = this.snackBar.open('Möchten Sie die App installieren?', 'Ja, gerne.', {
      duration: 10000,
    });

    ref.onAction().subscribe(() => {
      this.triggerInstall();
    });

    ref.afterDismissed().subscribe((info) => {
      // If dismissed without action, snooze prompting
      if (!info.dismissedByAction) {
        const until = Date.now() + SNOOZE_MS;
        localStorage.setItem(SNOOZE_KEY, String(until));
      }
    });
  }

  async triggerInstall() {
    if (!this.deferredPrompt) return;
    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice?.outcome !== 'accepted') {
        // User declined: snooze future prompts
        const until = Date.now() + SNOOZE_MS;
        localStorage.setItem(SNOOZE_KEY, String(until));
      }
    } catch (e) {
      console.warn('Install prompt failed', e);
    } finally {
      // Event can only be used once
      this.deferredPrompt = null;
      this.updateCanInstall();
    }
  }

  private isSnoozed(): boolean {
    const until = localStorage.getItem(SNOOZE_KEY);
    if (!until) return false;
    const ts = parseInt(until, 10);
    return !isNaN(ts) && Date.now() < ts;
  }

  private updateCanInstall() {
    const can = !!this.deferredPrompt && !this.isStandalone();
    this.canInstall$.next(can);
  }

  private maybeAutoPrompt() {
    // Only auto prompt if eligible, not installed, not snoozed
    if (!this.deferredPrompt || this.isStandalone() || this.isSnoozed()) return;
    // Use snackbar to ask the user
    this.zone.run(() => this.askToInstall());
  }
}
