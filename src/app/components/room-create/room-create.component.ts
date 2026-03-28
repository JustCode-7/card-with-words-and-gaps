import {Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatChipsModule} from "@angular/material/chips";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSliderModule} from "@angular/material/slider";
import {SocketService} from "../../service/socket.service";
import {PlayerService} from "../../service/player.service";
import {ServerService} from "../../service/server.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";
import * as LZString from 'lz-string';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatProgressBar} from "@angular/material/progress-bar";

@Component({
  selector: 'app-room-create',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatSliderModule,
    MatProgressSpinner,
    MatProgressBar,

  ],
  templateUrl: './room-create.component.html'
})
export class RoomCreateComponent implements OnInit, OnDestroy {

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

  spielerListe = computed(() => this.matchService.game().spieler);
  p2pConnectionId = signal<string | null>(null);
  showScanner = signal(false);
  zoomLevel = signal(2.0);
  hasBarcodeDetector = 'BarcodeDetector' in window;

  waitingP2PConnections = signal<string[]>([]);

  public timeLeft = signal(300); // 5 Minuten
  @ViewChild('statusContainer') statusContainer!: ElementRef;
  @ViewChild('scannerVideo') scannerVideo!: ElementRef<HTMLVideoElement>;
  protected readonly parent = parent;
  private timerInterval: any;
  private scannerInterval: any;

