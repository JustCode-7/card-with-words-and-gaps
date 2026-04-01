import {Component, effect, HostListener, inject, OnDestroy, OnInit} from '@angular/core';
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
import {WebRTCService} from "./service/webrtc.service";
import {WebRTCMode} from "./service/webrtc.types";

@Component({
  selector: 'app-root',
  standalone: true,
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
  webrtcService = inject(WebRTCService);
  router = inject(Router);
  pwa = inject(PwaInstallService);
  serverService = inject(ServerService);
  protected readonly fullscreenService = inject(ToggleFullscreenService);

  constructor() {
    effect(() => {
      const currentGame = this.matchService.game();
      const currentUrl = this.router.url;

      // Wenn wir in einem Spiel-Pfad sind (game/...), aber keine gültige Game-Hash mehr haben,
      // dann leiten wir auf die Startseite zurück.
      if (currentUrl.includes('/game/') && (!currentGame || !currentGame.gameHash)) {
        console.warn("[DEBUG_LOG] No valid RoomID found, redirecting to EntryPage");
        this.router.navigate(['/']);
      }
    });
  }

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
    this.fullscreenService.initDisplayAlwaysOnMode()
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

  public deleteRoom() {
    // Inform all guests and cleanup
    this.serverService.stopServer();

    if (this.webrtcService.mode() === WebRTCMode.ONLINE) {
      (this.webrtcService as any).cleanupConnection("HOST_ROOM_LOGIC");
    }

    // Reset local UI state
    this.socketService.clearP2PState();
    this.router.navigate(['/']);
  }

  protected clearCache() {
    localStorage.clear();
    this.router.navigate(['/set-name'], {skipLocationChange: true});
  }
}
