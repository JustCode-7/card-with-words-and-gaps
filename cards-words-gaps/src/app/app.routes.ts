import {Routes} from '@angular/router';
import {RoomOverviewPage} from "./pages/room-overview-page/room-overview-page.component";
import {CatLordPage} from "./pages/cat-lord-page/cat-lord-page.component";
import {PlayerPage} from "./pages/player-page/player-page.component";
import {roomListResolver} from "./resolver/room-list.resolver";
import {GapTextTestComponent} from "./components/gap-text-test/gap-text-test.component";


export const routes: Routes = [
  {path: '', component: GapTextTestComponent},
  {path: 'join-game', component: RoomOverviewPage, resolve: {roomList: roomListResolver}, pathMatch: 'full'},
  {path: 'game/:roomname/:playername/catlord', component: CatLordPage, pathMatch: 'full'},
  {path: 'game/:roomname/:playername', component: PlayerPage, pathMatch: 'full'},

  {path: '**', redirectTo: ''},
];
