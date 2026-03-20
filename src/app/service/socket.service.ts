import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {MYAction, SocketEvent} from "../util/client-enums";
import {Spieler} from "../model/spieler-model";
import {Game} from "../model/game-model";
import {PlayerService} from "./player.service";
import {Player} from "../model/Player";
import {DataService} from "./data.service";
import {ServerService} from "./server.service";
import {environment} from "../../environments/environment";
import {WebRTCService} from "./webrtc.service";

@Injectable({providedIn: 'root'})
export class SocketService {

  // Track if this client is hosting a server
  public isHost = new BehaviorSubject<boolean>(false);
  public p2pGameUpdate$ = new Subject<Game>();
  private socket: Socket | null = null;
  private playerService = inject(PlayerService);
  private dataService = inject(DataService);
  private serverService = inject(ServerService);
  private webrtcService = inject(WebRTCService);

  // Zwischenspeicher für den aktuellen P2P-Raumnamen (um Circular Dependency mit MatchService zu vermeiden)
  private currentP2PRoomId: string | null = null;
  // Track the current server URL
  private serverUrl = new BehaviorSubject<string>(environment.socketUrl);

  constructor() {
    // Listen for WebRTC messages
    this.webrtcService.message$.subscribe(msg => {
      this.handleWebRTCMessage(msg);
    });

    // Automatisch beitreten, wenn P2P verbunden ist (nur für Gäste)
    this.webrtcService.connectionStatus.subscribe(status => {
      if (status === 'connected' && !this.isHost.value) {
        // Wir nehmen den Raum-Namen aus dem MatchService
        this.joinRoomViaWebRTC();
      }
    });

    // Sockets nur initialisieren, wenn NICHT auf GitHub Pages oder Localhost (für P2P Tests)
    if (!window.location.origin.includes('github.io') && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      this.connectToServer();

      // Listen for server URL changes and reconnect
      this.serverUrl.subscribe(url => {
        if (!url) return;
        if (this.socket) {
          this.socket.disconnect();
        }
        this.socket = io(url);
        this.setupSocketListeners();
      });
    } else {
      console.log("GitHub Pages mode: All socket logic disabled.");
    }

    // Listen for server status changes
    this.serverService.isServerRunning.subscribe(isRunning => {
      this.isHost.next(isRunning);

      // Add window unload event listener to warn about P2P disconnect
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    });
  }

  public onRoomListener(): void {
    if (!this.socket) return;
    // We're already listening for room-list events in setupSocketListeners
  }

  public offRoomListener() {
    // No need to remove the listener as it's handled in the reconnection logic
  }

  public createRoom(room: string) {
    // Start a server instance on this client
    this.serverService.startServer(room);

    // Auf GitHub Pages (window.location.origin) oder Localhost läuft kein Socket-Server (für P2P-Tests).
    if (window.location.origin.includes('github.io') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
      console.log("P2P mode detected: Skipping local socket connection, using pure P2P mode.");
      this.isHost.next(true);
      return;
    }

    // Connect to the local server
    this.serverUrl.next(this.serverService.serverUrl);

    // After connecting, create the room
    if (this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit("create-room", room);
    }
  }

  public joinRoom(roomId: string) {
    if (!this.socket || window.location.origin.includes('github.io') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
      console.log("JoinRoom: Socket skipped due to P2P mode.");
      return;
    }

    const player: Player = this.playerService.getPlayer();
    console.log("joining room", roomId, player);
    this.socket.emit("join-room", {roomId, player});
  }

  public sendRoomID(event: string, roomid: string): void {
    if (!this.socket || window.location.origin.includes('github.io')) return;
    this.socket.emit(event, roomid);
  }

  public sendGameWithRoomID(event: string, roomid: string, game: Game): void {
    // Use ServerService to set the game
    this.serverService.setGame(roomid, game);

    // Also emit the event directly if we're not the host
    if (!this.isHost.value && this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit(event, roomid, game);
    }
  }

