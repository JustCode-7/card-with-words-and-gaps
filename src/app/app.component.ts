import {Component, HostListener, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatchService} from "./service/match.service";
import {SocketService} from "./service/socket.service";
import {PwaInstallService} from "./service/pwa-install.service";
import {ServerService} from "./service/server.service";
import {ToggleFullscreenService} from "./service/toggle-fullscreen.service";

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  matchService = inject(MatchService);
  socketService = inject(SocketService);
  router = inject(Router);
  pwa = inject(PwaInstallService);
  serverService = inject(ServerService);
  toggleFullscreen = inject(ToggleFullscreenService);
  protected readonly fullscreenService = inject(ToggleFullscreenService);

  // Warn user about data loss on reload when not in fullscreen
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnloadHandler(event: BeforeUnloadEvent) {
    // Standard: set returnValue to show confirmation dialog
    if (navigator.userActivation.hasBeenActive) {
      // Recommended
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      event.returnValue = true;
    }
    return
  }

  ngOnInit() {
    this.toggleFullscreen.initDisplayAlwaysOnMode()
    // Die PWA-Logik und Update-Prüfungen werden automatisch in den Konstruktoren
    // der injizierten Services (PwaInstallService, UpdateService) gestartet.
    console.log('[App] Initialisierung abgeschlossen. PWA-Services aktiv.');
  }

  ngOnDestroy(): void {
    this.fullscreenService.releaseDisplayAlwaysOnMode()
  }

  goToMainMenu() {
    this.router.navigate(['/']);
  }

  goToRoomView() {
    this.router.navigate(['/new-game']);
  }

  endGame() {
    this.matchService.endGame();
  }

  protected clearCache() {
    localStorage.clear();
    this.router.navigate(['/set-name'], {skipLocationChange: true});
  }

  protected deleteRoom() {
    // Inform all guests and cleanup
    this.serverService.stopServer();
    // Reset local UI state
    this.socketService.clearP2PState();
  }
}
