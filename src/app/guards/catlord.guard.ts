import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {MatchService} from '../service/match.service';
import {map, take} from 'rxjs';
import {toObservable} from "@angular/core/rxjs-interop";

export const catlordGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const matchService = inject(MatchService);
  const router = inject(Router);

  const playername = route.params['playername'];
  const roomname = route.params['roomname'];

  return toObservable(matchService.game).pipe(
    take(1),
    map(game => {
      // If room is empty (not initialized yet), allow host through
      if (!game.gameHash || game.spieler.length === 0) {
        return matchService.socketService.isHost();
      }

      const currentPlayer = game.spieler.find(player => player.name === playername);

      if (!currentPlayer || !currentPlayer.catLord) {
        // Redirect to player page if not the CatLord
        router.navigate(['/game', roomname, playername, 'player']);
        return false;
      }

      return true;
    })
  );
};
