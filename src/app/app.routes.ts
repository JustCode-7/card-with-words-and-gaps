import {Routes} from '@angular/router';
import {RoomOverviewPage} from "./pages/room-overview-page/room-overview-page.component";
import {CatLordPage} from "./pages/cat-lord-page/cat-lord-page.component";
import {PlayerPage} from "./pages/player-page/player-page.component";
import {roomListResolver} from "./resolver/room-list.resolver";
import {roomStateResolver} from "./resolver/room-state.resolver";
import {PlayerNamePage} from "./pages/player-name-page/player-name-page.component";
import {EntryPageComponent} from "./pages/entry-page/entry-page.component";
import {NewGamePage} from "./pages/new-game-page/new-game-page.component";
import {CardEditorPageComponent} from "./pages/card-editor-page/card-editor-page.component";
import {CardEditorEditComponent} from "./components/card-editor-edit/card-editor-edit.component";
import {catlordGuard} from "./guards/catlord.guard";
import {roomGuard} from "./guards/room.guard";
import {nameGuard} from "./guards/name.guard";

export const routes: Routes = [
  {path: '', component: EntryPageComponent, pathMatch: 'full'},
  {path: 'set-name', component: PlayerNamePage},
  {path: 'new-game', component: NewGamePage, resolve: {roomState: roomStateResolver}},
  {path: 'join-game', component: RoomOverviewPage, resolve: {roomList: roomListResolver}, pathMatch: 'full'},
  {path: 'create-room/:playername', component: CatLordPage, canActivate: [nameGuard], pathMatch: 'full'},
  {
    path: 'game/:roomname/:playername/catlord',
    component: CatLordPage,
    canActivate: [roomGuard, catlordGuard],
    pathMatch: 'full'
  },
  {path: 'game/:roomname/:playername/player', component: PlayerPage, canActivate: [roomGuard], pathMatch: 'full'},
  {path: 'game/:roomname/:playername', redirectTo: 'game/:roomname/:playername/player', pathMatch: 'full'},
  {path: 'answer', component: NewGamePage, resolve: {roomState: roomStateResolver}},
  {path: 'edit-cards', component: CardEditorPageComponent},
  {path: 'edit-cards/gaps', component: CardEditorEditComponent},
  {path: 'edit-cards/answers', component: CardEditorEditComponent},
  {path: '**', redirectTo: ''},
];