  public sendUpdateGame(event: string, game: Game): void {
    // Wenn wir der Host sind, aktualisieren wir unseren lokalen Server-State
    if (this.isHost.value) {
      this.serverService.updateGame(game);
      // IMMER via WebRTC an alle Gäste senden
      this.webrtcService.sendMessage({event: 'game', data: game});
    } else {
      // Wenn wir ein Gast sind, schicken wir das Update via WebRTC an den Host
      console.log("[DEBUG_LOG] Guest: Sending game update to host via WebRTC");
      this.webrtcService.sendMessage({event: 'game', data: game});
    }

    // Falls wir doch in einem echten Socket-Netzwerk sind, emittieren wir auch dort
    if (!this.isHost.value && this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit(event, game);
    }
  }

  public sendGetGame(event: string, roomid: string): void {
    // If we're the host, we can get the game directly from ServerService
    if (this.isHost.value) {
      const game = this.serverService.getGame(roomid);
      if (game) {
        // Simulate receiving the game from the server
        setTimeout(() => {
          // Im P2P Modus informieren wir den MatchService direkt über den Stream
          this.p2pGameUpdate$.next(game);

          if (this.socket && !window.location.origin.includes('github.io')) {
            this.socket.emit('game', game);
          }
        }, 0);
      }
    } else if (this.socket && !window.location.origin.includes('github.io')) {
      // Otherwise, request the game from the server
      this.socket.emit(event, roomid);
    }
  }

  public getGame(): Observable<Game> {
    return new Observable<Game>((observer) => {
      // Listen for game updates from the server
      if (this.socket) {
        this.socket.on('game', (game: Game) => {
          if (game) {
            observer.next(game);
          }
        });
      }

      // If we're the host, we can also check for local game updates
      if (this.isHost.value) {
        // We'll rely on the server events for now
      }
    });
  }

  public getRoomID(): Observable<string[]> {
    return new Observable<string[]>((observer) => {
      if (!this.socket) return;
      this.socket.on('roomID', (rooms: string[]) => observer.next(rooms));
    });
  }

  public onEvent(event: SocketEvent): Observable<any> {
    return new Observable<any>((observer) => {
      if (!this.socket) return;
      this.socket.on(event, () => observer.next(true));
    });
  }

  public sendNotification(params: any, action: MYAction, user: Spieler): void {
    if (!this.socket || window.location.origin.includes('github.io')) return;

    let message = {};
    if (action === MYAction.JOINED) {
      message = {
        from: user,
        action: action
      }
    } else if (action === MYAction.RENAME) {
      message = {
        action: action,
        content: {
          username: user?.name,
          previousUsername: params.previousUsername
        }
      };
    }

    this.socket.emit('notification', message);
  }

  public getPlayerId(): string {
    return this.playerService.getPlayer().id;
  }

  public setP2PRoomId(roomId: string) {
    this.currentP2PRoomId = roomId;
  }

