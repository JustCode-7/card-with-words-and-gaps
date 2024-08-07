import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {BehaviorSubject, Observable} from "rxjs";
import {MYAction, SocketEvent} from "../util/client-enums";
import {Spieler} from "../model/spieler-model";
import {Game} from "../model/game-model";
import {PlayerService} from "./player.service";
import {Player} from "../model/Player";


const SERVER_URL = 'http://localhost:3000';


@Injectable({providedIn: 'root'})
export class SocketService {

  private socket: Socket = io(SERVER_URL);
  private playerService = inject(PlayerService);

  public rooms$ = new BehaviorSubject<string[]>([]);

  private roomListener(rooms: string[]) {
    this.rooms$.next(rooms);
  }

  public onRoomListener(): Observable<string[]> {
    this.socket.on("room-list", this.roomListener);
    return this.rooms$.asObservable();
  }

  public offRoomListener() {
    this.socket.off("room-list", this.roomListener);
  }

  public createRoom(room: string) {
    this.socket.emit("create-room", room);
  }

  public joinRoom(roomName: string) {
    const player: Player = this.playerService.getPlayer();
    console.log("joining room", roomName, player);
    this.socket.emit("join-room", roomName, player);
  }

  // +++++++++++++++++++++++++++++++++++++++
  // +++++++++++++++++++++++++++++++++++++++
  // OLD STUFF BELOW
  // +++++++++++++++++++++++++++++++++++++++
  // +++++++++++++++++++++++++++++++++++++++
  public sendRoomID(event: string, roomid: string): void {
    this.socket.emit(event, roomid);
  }

  public sendGameWithRoomID(event: string, roomid: string, game: Game): void {
    this.socket.emit(event, roomid, game);
  }

  public sendUpdateGame(event: string, game: Game): void {
    this.socket.emit(event, game);
  }

  public sendGetGame(event: string, roomid: string): void {
    this.socket.emit(event, roomid);
  }

  public getGame(): Observable<Game> {
    return new Observable<Game>((observer: { next: (arg0: Game) => void; }) => {
      this.socket.on('game', (game: Game) => observer.next(game));
    });
  }

  public getRoomID(): Observable<string[]> {
    return new Observable<string[]>((observer: { next: (arg0: string[]) => void; }) => {
      this.socket.on('roomID', (rooms: string[]) => observer.next(rooms));
    });
  }

  public onEvent(event: SocketEvent): Observable<any> {
    return new Observable<Event>((observer: { next: () => any; }) => {
      this.socket.on(event, () => observer.next());
    });
  }

  public sendNotification(params: any, action: MYAction, user: Spieler): void {
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

    // @ts-ignore
    this.socketService.send(message);
  }

}
