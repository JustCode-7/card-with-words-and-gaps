import {inject, Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {io, Socket} from 'socket.io-client';
import {environment} from "../../environments/environment";
import {WebRTCService} from "./webrtc.service";

interface Player {
  id: string;
  name: string;
  connectionId?: string;
}

interface Room {
  roomId: string;
  createdTimestampMilliseconds: number;
  players: Player[];
}

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  public isServerRunning = new BehaviorSubject<boolean>(false);
  public serverPort = 3000;
  // Use a local server for development
  public serverUrl = environment.socketUrl;
  private socket: Socket | null = null;
  private rooms: Map<string, Room> = new Map();
  private games: Map<string, any> = new Map();
  private webrtcService = inject(WebRTCService);

  constructor() {
    this.restoreState();
  }

  public startServer(roomId: string): void {
    localStorage.setItem('isHost', 'true');
    localStorage.setItem('currentP2PRoomId', roomId);
    this.saveState(); // Sicherstellen, dass der State sofort gespeichert wird

    if (this.isServerRunning.value) {
      console.log('Server is already running');
      return;
    }

    try {
      // Auf GitHub Pages (window.location.origin) oder Localhost (für P2P-Tests) läuft kein Socket-Server.
      if (window.location.origin.includes('github.io') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
        console.log("P2P mode detected: Running ServerService in memory mode (No Socket.io).");
        this.socket = null;
        this.createRoom(roomId);
        this.isServerRunning.next(true);
        return;
      }

      // Connect to the server
      this.socket = io(this.serverUrl);

      // Set up socket events
      this.setupSocketEvents();

      // Create the initial room
      this.createRoom(roomId);

      // Mark server as running
      this.isServerRunning.next(true);
      console.log(`Connected to server at ${this.serverUrl}`);
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  }

  public stopServer(): void {
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentP2PRoomId');
    localStorage.removeItem('p2p_saved_games');

    if (!this.isServerRunning.value) {
      console.log('Server is not running');
      return;
    }

    try {
      // Vor dem Schließen alle P2P-Gäste informieren
      this.webrtcService.sendMessage({event: 'room-deleted'});
      this.webrtcService.closeAllConnections();

      if (this.socket) {
        this.socket.disconnect();
      }
      this.socket = null;
      this.rooms.clear();
      this.games.clear();
      this.isServerRunning.next(false);
      console.log('Disconnected from server');
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  }

  public setGame(roomId: string, game: any): void {
    console.log(`SET GAME for room ${roomId}`);
    this.games.set(roomId, game);
    this.saveState();

    // Emit setGame event to the server
    if (this.socket && !window.location.origin.includes('github.io') && !window.location.origin.includes('localhost')) {
      this.socket.emit('setGame', roomId, game);
    }
  }

  public getGame(roomId: string): any {
    const game = this.games.get(roomId);
    if (!game) {
      // Check if we can restore from localStorage specifically for this room
      const savedGames = localStorage.getItem('p2p_saved_games');
      if (savedGames) {
        try {
          const gamesObj = JSON.parse(savedGames);
          if (gamesObj[roomId]) {
            console.log(`[SERVER] On-demand restore for room ${roomId}`);
            this.games.set(roomId, gamesObj[roomId]);
            return gamesObj[roomId];
          }
        } catch (e) {
        }
      }
    }
    return game;
  }

  public updateGame(game: any): void {
    if (!game || !game.gameHash) return;

    // console.log(`UPDATE GAME for room ${game.gameHash}`);
    this.games.set(game.gameHash, game);
    this.saveState();

    // Emit updateGame event to the server only if NOT on GitHub Pages
    if (this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit('updateGame', game);
      this.socket.emit('game', game);
    }
  }

  public addPlayerToRoom(roomId: string, player: Player): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.createRoom(roomId);
    }
    this.joinRoom(roomId, player);

    // Wir müssen das Game-Objekt für diesen Raum ebenfalls aktualisieren,
    // damit die neue Spielerliste dort enthalten ist.
    const game = this.games.get(roomId);
    if (game) {
      // Prüfen, ob der Spieler bereits im Spiel-Objekt ist (Vermeidung von Dubletten via ID)
      const existingInGame = game.spieler.find((s: any) => s.id === player.id);

      if (!existingInGame) {
        console.log(`[SERVER] Adding new player ${player.name} (${player.id}) to game state`);
        // Dem neuen Spieler Karten zuweisen, falls welche da sind
        let playerCards: string[] = [];
        if (game.answerset && game.answerset.length >= 10) {
          playerCards = game.answerset.splice(0, 10);
        }

        game.spieler.push({
          id: player.id,
          name: player.name,
          points: 0,
          cards: playerCards,
          selectedCards: [],
          catLord: false,
          ready: false,
          connectionId: player.connectionId
        });
      } else {
        console.log(`[SERVER] Player ${player.name} (${player.id}) already exists, updating info`);
        // Namen und connectionId aktualisieren
        existingInGame.name = player.name;
        if (player.connectionId) {
          existingInGame.connectionId = player.connectionId;
        }
        // Falls der existierende Spieler keine Karten hat oder weniger als 10
        if (existingInGame.cards.length < 10 && game.answerset && game.answerset.length >= (10 - existingInGame.cards.length)) {
          console.log(`[SERVER] Refilling cards for ${player.name} (${player.id})`);
          const cardsNeeded = 10 - existingInGame.cards.length;
          existingInGame.cards.push(...game.answerset.splice(0, cardsNeeded));
        }
      }

      this.games.set(roomId, game);
    }
  }

  public saveState(): void {
    const gamesObj: { [key: string]: any } = {};
    this.games.forEach((value, key) => {
      gamesObj[key] = value;
    });
    localStorage.setItem('p2p_saved_games', JSON.stringify(gamesObj));
  }

  private restoreState(): void {
    const isHost = localStorage.getItem('isHost') === 'true';
    const roomId = localStorage.getItem('currentP2PRoomId');
    if (isHost && roomId) {
      console.log(`[SERVER] Restoring server state for room: ${roomId}`);
      const savedGames = localStorage.getItem('p2p_saved_games');
      if (savedGames) {
        try {
          const gamesObj = JSON.parse(savedGames);
          Object.keys(gamesObj).forEach(key => {
            this.games.set(key, gamesObj[key]);
            console.log(`[SERVER] Restored game for ${key} with ${gamesObj[key].spieler?.length} players`);
          });
        } catch (e) {
          console.error("[SERVER] Failed to restore games from localStorage", e);
        }
      } else {
        console.warn(`[SERVER] No games found in p2p_saved_games! Host: ${isHost}, Room: ${roomId}. LocalStorage keys: ${Object.keys(localStorage).join(', ')}`);
      }
      // Raum-Zustand ebenfalls herstellen
      if (!this.rooms.has(roomId)) {
        this.createRoom(roomId);
      }

      // Falls wir ein Game-Objekt haben, stellen wir sicher, dass die Spieler auch im Raum sind
      const game = this.games.get(roomId);
      if (game && game.spieler) {
        const room = this.rooms.get(roomId);
        if (room) {
          room.players = game.spieler.map((s: any) => ({
            id: s.id,
            name: s.name,
            connectionId: s.connectionId
          }));
          console.log(`[SERVER] Restored ${room.players.length} players to room ${roomId}`);
        }
      }

      this.isServerRunning.next(true);
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    // Listen for room-related events
    this.socket.on('room-list', (roomList: string[]) => {
      console.log('Received room list:', roomList);
      // Update local room list
      roomList.forEach(roomId => {
        if (!this.rooms.has(roomId)) {
          this.createRoom(roomId);
        }
      });
    });

    // Listen for game-related events
    this.socket.on('game', (game: any) => {
      console.log('Received game update:', game);
      if (game && game.gameHash) {
        this.games.set(game.gameHash, game);
      }
    });

    // Listen for player-related events
    this.socket.on('room-players', (players: Player[]) => {
      console.log('Received room players:', players);
      // Update local player list
    });

    // Listen for connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  private createRoom(roomId: string): void {
    const newRoom: Room = {
      roomId: roomId,
      createdTimestampMilliseconds: Date.now(),
      players: [],
    };
    this.rooms.set(roomId, newRoom);

    // Emit create-room event to the server
    if (this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit('create-room', roomId);
    }
  }

  private joinRoom(roomId: string, player: Player): void {
    const existingRoom = this.rooms.get(roomId);
    if (existingRoom === undefined) {
      throw new Error(`room ${roomId} does not exist`);
    }

    const updatedRoom = {
      ...existingRoom,
      players: [
        ...existingRoom.players,
        player,
      ]
    };
    this.rooms.set(roomId, updatedRoom);

    // Emit join-room event to the server
    if (this.socket && !window.location.origin.includes('github.io')) {
      this.socket.emit('join-room', {roomId, player});
    }
  }

  private getRoomIds(): string[] {
    return [...this.rooms.keys()];
  }

  private getRoomById(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (room === undefined) {
      throw new Error(`room '${roomId}' not found`);
    }
    return room;
  }
}