  public requestGameViaWebRTC(roomId: string) {
    // Bevor wir Daten anfragen, stellen wir sicher, dass wir im Raum angemeldet sind
    this.joinRoomViaWebRTC();

    console.log("[DEBUG_LOG] Gast: sending request-game via WebRTC for room", roomId);
    this.webrtcService.sendMessage({
      event: 'request-game',
      data: {roomId}
    });
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    // Warnung für alle Spieler auf GitHub Pages (da P2P bei Reload abbricht)
    if (window.location.origin.includes('github.io')) {
      event.preventDefault();
      event.returnValue = 'Bei einem Reload der Seite wird die P2P-Verbindung unterbrochen und das Spiel für dich beendet.';
      return event.returnValue;
    }

    // If we're the host, stop the server when the window is closed
    if (this.isHost.value) {
      console.log('Host is leaving, stopping server...');
      this.serverService.stopServer();

      // Show a confirmation dialog to warn the user
      event.preventDefault();
      event.returnValue = 'Als Host wird der Server beendet, wenn du die Seite verlässt. Alle Spieler werden getrennt.';
      return event.returnValue;
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Set up room list listener
    this.socket.on("room-list", (roomList: string[]) => {
      this.dataService.roomListSignal.set(roomList);
    });

    // Set up other listeners
    this.socket.on('game', (game: Game) => {
      // Game updates will be handled by subscribers to getGame()
    });
  }

  private handleWebRTCMessage(msg: any) {
    if (msg.event === 'game') {
      // Wenn wir eine Nachricht empfangen, aktualisieren wir unseren lokalen State
      console.log(`[DEBUG_LOG] P2P: Received game update. Host: ${this.isHost.value}`);
      // Force reference update to trigger signals/effects
      const gameCopy = JSON.parse(JSON.stringify(msg.data));
      this.serverService.updateGame(gameCopy);
      this.p2pGameUpdate$.next(gameCopy);

      // Wenn wir der Host sind, müssen wir dieses Update an ALLE anderen Gäste broadcasten
      if (this.isHost.value) {
        console.log("[DEBUG_LOG] Host: Received P2P game update, broadcasting to all peers");
        this.webrtcService.sendMessage({
          event: 'game',
          data: gameCopy
        });
      }
    } else if (msg.event === 'request-game' && this.isHost.value) {
      const {roomId} = msg.data;
      console.log("[DEBUG_LOG] Host: received request-game via WebRTC for room", roomId);
      const currentGame = this.serverService.getGame(roomId);
      if (currentGame) {
        this.webrtcService.sendMessage({
          event: 'game',
          data: currentGame
        });
      }
    } else if (msg.event === 'join-room' && this.isHost.value) {
      // Wenn wir der Host sind, registrieren wir den beigetretenen P2P-Spieler
      const {roomId, player} = msg.data;
      console.log(`[DEBUG_LOG] Host: P2P player ${player.name} (${player.id}) joining room ${roomId}`);

      // Den Spieler im ServerService hinzufügen
      this.serverService.addPlayerToRoom(roomId, player);

      // Den lokalen MatchService des Hosts informieren
      const updatedGame = this.serverService.getGame(roomId);
      if (updatedGame) {
        console.log(`[DEBUG_LOG] Host: game updated, now has ${updatedGame.spieler.length} players`);
        // Force reference update to trigger signals/effects
        const gameCopy = JSON.parse(JSON.stringify(updatedGame));
        this.p2pGameUpdate$.next(gameCopy);

        // Alle Gäste mit dem aktuellen Spielstatus informieren (Broadcast)
        this.webrtcService.sendMessage({
          event: 'game',
          data: gameCopy
        });
      }
    }
  }

  private joinRoomViaWebRTC() {
    console.warn("[DEBUG_LOG] joinRoomViaWebRTC called. Host status:", this.isHost.value);

    const player: Player = this.playerService.getPlayer();
    if (!player.name || player.name === 'undefined' || player.name === 'null') {
      console.warn("P2P-Join verzögert: Spielername noch nicht gesetzt oder ungültig:", player.name);
      return;
    }

    const roomId = this.currentP2PRoomId || "P2P-Room";
    console.log(`[DEBUG_LOG] P2P-Join send: room=${roomId}, player=${player.name}`);

    this.webrtcService.sendMessage({
      event: 'join-room',
      data: {roomId, player}
    });
  }

  private connectToServer(): void {
    const url = this.serverUrl.value;
    // Auf GitHub Pages (window.location.origin) oder Localhost (für P2P-Tests) läuft kein Socket.io-Server.
    if (!url || url.includes('github.io') || url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log("P2P mode: Operating in P2P/Local mode only.");
      return;
    }

    console.log(`Connecting to server at ${url}`);
    this.socket = io(url);
    this.setupSocketListeners();
  }

}
