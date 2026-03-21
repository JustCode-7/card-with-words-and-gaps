import {inject, Injectable} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {filter, interval} from 'rxjs';

@Injectable({providedIn: 'root'})
export class UpdateService {
  private swUpdate = inject(SwUpdate);

  constructor() {
    if (this.swUpdate.isEnabled) {
      // Check for updates immediately
      this.swUpdate.checkForUpdate();

      // Check for updates every 6 hours
      interval(6 * 60 * 60 * 1000).subscribe(() => this.swUpdate.checkForUpdate());

      // Listen for available updates
      this.swUpdate.versionUpdates
        .pipe(filter((evt) => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
          });
        });
    }
  }
}
