import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {ActivatedRoute, Router} from "@angular/router";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {AsyncPipe} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";
import * as LZString from 'lz-string';

@Component({
  selector: 'app-room-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AsyncPipe,
    MatTooltip
  ],
  templateUrl: './room-list.component.html'
})
export class RoomListComponent implements OnInit {
  webrtcService = inject(WebRTCService);
  offerCodeControl = new FormControl('', [Validators.required]);
  answerCode = signal('');
  answerQrCodeUrl = signal('');
  answerLink = signal('');
  p2pRoomId = signal('P2P-Room');
  p2pConnectionId = signal<string | null>(null);
  protected playerService = inject(PlayerService);
  private data = inject(DataService);
  rooms = this.data.roomListSignal;
  private socketService = inject(SocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);

  ngOnInit(): void {
    const player = this.playerService.getPlayer();

    // Check for offer in URL
    this.route.queryParams.subscribe(params => {
      let offer = params['offer'];

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

  async generateAnswer() {
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
            this.p2pConnectionId.set(id);
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

      const url = new URL(window.location.href);
      // Entferne alle Query-Parameter, um eine saubere Basis-URL zu haben
      const baseUrl = url.origin + url.pathname;
      const answerLink = `${baseUrl}#/join-game?answer=${encodeURIComponent(answer)}`;
      this.answerLink.set(answerLink);

      const qr = await this.webrtcService.generateQRCode(answerLink);
      this.answerQrCodeUrl.set(qr);
    }
  }

  copyAnswer() {
    navigator.clipboard.writeText(this.answerCode());
  }

  copyAnswerLink() {
    navigator.clipboard.writeText(this.answerLink());
  }

  joinRoom(room: string) {
    this.router.navigate(['game', room, this.playerService.getPlayer().name, 'player']);
  }

  finishJoin() {
    const roomId = this.p2pRoomId();
    const playerName = this.playerService.getPlayer().name;
    this.socketService.setP2PRoomId(roomId);
    this.matchService.initMatch(roomId);

    // Wir fragen das Spiel aktiv beim Host an
    this.socketService.requestGameViaWebRTC(roomId);

    // Navigation erst nach einer kleinen Verzögerung oder wenn Daten da sind
    // In diesem Fall navigieren wir und lassen den Spinner in der PlayerPage wirken
    this.router.navigate(['/game', roomId, playerName, 'player']);
  }

  getConnectionStatus() {
    const id = this.p2pConnectionId();
    if (id && this.webrtcService.individualStatus.has(id)) {
      return this.webrtcService.individualStatus.get(id)!;
    }
    return this.webrtcService.connectionStatus;
  }
}
