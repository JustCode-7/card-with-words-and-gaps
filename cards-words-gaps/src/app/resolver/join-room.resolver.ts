import {ResolveFn} from '@angular/router';
import {SocketService} from "../service/socket.service";
import {inject} from "@angular/core";

export const joinRoomResolver: ResolveFn<boolean> = (route, state) => {

  const room = route.paramMap.get('room');

  if (room == null) {
    console.error("room not present in route")
    return false;
  }

  inject(SocketService).joinRoom(room)

  return true;
};
