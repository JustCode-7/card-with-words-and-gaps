import {inject, Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {UserService} from "./user.service";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";


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
    console.log("joining room", roomId);
    this.socket.emit("join-room", {roomId, player});

    this.socket.on('join-room', data => console.log('[join-room] received', data));
  }


}
