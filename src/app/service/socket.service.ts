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
    // Initialize the socket connection
    this.connectToServer();

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

    // Listen for server URL changes and reconnect
    this.serverUrl.subscribe(url => {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.socket = io(url);
      this.setupSocketListeners();
    });

    // Listen for server status changes
    this.serverService.isServerRunning.subscribe(isRunning => {
      this.isHost.next(isRunning);

      // If we're the host, add window unload event listener to stop the server when the window is closed
      if (isRunning) {
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      } else {
        window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      }
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

    // Connect to the local server
    this.serverUrl.next(this.serverService.serverUrl);

    // After connecting, create the room
    if (this.socket) {
      this.socket.emit("create-room", room);
    }
  }

  public joinRoom(roomId: string) {
    if (!this.socket) return;

    const player: Player = this.playerService.getPlayer();
    console.log("joining room", roomId, player);
    this.socket.emit("join-room", {roomId, player});
  }

  public sendRoomID(event: string, roomid: string): void {
    if (!this.socket) return;
    this.socket.emit(event, roomid);
  }

  public sendGameWithRoomID(event: string, roomid: string, game: Game): void {
    // Use ServerService to set the game
    this.serverService.setGame(roomid, game);

    // Also emit the event directly if we're not the host
    if (!this.isHost.value && this.socket) {
      this.socket.emit(event, roomid, game);
    }
  }

  public sendUpdateGame(event: string, game: Game): void {
    // Send via WebRTC
    this.webrtcService.sendMessage({event: 'game', data: game});

    // Use ServerService to update the game
    this.serverService.updateGame(game);

    // Also emit the event directly if we're not the host
    if (!this.isHost.value && this.socket) {
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
          if (this.socket) {
            this.socket.emit('game', game);
          }
        }, 0);
      }
    } else if (this.socket) {
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
    if (!this.socket) return;

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

  public setP2PRoomId(roomId: string) {
    this.currentP2PRoomId = roomId;
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
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
      console.log("[DEBUG_LOG] Game update received via WebRTC", msg.data);
      this.serverService.updateGame(msg.data);
      // Den MatchService über das Subject informieren (löst Circular Dependency)
      this.p2pGameUpdate$.next(msg.data);
    } else if (msg.event === 'join-room' && this.isHost.value) {
      // Wenn wir der Host sind, registrieren wir den beigetretenen P2P-Spieler
      const {roomId, player} = msg.data;
      console.log("P2P player joined room", roomId, player);
      this.serverService.addPlayerToRoom(roomId, player);

      // Als Host schicken wir dem neuen Spieler sofort den aktuellen Spielstatus
      const currentGame = this.serverService.getGame(roomId);
      if (currentGame) {
        console.log("[DEBUG_LOG] Host pushing current game to new P2P player", roomId);
        this.webrtcService.sendMessage({
          event: 'game',
          data: currentGame
        });
      }
    }
  }

  private joinRoomViaWebRTC() {
    const player: Player = this.playerService.getPlayer();
    if (!player.name) {
      console.warn("P2P-Join verzögert: Spielername noch nicht gesetzt");
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
    // Nur verbinden, wenn eine URL gesetzt ist und wir nicht im reinen P2P-Modus sind
    if (!url || url === 'http://localhost:4200' || url === window.location.origin) {
      console.log("No external server URL set, operating in P2P/Local mode.");
      return;
    }
    console.log(`Connecting to server at ${url}`);
    this.socket = io(url);
    this.setupSocketListeners();
  }

}
