import {Injectable} from '@angular/core';
import {Game} from "../modal/game-model";
import {Spieler} from "../modal/spieler-model";
import {SpielerKartenService} from "./spieler-karten.service";
import {answerSet} from "../modal/answer-cards";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  spielerArr!: Spieler[];
  game!: Game;
  playerCount: number = 1;
  catlordName: string = "lord";
  currentCatLordCard = new BehaviorSubject<string>("");
  constructor(private readonly spielerKartenService:SpielerKartenService) {

  }

  initMatch(game:Game){
    this.game = game;
    this.spielerArr = game.spieler
  }

  initPlayerArr(anzahl: number, catlordname:string):Spieler[]{
    let spielerArr = [];
    for (let i = 0; i <= anzahl ; i++) {
      let playerNr = i+1;
      spielerArr.push(new Spieler("Dude"+playerNr,0,[],[],false))
    }
    spielerArr.push(new Spieler(catlordname,0,[],[],true))
    this.spielerKartenService.verteileKarten(spielerArr, answerSet);
    return spielerArr;
  }

  private refillPlayerAnswersToTen() {
    //TODO: tempArr mit dem AnswerCards im Spiel,
    // vergleichen und nicht vorhandene auffüllen.
    // Wenn keine mehr da, gespielte Karten mischen und neu verteilen
  }

}
