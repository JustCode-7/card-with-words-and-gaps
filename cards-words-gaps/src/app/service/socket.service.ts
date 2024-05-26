import {Injectable} from '@angular/core';
import socketIo, {Socket} from 'socket.io-client';
import {DefaultEventsMap} from '@socket.io/component-emitter';
import {Observable} from "rxjs";
import {MYAction, SocketEvent} from "../util/client-enums";
import {Spieler} from "../modal/spieler-model";
import {Game} from "../modal/game-model";

const SERVER_URL = 'http://localhost:3000';

export interface Message {

}

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  messageContent: null | undefined;

  public initSocket(): void {
    this.socket = socketIo(SERVER_URL);
  }

  public send(event: string, message: Message, game?: string): void {
    this.socket!.emit(event, message, game);
  }

  public getGame(): Observable<Game> {
    return new Observable<Game>((observer: { next: (arg0: Game) => void; }) => {
      this.socket!.on('game', (game: string) => observer.next(JSON.parse(game)));
    });
  }

  public getRoomID(): Observable<string[]> {
    return new Observable<string[]>((observer: { next: (arg0: string[]) => void; }) => {
      this.socket!.on('roomID', (rooms: string[]) => observer.next(rooms));
    });
  }

  public onMessage(): Observable<Message> {
    return new Observable<Message>((observer: { next: (arg0: Message) => void; }) => {
      this.socket!.on('message', (data: Message) => observer.next(data));
    });
  }

  public onEvent(event: SocketEvent): Observable<any> {
    return new Observable<Event>((observer: { next: () => any; }) => {
      this.socket!.on(event, () => observer.next());
    });
  }

  public sendMessage(message: string, user: Spieler): void {
    if (!message) {
      return;
    }

    this.messageContent = null;
  }

  public sendNotification(params: any, action: MYAction, user:Spieler): void {
    let message: Message;

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
