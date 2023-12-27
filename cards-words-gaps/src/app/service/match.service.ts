import { Injectable } from '@angular/core';
import {Game} from "../modal/game-model";
import {Spieler} from "../modal/spieler-model";

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  spielerArr: Spieler[] | undefined;

  constructor() {

  }

  initMatch(game:Game){
    this.spielerArr = game.spieler
  }
}
