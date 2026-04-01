import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {ActivatedRoute, Router} from "@angular/router";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";
import {MatchService} from "../../service/match.service";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatTooltip} from "@angular/material/tooltip";
import {MatSnackBar} from "@angular/material/snack-bar";
import * as LZString from 'lz-string';
import {MatExpansionModule} from "@angular/material/expansion";
import {CommonModule} from "@angular/common";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {WebRTCService} from "../../service/webrtc.service";
import {PeerStatus, WebRTCMode} from "../../service/webrtc.types";

@Component({
  selector: 'app-room-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltip,
    MatExpansionModule,
    CommonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './room-list.component.html'
})
export class RoomListComponent implements OnInit {
  webrtcService = inject(WebRTCService);
  offerCodeControl = new FormControl('', [Validators.required]);
  roomNameControl = new FormControl('', [Validators.required, Validators.maxLength(32)]);
  isJoiningOnline = signal(false);
  answerCode = signal('');
  answerQrCodeUrl = signal('');
  answerLink = signal('');
  p2pRoomId = signal('P2P-Room');
  p2pConnectionId = signal<string | null>(null);
  isUrl = signal(false);
  protected playerService = inject(PlayerService);
  private data = inject(DataService);
  rooms = this.data.roomListSignal;
  private socketService = inject(SocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);
  private snackBar = inject(MatSnackBar);


  isInGame() {
    const id = this.p2pConnectionId();
    const player = this.playerService.getPlayer();
    return this.matchService.game().spieler.some(p =>
      (p.connectionId && id && p.connectionId === id) || p.name === player.name
    );
  }

  ngOnInit(): void {
    const player = this.playerService.getPlayer();

    // Reagiere auf Änderungen im Textfeld, um zu prüfen, ob es eine URL ist
    this.offerCodeControl.valueChanges.subscribe(value => {
      if (value) {
        try {
          // Prüfen, ob der String mit http(s) beginnt und eine gültige URL sein könnte
          const url = new URL(value.trim());
          this.isUrl.set(url.protocol === 'http:' || url.protocol === 'https:');
        } catch (_) {
          this.isUrl.set(false);
        }
      } else {
        this.isUrl.set(false);
      }
    });

    // Check for offer in URL
    this.route.queryParams.subscribe(params => {
      // Parameter können vor oder nach dem Hash stehen
      let offer = params['offer'] || this.getQueryParamFromUrl('offer');

      // Falls der Browser den Offer-Code bereits URL-dekodiert hat,
      // müssen wir sicherstellen, dass wir ihn so verarbeiten, wie LZString es erwartet.
      // Manchmal hilft es, das offer-Paket explizit zu loggen
      if (offer) {
        console.warn(`[DEBUG_LOG] WebRTC: Offer parameter detected (length: ${offer.length})`);
      }

      // Falls kein Name gesetzt ist, leiten wir zur Startseite um
      // und behalten den Offer-Code bei.
      if (!player.name || player.name === 'undefined') {
        if (offer) {
          console.warn("[DEBUG_LOG] Kein Name gesetzt. Umleitung zur Startseite mit Offer-Code.");
          this.router.navigate(['/'], {queryParams: {offer}});
          return;
        }
      }

      if (offer) {
        this.offerCodeControl.setValue(offer);
        this.generateAnswer();
      }
    });
  }

  async handleAction() {
    const value = this.offerCodeControl.value;
    if (!value) return;

    if (this.isUrl()) {
      window.open(value.trim(), '_self');
    } else {
      await this.generateAnswer();
    }
  }

  async joinOnlineRoom() {
    if (this.roomNameControl.invalid) return;
    const roomName = this.roomNameControl.value!;
    this.isJoiningOnline.set(true);

    try {
      console.warn(`[DEBUG_LOG] RoomList: Joining Online Room ${roomName}`);
      const connectionId = await this.webrtcService.joinOnlineRoom(roomName);
      this.p2pConnectionId.set(connectionId);
      this.socketService.p2pConnectionId.set(connectionId);
      this.webrtcService.pendingConnectionId.set(connectionId);

      this.p2pRoomId.set(roomName);
      this.answerCode.set('ONLINE_HANDSHAKE'); // Dummy marker

      // Automatisch finishJoin aufrufen, sobald die Verbindung steht
      // Wir prüfen den Status über das Signal des Services für diese ID
      const checkInterval = setInterval(() => {
        const dc = this.webrtcService.dataChannels.get(connectionId);
        if (dc && dc.readyState === 'open') {
          console.warn(`[DEBUG_LOG] Online: Connection established (DC Open)! Joining lobby...`);
          clearInterval(checkInterval);
          this.finishJoin();
        }
      }, 500);

      // Timeout nach 30 Sekunden
      setTimeout(() => clearInterval(checkInterval), 30000);

      if (this.webrtcService.mode() === 'local') {
        this.snackBar.open(`Raum ${roomName} beigetreten! Warte auf Host...`, 'OK', {duration: 3000});
      } else {
        this.snackBar.open(`Raum ${roomName} beigetreten! Host wartet auf Lobbybeitritt...`, 'OK', {duration: 3000});
      }
    } catch (e: any) {
      this.snackBar.open(`Fehler: ${e.message}`, 'Schließen', {duration: 5000});
      this.isJoiningOnline.set(false);
    }
  }

