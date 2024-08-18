import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {Observable} from "rxjs";
import {MYAction, SocketEvent} from "../util/client-enums";
import {Spieler} from "../model/spieler-model";
import {Game} from "../model/game-model";
import {UserService} from "./user.service";
import {Player} from "../model/player";


const SERVER_URL = 'http://localhost:3000';


@Injectable({providedIn: 'root'})
export class SocketService {

  public socket: Socket = io(SERVER_URL);
  private userService = inject(UserService);

  public createRoom(room: string) {
    this.socket.emit("create-room", room);
  }

  public joinRoom(roomId: string) {
    const player: Player = this.userService.getUser();
    console.log("joining room", roomId, player);
    this.socket.emit("join-room", {roomId, player});

    this.socket.on('join-room', data => console.log('[join-room] received', data));
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
