import {Routes} from '@angular/router';
import {RoomOverviewPage} from "./pages/room-overview-page/room-overview-page.component";
import {CatLordPage} from "./pages/cat-lord-page/cat-lord-page.component";
import {PlayerPage} from "./pages/player-page/player-page.component";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {roomListResolver} from "./resolver/room-list.resolver";
import {GamePage} from "./pages/game-page/game-page.component";
import {joinRoomResolver} from "./resolver/join-room.resolver";


export const routes: Routes = [
  {path: '', component: PlayerNamePage},
  {path: 'join-game', component: RoomOverviewPage, resolve: {roomList: roomListResolver}},
  {path: 'game/:room', component: GamePage, resolve: {joinRoom: joinRoomResolver}},

  // old stuff ...
  {path: 'game/:roomname/:playername/catlord', component: CatLordPage, pathMatch: 'full'},
  {path: 'game/:roomname/:playername', component: PlayerPage, pathMatch: 'full'},


  // redirect unknown route (404)
  {path: '**', redirectTo: ''},
];
