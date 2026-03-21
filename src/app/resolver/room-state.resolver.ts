import {ResolveFn} from '@angular/router';
import {inject} from "@angular/core";
import {SocketService} from "../service/socket.service";
import {MatchService} from "../service/match.service";

/**
 * Resolver, der sicherstellt, dass der Host-Status und die Raum-Session
 * im SocketService und MatchService wiederhergestellt sind, bevor
 * die /new-game Route geladen wird.
 */
export const roomStateResolver: ResolveFn<boolean> = () => {
  const socketService = inject(SocketService);
  const matchService = inject(MatchService);

  const isHost = socketService.isHost();
  const room = socketService.getP2PRoomId();

  console.log(`[DEBUG_LOG] RoomStateResolver: Host status: ${isHost}, Room: ${room}`);

  if (room) {
    // Wir rufen initMatch immer auf, um sicherzustellen, dass die Daten aus dem ServerService geladen werden
    matchService.initMatch(room);
    return true;
  }

  return true;
};
