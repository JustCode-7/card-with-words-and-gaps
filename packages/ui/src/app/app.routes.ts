import {Routes} from '@angular/router';
import {JoinRoomPage} from "./pages/join-room-page/join-room-page.component";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {joinRoomResolver} from "./resolver/join-room.resolver";
import {RoomPage} from "./pages/room-page/room-page.component";
import {WaitingRoomComponent} from "./components/waiting-room-page.component";
import {canActivateGameGuard} from "./guard/room-exists.guard";
import {Error404Page} from "./pages/404/error-404-page.component";
import {GameComponent} from "./components/game/game.component";


export const routes: Routes = [
  {path: '', component: PlayerNamePage},
  {path: 'join-game', component: JoinRoomPage},
  {
    path: 'game/:room',
    resolve: {joinRoom: joinRoomResolver},
    canActivate: [canActivateGameGuard],
    component: RoomPage,
    children: [
      {path: 'waiting-room', component: WaitingRoomComponent},
      {path: '', component: GameComponent},
    ]
  },

  // redirect unknown route (404)
  {path: '**', component: Error404Page},
];
