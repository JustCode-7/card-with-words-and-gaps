import {Component, inject, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatChipsModule} from "@angular/material/chips";
import {AsyncPipe} from "@angular/common";
import {SocketService} from "../../service/socket.service";
import {PlayerService} from "../../service/player.service";
import {Router} from "@angular/router";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";

@Component({
  selector: 'app-room-create',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule,
    AsyncPipe,
  ],
  templateUrl: './room-create.component.html',
  styles: `
    .mw-50 {
      max-width: 50%;
    }

    .mt-2 {
      margin-top: 0.5rem;
    }

    .mt-3 {
      margin-top: 1rem;
    }

    .mt-4 {
      margin-top: 1.5rem;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .mb-4 {
      margin-bottom: 1.5rem;
    }

    .w-100 {
      width: 100%;
    }

    .step-box {
      padding: 1rem;
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
    }

    .bg-success-subtle {
      background-color: #d1e7dd;
      color: #0f5132;
    }

    .bg-warning-subtle {
      background-color: #fff3cd;
      color: #664d03;
    }

    .bg-danger-subtle {
      background-color: #f8d7da;
      color: #842029;
    }
  `
})
export class RoomCreateComponent {

  roomIdControl = new FormControl('', [Validators.required, Validators.maxLength(32)]);
  answerCodeControl = new FormControl('', [Validators.required]);

  sessionCode = signal('');
  joinLink = signal('');
  qrCodeDataUrl = signal('');

  matchService = inject(MatchService);
  socketService = inject(SocketService);
  playerService = inject(PlayerService);
  webrtcService = inject(WebRTCService);
  router = inject(Router);

  spielerListe = signal<any[]>([]);

  async createRoom() {
    if (this.roomIdControl.invalid) return;

    const room = this.roomIdControl.value!;

    // Wir setzen den Host-Status und den Raum-Namen
    this.socketService.setP2PRoomId(room);
    this.socketService.isHost.next(true);
    this.socketService.createRoom(room);
    this.matchService.initMatch(room);

    // Initialen Offer erzeugen
    await this.generateNewOffer();

    // Wir beobachten die Spielerliste aus dem MatchService
    this.matchService.game.subscribe(game => {
      if (game && game.spieler) {
        this.spielerListe.set(game.spieler);
      }
    });
  }

  async generateNewOffer() {
    const room = this.roomIdControl.value!;
    const offer = await this.webrtcService.createOffer(room);
    this.sessionCode.set(offer);

    const url = new URL(window.location.href);
    const baseUrl = url.origin + url.pathname;
    const joinLink = `${baseUrl}#/join-game?offer=${offer}`;
    this.joinLink.set(joinLink);

    const qr = await this.webrtcService.generateQRCode(joinLink);
    this.qrCodeDataUrl.set(qr);

    // Eingabefeld für Antwort leeren
    this.answerCodeControl.setValue('');
  }

  copyLink() {
    navigator.clipboard.writeText(this.joinLink());
  }

  async connect() {
    const answer = this.answerCodeControl.value;
    if (answer) {
      await this.webrtcService.handleAnswer(answer);
      // Wir bleiben auf der Seite, bis der Host das Spiel startet
      // Der Gast wird über WebRTC 'join-room' senden, was die Liste aktualisiert
    }
  }

  startGame() {
    const room = this.roomIdControl.value!;
    const playerName = this.playerService.getPlayer().name;
    this.router.navigate(['game', room, playerName, 'catlord']);
  }

}
