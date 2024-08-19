import {Routes} from '@angular/router';
import {JoinRoomPage} from "./pages/join-room-page/join-room-page.component";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {joinRoomResolver} from "./resolver/join-room.resolver";
import {GamePage} from "./pages/game-page/game-page.component";


export const routes: Routes = [
  {path: '', component: PlayerNamePage},
  {path: 'join-game', component: JoinRoomPage},
  {
    path: 'game/:room',
    resolve: {joinRoom: joinRoomResolver},
    component: GamePage,
  },

  // redirect unknown route (404)
  {path: '**', redirectTo: ''},
];
