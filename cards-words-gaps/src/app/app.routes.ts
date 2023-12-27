import {Routes} from '@angular/router';
import {EntryPageComponent} from "./pages/entry-page/entry-page.component";
import {NewGamePageComponent} from "./pages/new-game-page/new-game-page.component";
import {JoinGamePageComponent} from "./pages/join-game-page/join-game-page.component";
import {MatchPageComponent} from "./pages/match-page/match-page.component";

export const routes: Routes = [
  {path: '', component:EntryPageComponent},
  {path: 'new-game', component:NewGamePageComponent, pathMatch: 'full'},
  {path: 'join-game', component:JoinGamePageComponent, pathMatch: 'full'},
  {path: 'game', component:MatchPageComponent, pathMatch: 'full'},


  {path: '**', component:EntryPageComponent},
];
