import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {MatchService} from '../service/match.service';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatlordGuard implements CanActivate {
  private matchService = inject(MatchService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const playername = route.params['playername'];
    const roomname = route.params['roomname'];

    return this.matchService.game.pipe(
      map(game => {
        // If room is empty (not initialized yet), allow host through
        if (!game.gameHash || game.spieler.length === 0) {
          return this.matchService.socketService.isHost.value;
        }

        const currentPlayer = game.spieler.find(player => player.name === playername);

        if (!currentPlayer || !currentPlayer.catLord) {
          // Redirect to player page if not the CatLord
          this.router.navigate(['/game', roomname, playername, 'player']);
          return false;
        }

        return true;
      })
    );
  }
}
