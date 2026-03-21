import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {MatchService} from '../service/match.service';
import {map, take} from 'rxjs';
import {toObservable} from "@angular/core/rxjs-interop";

export const roomGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const matchService = inject(MatchService);
  const router = inject(Router);

  const roomname = route.params['roomname'];
  const playername = route.params['playername'];

  return toObservable(matchService.game).pipe(
    take(1),
    map(game => {
      // If we are the host and the room is the one we are creating, let us through
      if (matchService.socketService.isHost() && !game.gameHash) {
        return true;
      }

      // Check if the room exists and player is part of the game
      if (!game.gameHash || game.gameHash !== roomname) {
        router.navigate(['/join-game']);
        return false;
      }

      const playerExists = game.spieler.some(player => player.name === playername);
      if (!playerExists) {
        router.navigate(['/join-game']);
        return false;
      }

      return true;
    })
  );
};
