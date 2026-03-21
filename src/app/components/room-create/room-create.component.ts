import {Component, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatChipsModule} from "@angular/material/chips";
import {AsyncPipe} from "@angular/common";
import {SocketService} from "../../service/socket.service";
import {PlayerService} from "../../service/player.service";
import {ServerService} from "../../service/server.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";
import {Game} from "../../model/game-model";
import * as LZString from 'lz-string';
import {BehaviorSubject, Subscription} from "rxjs";

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
  templateUrl: './room-create.component.html'
})
export class RoomCreateComponent implements OnInit {

  roomIdControl = new FormControl('', [Validators.required, Validators.maxLength(32)]);
  answerCodeControl = new FormControl('', [Validators.required]);
  matchService = inject(MatchService);
  socketService = inject(SocketService);
  sessionCode = this.socketService.sessionCode;
  joinLink = this.socketService.joinLink;
  qrCodeDataUrl = this.socketService.qrCodeDataUrl;
  playerService = inject(PlayerService);
  serverService = inject(ServerService);
  webrtcService = inject(WebRTCService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  spielerListe = signal<any[]>([]);
  p2pConnectionId = signal<string | null>(null);
  @ViewChild('statusContainer') statusContainer!: ElementRef;
  private subscriptions: Subscription[] = [];

  getIndividualStatus(connectionId?: string) {
    if (connectionId && this.webrtcService.individualStatus.has(connectionId)) {
      return this.webrtcService.individualStatus.get(connectionId)!;
    }
    // Falls keine ID da ist (Host selbst), geben wir connected zurück
    return new BehaviorSubject('connected');
  }

  async ngOnInit(): Promise<void> {
    // Falls wir bereits Host sind, müssen wir die Spielerliste und den Raum-Zustand wiederherstellen
    if (this.socketService.isHost.value) {
      const room = this.socketService.getP2PRoomId();
      if (room) {
        this.roomIdControl.setValue(room);

        // Spielerliste wieder abonnieren
        const matchSub = this.matchService.game.subscribe(game => {
          if (game && game.spieler) {
            this.spielerListe.set(game.spieler);
          }
        });
        this.subscriptions.push(matchSub);

        // Falls noch kein Offer da ist, einen erzeugen
        if (!this.sessionCode()) {
          await this.generateNewOffer();
        } else {
          // Falls bereits ein Offer da ist (persistiert), extrahieren wir die connectionId
          this.extractConnectionId(this.sessionCode());
        }
      }
    }

    this.route.queryParams.subscribe(params => {
      const answer = params['answer'];
      if (answer) {
        console.warn("[DEBUG_LOG] WebRTC: Answer parameter detected in URL");

        // Wir prüfen in einem Intervall, ob die Raum-Session bereit ist (Offer generiert)
        // Sobald sessionCode gesetzt ist, führen wir connect() aus.
        const checkSession = setInterval(() => {
          if (this.sessionCode()) {
            console.warn("[DEBUG_LOG] WebRTC: Session ready, auto-connecting with answer code...");
            this.answerCodeControl.setValue(answer);
            this.connect();
            clearInterval(checkSession);

            // Parameter aus der URL entfernen, damit er bei einem manuellen Reload nicht erneut verarbeitet wird
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {answer: null},
              queryParamsHandling: 'merge',
              replaceUrl: true
            });
          }
        }, 500);

        // Nach 10 Sekunden aufhören zu warten
        setTimeout(() => clearInterval(checkSession), 10000);
      }
    });
  }

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
    const matchSub = this.matchService.game.subscribe(game => {
      if (game && game.spieler) {
        this.spielerListe.set(game.spieler);
      }
    });
    this.subscriptions.push(matchSub);
  }

  async generateNewOffer() {
    const room = this.roomIdControl.value || this.socketService.getP2PRoomId();
    if (!room) {
      console.error("[DEBUG_LOG] WebRTC: No room name available for offer generation");
      return;
    }
    const offer = await this.webrtcService.createOffer(room);
    this.sessionCode.set(offer);

    console.warn("[DEBUG_LOG] WebRTC: New offer generated, decoding for connectionId...");
    this.extractConnectionId(offer);

    const url = new URL(window.location.href);
    const baseUrl = url.origin + url.pathname;
    const joinLink = `${baseUrl}#/join-game?offer=${offer}`;
    this.joinLink.set(joinLink);

    const qr = await this.webrtcService.generateQRCode(joinLink);
    this.qrCodeDataUrl.set(qr);

    // Eingabefeld für Antwort leeren
    this.answerCodeControl.setValue('');
  }

  getConnectionStatus() {
    const id = this.p2pConnectionId();
    if (id && this.webrtcService.individualStatus.has(id)) {
      return this.webrtcService.individualStatus.get(id)!;
    }
    return this.webrtcService.connectionStatus;
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

      // Eingabefeld für Antwort leeren, nachdem der Spieler hinzugefügt wurde
      this.answerCodeControl.setValue('');

      // Nach dem Hinzufügen zum Netzwerk-Status scrollen
      setTimeout(() => {
        this.statusContainer.nativeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
      }, 100);
    }
  }

  startGame() {
    const room = this.roomIdControl.value!;
    const playerName = this.playerService.getPlayer().name;
    this.router.navigate(['game', room, playerName, 'catlord']);
  }

  beitreten() {
    const room = this.matchService.gameSignal().gameHash;
    const playerName = this.playerService.getPlayer().name;
    this.router.navigate(['game', room, playerName, 'catlord']);
  }

  deleteRoom() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.socketService.isHost.next(false);
    this.socketService.setP2PRoomId('');
    this.matchService.game.next(new Game([], [], [], "", "", 'WAITING_FOR_ANSWERS', false, false, false));
    this.sessionCode.set('');
    this.joinLink.set('');
    this.qrCodeDataUrl.set('');
    this.spielerListe.set([]);
    this.p2pConnectionId.set(null);
    this.roomIdControl.reset();
    this.serverService.stopServer();
  }

  private extractConnectionId(offer: string) {
    // Wir dekodieren den Offer vorab, um die connectionId zu erhalten (für den Status-Check)
    try {
      const decoded = LZString.decompressFromEncodedURIComponent(offer);
      if (decoded) {
        const packet = JSON.parse(decoded);
        const id = packet.connectionId;
        if (id) {
          console.warn(`[DEBUG_LOG] WebRTC: Extracted connectionId: ${id}`);
          this.p2pConnectionId.set(id);
          // WICHTIG: Wir müssen dem WebRTC-Service mitteilen, dass dies die aktuell zu erwartende Verbindung ist,
          // falls die Seite neu geladen wurde und pendingConnectionId dort verloren gegangen ist.
          this.webrtcService.restorePendingConnection(id);
        }
      }
    } catch (e) {
      console.error("[DEBUG_LOG] WebRTC: Error decoding offer", e);
    }
  }

}
