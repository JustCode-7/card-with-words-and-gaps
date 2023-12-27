import { Routes } from '@angular/router';
import {EntryPageComponent} from "./entry-page/entry-page.component";
import {NewGameComponent} from "./new-game/new-game.component";
import {JoinGameComponent} from "./join-game/join-game.component";
import {MatchPageComponent} from "./match-page/match-page.component";

export const routes: Routes = [
  {path: '', component:EntryPageComponent},
  {path: 'new-game', component:NewGameComponent, pathMatch: 'full'},
  {path: 'join-game', component:JoinGameComponent, pathMatch: 'full'},
  {path: 'game', component:MatchPageComponent, pathMatch: 'full'},



  {path: '**', component:EntryPageComponent},
];
