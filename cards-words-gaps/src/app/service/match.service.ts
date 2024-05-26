import {Injectable} from '@angular/core';
import {Game} from "../modal/game-model";
import {Spieler} from "../modal/spieler-model";
import {SpielerKartenService} from "./spieler-karten.service";
import {answerSet} from "../modal/answer-cards";
import {BehaviorSubject} from "rxjs";
import {Router} from "@angular/router";
import {cardSet} from "../modal/catlord-cards";

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  game!: Game;
  playerCount: number = 1;
  catlordName: string = "lord";
  currentCatLordCard = new BehaviorSubject<string>("");
  lockedPlayerView: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  constructor(private readonly spielerKartenService:SpielerKartenService, private readonly router:Router) {
  }

  initMatch(roomId:string){
    this.game = new Game(cardSet, answerSet, this.initPlayerArr(this.playerCount,this.catlordName), roomId);
    console.log(this.game)

    //TODO:
    // generate gamehash + cookie + new MatchRoute with hash...
    // store set Game
    // this.store.dispatch()
    //    this.router.url.replace(this.router.url, this.router.url+this.game.gameHash)
  }


  initPlayerArr(anzahl: number, catlordname:string):Spieler[]{
    let spielerArr = [];
    spielerArr.push(new Spieler(catlordname,0,[],[],true))
    for (let i = 1; i <= anzahl ; i++) {
      spielerArr.push(new Spieler("Dude"+i,0,[],[],false))
    }
    this.spielerKartenService.verteileKarten(spielerArr, answerSet);
    return spielerArr;
  }

  changeCatLord() {
    const catlordPlayer = this.game.spieler.find((spieler) => spieler.catLord)
    const catlordPlayerIndex = this.game.spieler.indexOf(catlordPlayer!)
    this.game.spieler.forEach((value, index)=> {
      if(index === catlordPlayerIndex){
        value.catLord = false
      }
      if(index === catlordPlayerIndex+1){
        value.catLord = true
      }})
    // change Master
    this.fillSpielerCardStack()
  }

  fillSpielerCardStack() {
    // randomly fill answer cards for every player to 10
  }
  refillPlayerAnswersToTen() {
    this.spielerKartenService.verteilteKarten.map(verteilteKarten => {
      verteilteKarten.filter(value => value !== "")
        .forEach(cardString => this.removeFromCardSet(cardString))
    })
  }
  private removeFromCardSet(cardString: string) {
    //TODO: tempArr mit dem AnswerCards im Spiel,
    // vergleichen und nicht vorhandene auffüllen.
    // Wenn keine mehr da, gespielte Karten mischen und neu mverteilen
    console.log(cardString);
  }

  playerReady(playername: string) {
    console.log(playername + "is Ready!")
    this.refillPlayerAnswersToTen();
    //TODO: lock all on app-answer-text-card, if answers selected
    // set PlayerState to Ready, commit answers

    if (!this.lockedPlayerView.value){
      this.lockedPlayerView.next(true);
    }else {
      this.lockedPlayerView.next(false);
    }
  }


}
