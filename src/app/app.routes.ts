import {Routes} from '@angular/router';
import {RoomOverviewPage} from "./pages/room-overview-page/room-overview-page.component";
import {CatLordPage} from "./pages/cat-lord-page/cat-lord-page.component";
import {PlayerPage} from "./pages/player-page/player-page.component";
import {roomListResolver} from "./resolver/room-list.resolver";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {EntryPageComponent} from "./pages/entry-page/entry-page.component";
import {NewGamePage} from "./pages/new-game-page/new-game-page.component";
import {CatlordGuard} from "./guards/catlord.guard";
import {RoomGuard} from "./guards/room.guard";

export const routes: Routes = [
  {path: '', component: EntryPageComponent},
  {path: 'set-name', component: PlayerNamePage},
  {path: 'new-game', component: NewGamePage},
  {path: 'join-game', component: RoomOverviewPage, resolve: {roomList: roomListResolver}, pathMatch: 'full'},
  {path: 'create-room/:playername', component: CatLordPage, pathMatch: 'full'},
  {
    path: 'game/:roomname/:playername/catlord',
    component: CatLordPage,
    canActivate: [RoomGuard, CatlordGuard],
    pathMatch: 'full'
  },
  {path: 'game/:roomname/:playername/player', component: PlayerPage, canActivate: [RoomGuard], pathMatch: 'full'},
  {path: 'game/:roomname/:playername', redirectTo: 'game/:roomname/:playername/player', pathMatch: 'full'},
  {path: '**', redirectTo: ''},
];
