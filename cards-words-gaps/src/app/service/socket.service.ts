import {Injectable} from '@angular/core';
import socketIo, {Socket} from 'socket.io-client';
import {DefaultEventsMap} from '@socket.io/component-emitter';
import {Observable} from "rxjs";
import {SocketEvent} from "../util/client-enums";

const SERVER_URL = 'http://localhost:3000';

export interface Message {

}

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;

  public initSocket(): void {
    this.socket = socketIo(SERVER_URL);
  }

  public send(message: Message): void {
    this.socket!.emit('message', message);
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

}
