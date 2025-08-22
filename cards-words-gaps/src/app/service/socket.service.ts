import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {BehaviorSubject, Observable} from "rxjs";
import {MYAction, SocketEvent} from "../util/client-enums";
import {Spieler} from "../model/spieler-model";
import {Game} from "../model/game-model";
import {PlayerService} from "./player.service";
import {Player} from "../model/Player";
import {DataService} from "./data.service";
import {ServerService} from "./server.service";

@Injectable({providedIn: 'root'})
export class SocketService {

  private socket: Socket | null = null;
  private playerService = inject(PlayerService);
  private dataService = inject(DataService);
  private serverService = inject(ServerService);

  // Track if this client is hosting a server
  public isHost = new BehaviorSubject<boolean>(false);
  // Track the current server URL
  private serverUrl = new BehaviorSubject<string>('http://localhost:3000');

  constructor() {
    // Initialize the socket connection
    this.connectToServer();

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

  private connectToServer(): void {
    const url = this.serverUrl.value;
    console.log(`Connecting to server at ${url}`);
    this.socket = io(url);
    this.setupSocketListeners();
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
    return new Observable<Game>((observer: { next: (arg0: Game) => void; }) => {
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
    return new Observable<string[]>((observer: { next: (arg0: string[]) => void; }) => {
      if (!this.socket) return;
      this.socket.on('roomID', (rooms: string[]) => observer.next(rooms));
    });
  }

  public onEvent(event: SocketEvent): Observable<any> {
    return new Observable<Event>((observer: { next: () => any; }) => {
      if (!this.socket) return;
      this.socket.on(event, () => observer.next());
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

}
