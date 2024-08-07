import {Routes} from '@angular/router';
import {NewGamePageComponent} from "./pages/new-game-page/new-game-page.component";
import {JoinGamePageComponent} from "./pages/join-game-page/join-game-page.component";
import {CatLordPageComponent} from "./pages/cat-lord-page/cat-lord-page.component";
import {PlayerPageComponent} from "./pages/player-page/player-page.component";
import {PlayerNamePageComponent} from "./pages/player-name-page/player-name-page.component";


export const routes: Routes = [
  {path: '', component: PlayerNamePageComponent},
  {path: 'new-game', component: NewGamePageComponent, pathMatch: 'full'},
  {path: 'join-game', component: JoinGamePageComponent, pathMatch: 'full'},
  {path: 'game/:roomname/:playername/catlord', component: CatLordPageComponent, pathMatch: 'full'},
  {path: 'game/:roomname/:playername', component: PlayerPageComponent, pathMatch: 'full'},

  {path: '**', component: PlayerNamePageComponent},
];