  async generateAnswer() {
    this.webrtcService.mode.set(WebRTCMode.LOCAL);
    const offer = this.offerCodeControl.value;
    if (offer) {
      console.warn("[DEBUG_LOG] WebRTC: Attempting to decode offer code...");
      // Wir dekodieren den Offer vorab, um die connectionId zu erhalten
      try {
        const decoded = LZString.decompressFromEncodedURIComponent(offer);
        if (decoded) {
          const packet = JSON.parse(decoded);
          const id = packet.connectionId;
          if (id) {
            console.warn(`[DEBUG_LOG] WebRTC: Extracted connectionId: ${id}`);
            this.socketService.p2pConnectionId.set(id);
            this.p2pConnectionId.set(id);
            this.webrtcService.pendingConnectionId.set(id);
          }
        } else {
          console.error("[DEBUG_LOG] WebRTC: Decompression failed for offer code!");
        }
      } catch (e) {
        console.error("[DEBUG_LOG] WebRTC: Error parsing offer JSON", e);
      }

      const {answer, roomId} = await this.webrtcService.createAnswer(offer);
      console.warn(`[DEBUG_LOG] WebRTC: Answer generated for room ${roomId}`);

      // WICHTIG: Erst den Raum-Namen setzen, bevor wir die Answer anzeigen
      // (da die Answer den Status 'connected' triggern kann)
      this.p2pRoomId.set(roomId);
      this.socketService.setP2PRoomId(roomId);

      this.answerCode.set(answer);

      // Wir nutzen eine robuste URL-Struktur für mobile Browser.
      // Der answer-Parameter wird im Hash-Fragment gesetzt, damit Angular ihn direkt verarbeiten kann.
      const baseUrl = window.location.origin + window.location.pathname;
      const answerLink = `${baseUrl}#/answer?answer=${encodeURIComponent(answer)}`;
      this.answerLink.set(answerLink);

      const qr = await this.webrtcService.generateQRCode(answerLink);
      this.answerQrCodeUrl.set(qr);
    }
  }

  copyAnswer() {
    navigator.clipboard.writeText(this.answerCode());
  }

  finishJoin() {
    const roomId = this.p2pRoomId();
    const playerName = this.playerService.getPlayer().name;
    this.socketService.setP2PRoomId(roomId);
    this.matchService.initMatch(roomId);

    // Wir treten dem Raum beim Host aktiv bei
    this.socketService.joinRoomViaWebRTC();

    // Wir fragen das Spiel aktiv beim Host an
    this.socketService.requestGameViaWebRTC(roomId);
    this.webrtcService.pendingConnectionId.set(null);
    // Navigation erst nach einer kleinen Verzögerung oder wenn Daten da sind
    // In diesem Fall navigieren wir und lassen den Spinner in der PlayerPage wirken
    this.router.navigate(['/game', roomId, playerName, 'player']);
  }

  getConnectionStatus() {
    const id = this.p2pConnectionId();
    if (!id) {
      return signal<PeerStatus>({state: 'disconnected', type: 'unknown'});
    }

    // Wenn ein individueller Status im Service existiert, nutzen wir diesen direkt.
    // if (this.webrtcService.individualStatus.has(id)) {
    //   return this.webrtcService.individualStatus.get(id)!;
    // }

    // Fallback während des Handshakes
    if (this.webrtcService.pendingConnectionId() === id) {
      return signal<PeerStatus>({state: 'connecting', type: 'unknown'});
    }
    if (this.webrtcService.pendingConnectionId() === null) {
      return signal<PeerStatus>({state: 'connected', type: 'unknown'});
    }

    return signal<PeerStatus>({state: 'disconnected', type: 'unknown'});
  }

  private getQueryParamFromUrl(name: string, urlString?: string): string | null {
    try {
      const url = new URL(urlString || window.location.href);
      return url.searchParams.get(name);
    } catch (e) {
      return null;
    }
  }
}