  constructor() {
    effect(() => {
      const active = this.webrtcService.activeConnections();
      const spieler = this.matchService.game().spieler;
      const spielerConnectionIds = spieler.map(s => s.connectionId).filter(id => !!id);

      // Finde alle aktiven Verbindungen, die nicht in der Spielerliste sind
      const waiting = active.filter(id => !spielerConnectionIds.includes(id));

      // Nur aktualisieren, wenn sich die IDs wirklich geändert haben (Vermeidung von unnötigen Re-renders)
      const current = this.waitingP2PConnections();
      if (waiting.length !== current.length || !waiting.every(id => current.includes(id))) {
        this.waitingP2PConnections.set(waiting);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  getIndividualStatus(id?: string) {
    if (this.webrtcService.pendingConnectionId() === null && id && this.webrtcService.individualStatus.has(id)) {
      return signal<'disconnected' | 'connecting' | 'connected'>('connected');
    }
    // Falls keine ID da ist (Host selbst) oder ID unbekannt
    return signal(id ? 'disconnected' : 'connected');
  }

  async ngOnInit(): Promise<void> {
    // Falls wir bereits Host sind (Resolver hat das bereits im SocketService sichergestellt)
    const isHost = this.socketService.isHost();
    if (isHost) {
      const room = this.socketService.getP2PRoomId();
      if (room) {
        this.roomIdControl.setValue(room);

        // Falls noch kein Offer da ist, einen erzeugen
        if (!this.sessionCode()) {
          await this.generateNewOffer();
        }
      }
    }

    this.route.queryParams.subscribe(params => {
      // Parameter können vor oder nach dem Hash stehen
      const answer = params['answer'] || this.getQueryParamFromUrl('answer');
      if (answer && this.socketService.isHost()) {
        console.warn("[DEBUG_LOG] WebRTC: Answer parameter detected in URL for Host");

        // Wir prüfen in einem Intervall, ob die Raum-Session bereit ist (Offer generiert)
        // Sobald sessionCode gesetzt ist, führen wir connect() aus.
        const checkSession = setInterval(() => {
          if (this.sessionCode()) {
            clearInterval(checkSession); // Zuerst Interval stoppen

            console.warn("[DEBUG_LOG] WebRTC: Session ready, auto-connecting with answer code...");
            this.answerCodeControl.setValue(answer);
            this.connect();

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
    this.socketService.isHost.set(true);
    this.socketService.createRoom(room);
    this.matchService.initMatch(room);

    // Initialen Offer erzeugen
    await this.generateNewOffer();

    // Wir beobachten die Spielerliste aus dem MatchService
    // effect() kann hier im constructor genutzt werden, aber für die lokale Komponente ist ein simpler Bind im Template am besten
    // oder wir setzen es hier manuell bei jedem Signal-Update (über effect).
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
    this.startOfferTimer();

    // Eingabefeld für Antwort leeren
    this.answerCodeControl.setValue('');
  }

  copyLink() {
    navigator.clipboard.writeText(this.joinLink());
  }

  async connect() {
    const value = this.answerCodeControl.value;
    if (value) {
      let answer = this.extractAnswerFromValue(value);

      console.log("[DEBUG_LOG] WebRTC: Connecting with answer...");
      await this.webrtcService.handleAnswer(answer);
      // Wir bleiben auf der Seite, bis der Host das Spiel startet
      // Der Gast wird über WebRTC 'join-room' senden, was die Liste aktualisiert

      // Eingabefeld für Antwort leeren, nachdem der Spieler hinzugefügt wurde
      this.answerCodeControl.setValue('');

      // Nach dem Hinzufügen zum Netzwerk-Status scrollen
      setTimeout(() => {
        if (this.statusContainer) {
          this.statusContainer.nativeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
      }, 100);

      // Automatisch einen neuen Offer-Code für den nächsten Gast generieren
      console.log("[DEBUG_LOG] WebRTC: Auto-generating new offer for the next guest...");
      await this.generateNewOffer();
    }
  }

  toggleScanner() {
    if (this.showScanner()) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  async startScanner() {
    this.showScanner.set(true);
    this.zoomLevel.set(1); // Reset zoom on start
    try {
      const constraints: any = {
        video: {
          facingMode: 'environment',
          focusMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Erweiterte Video-Constraints fehlgeschlagen, Fallback auf Standard.");
        stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
      }

      if (this.scannerVideo) {
        this.scannerVideo.nativeElement.srcObject = stream;
        this.scannerVideo.nativeElement.play();
        this.initScannerLoop();
      }
    } catch (err) {
      console.error("Fehler beim Starten der Kamera:", err);
      this.showScanner.set(false);
      alert("Kamera konnte nicht gestartet werden. Bitte prüfen Sie die Berechtigungen.");
    }
  }

  async setZoom(value: number) {
    const stream = this.scannerVideo?.nativeElement.srcObject as MediaStream;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};

    if (!capabilities.zoom) {
      console.warn("Zoom wird von dieser Kamera nicht unterstützt.");
      return;
    }

    const minZoom = capabilities.zoom.min || 1;
    const maxZoom = capabilities.zoom.max || 1;

    // Den Wert auf den unterstützten Bereich begrenzen
    const targetZoom = Math.min(Math.max(value, minZoom), maxZoom);

    try {
      await track.applyConstraints({
        advanced: [{zoom: targetZoom}]
      } as any);
      this.zoomLevel.set(targetZoom);
    } catch (e) {
      console.error("Fehler beim Anwenden des Zooms:", e);
    }
  }

  stopScanner() {
    if (this.scannerInterval) {
      clearInterval(this.scannerInterval);
      this.scannerInterval = null;
    }
    if (this.scannerVideo && this.scannerVideo.nativeElement.srcObject) {
      const stream = this.scannerVideo.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.scannerVideo.nativeElement.srcObject = null;
    }
    this.showScanner.set(false);
  }

  startGame() {
    const room = this.roomIdControl.value!;
    const playerName = this.playerService.getPlayer().name;
    this.router.navigate(['game', room, playerName, 'catlord']);
  }

  public deleteRoom() {
    // Inform all guests and cleanup
    this.serverService.stopServer();

    // Reset local UI state
    this.socketService.clearP2PState();
    this.p2pConnectionId.set(null);
    this.roomIdControl.reset();
  }

  startOfferTimer() {
    this.timeLeft.set(300); // Reset auf 5 Min
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.set(this.timeLeft() - 1);
      } else {
        clearInterval(this.timerInterval);
        // Optional: Logik um das Offer im WebRTC-Service zu invalidieren
      }
    }, 1000);
  }

  formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return signal<string>(`${mins}:${secs.toString().padStart(2, '0')}`);
  }

  protected getHeightFocusBox() {
    return this.scannerVideo?.nativeElement.offsetHeight * 0.5 || 200;
  }

  protected getWidthFocusBox() {
    return this.scannerVideo?.nativeElement.offsetWidth * 0.25 || 200;
  }

  private initScannerLoop() {
    if (!this.hasBarcodeDetector) return;

    // @ts-ignore
    const barcodeDetector = new BarcodeDetector({formats: ['qr_code']});
    this.scannerInterval = setInterval(async () => {
      if (!this.showScanner() || !this.scannerVideo) return;
      try {
        const barcodes = await barcodeDetector.detect(this.scannerVideo.nativeElement);
        if (barcodes.length > 0) {
          const qrCodeValue = barcodes[0].rawValue;
          if (qrCodeValue) {
            console.log("QR-Code erkannt:", qrCodeValue.substring(0, 30));
            this.handleScannedValue(qrCodeValue);
          }
        }
      } catch (e) {
        // Silently fail if detection fails
      }
    }, 150); // Noch kürzeres Intervall
  }

  private handleScannedValue(value: string) {
    console.log("[DEBUG_LOG] WebRTC: Processing scanned value:", value.substring(0, 50) + "...");
    const answer = this.extractAnswerFromValue(value);

    if (answer && answer.length > 50) { // Ein gültiger Code ist meist recht lang
      console.log("[DEBUG_LOG] WebRTC: Valid answer found, auto-connecting...");
      this.answerCodeControl.setValue(answer);
      this.stopScanner();
      this.connect();
    }
  }

  private extractAnswerFromValue(value: string): string {
    let rawValue = value.trim();

    // 1. Versuche, den 'answer' Parameter aus einer URL zu extrahieren
    try {
      const urlObj = new URL(rawValue.startsWith('http') ? rawValue : 'http://localhost/' + rawValue);
      let param = urlObj.searchParams.get('answer');

      if (!param && rawValue.includes('#')) {
        const hashPart = rawValue.split('#')[1];
        if (hashPart.includes('?')) {
          const hashQuery = hashPart.split('?')[1];
          const hashParams = new URLSearchParams(hashQuery);
          param = hashParams.get('answer');
        }
      }

      if (!param) {
        const match = rawValue.match(/[?&]answer=([^&#]+)/);
        if (match) {
          param = decodeURIComponent(match[1]);
        }
      }

      if (param) {
        return param;
      }
    } catch (e) {
      const match = rawValue.match(/[?&]answer=([^&#]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // Wenn es keine URL mit answer-Parameter ist, geben wir den getrimmten String zurück
    return rawValue;
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

  private getQueryParamFromUrl(name: string): string | null {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    } catch (e) {
      return null;
    }
  }
}
