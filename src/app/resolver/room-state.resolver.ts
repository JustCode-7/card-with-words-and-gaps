import {ResolveFn} from '@angular/router';
import {inject} from "@angular/core";
import {SocketService} from "../service/socket.service";
import {MatchService} from "../service/match.service";

/**
 * Resolver, der sicherstellt, dass der Host-Status und die Raum-Session
 * im SocketService und MatchService wiederhergestellt sind, bevor
 * die /new-game Route geladen wird.
 */
export const roomStateResolver: ResolveFn<boolean> = (route, state) => {
  const socketService = inject(SocketService);
  const matchService = inject(MatchService);

  const isHost = localStorage.getItem('isHost') === 'true';
  const room = localStorage.getItem('currentP2PRoomId');

  console.log(`[DEBUG_LOG] RoomStateResolver: Host status: ${isHost}, Room: ${room}`);

  if (isHost && room) {
    // Falls der Status im Service noch false ist (z.B. nach Reload), stellen wir ihn hier schon sicher
    if (!socketService.isHost.value) {
      console.warn("[DEBUG_LOG] RoomStateResolver: Restoring host for room:", room);
      socketService.isHost.next(true);
      socketService.createRoom(room);
      matchService.initMatch(room);
    }
    return true;
  }

  return true;
};
