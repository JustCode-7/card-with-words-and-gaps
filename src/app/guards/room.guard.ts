import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {MatchService} from '../service/match.service';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomGuard implements CanActivate {
  private matchService = inject(MatchService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const roomname = route.params['roomname'];
    const playername = route.params['playername'];

    return this.matchService.game.pipe(
      map(game => {
        // If we are the host and the room is the one we are creating, let us through
        if (this.matchService.socketService.isHost.value && !game.gameHash) {
          return true;
        }

        // Check if the room exists and player is part of the game
        if (!game.gameHash || game.gameHash !== roomname) {
          this.router.navigate(['/join-game']);
          return false;
        }

        const playerExists = game.spieler.some(player => player.name === playername);
        if (!playerExists) {
          this.router.navigate(['/join-game']);
          return false;
        }

        return true;
      })
    );
  }
}
