import {Routes} from '@angular/router';
import {JoinRoomPage} from "./pages/join-room-page/join-room-page.component";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {joinRoomResolver} from "./resolver/join-room.resolver";
import {GamePage} from "./pages/game-page/game-page.component";
import {WaitingRoomComponent} from "./components/waiting-room/waiting-room-page.component";
import {canActivateGameGuard} from "./guard/room-exists.guard";
import {CatlordComponent} from "./components/catlord/catlord.component";
import {PlayerComponent} from "./components/player/player.component";
import {Error404Page} from "./pages/404/error-404-page.component";


export const routes: Routes = [
  {path: '', component: PlayerNamePage},
  {path: 'join-game', component: JoinRoomPage},
  {
    path: 'game/:room',
    resolve: {joinRoom: joinRoomResolver},
    canActivate: [canActivateGameGuard],
    component: GamePage,
    children: [
      {path: 'waiting-room', component: WaitingRoomComponent},
      {path: '', component: CatlordComponent},
      {path: 'catlord', component: CatlordComponent},
      {path: 'player', component: PlayerComponent}
    ]
  },

  // redirect unknown route (404)
  {path: '**', component: Error404Page},
];
