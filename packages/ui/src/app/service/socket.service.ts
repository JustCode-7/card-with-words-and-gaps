import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {UserService} from "./user.service";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";
import {JoinRoomEvent} from "@cards-with-words-and-gaps/shared/dist/model/event";


const SERVER_URL = 'http://localhost:3000';


@Injectable({providedIn: 'root'})
export class SocketService {

  public socket: Socket = io(SERVER_URL);
  private userService = inject(UserService);

  constructor() {
    this.socket.on('connect', () => console.debug('socketId', this.socket.id))
  }

  public joinRoom(roomId: string) {
    const player: Player = this.userService.getUser();

    const payload: JoinRoomEvent = {roomId, player}
    this.socket.emit("join-room", payload);
  }


}
