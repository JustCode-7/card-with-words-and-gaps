import {inject, Injectable} from '@angular/core';
import {Game} from "../model/game-model";
import {Spieler} from "../model/spieler-model";
import {SpielerKartenService} from "./spieler-karten.service";
import {answerSet} from "../data/answer-cards";
import {BehaviorSubject, distinctUntilChanged} from "rxjs";
import {cardSet} from "../data/catlord-cards";
import {SocketService} from "./socket.service";
import {SocketEvent} from "../util/client-enums";

@Injectable({providedIn: 'root'})
export class MatchService {
  spielerKartenService: SpielerKartenService = inject(SpielerKartenService);
  socketService: SocketService = inject(SocketService);
  game: BehaviorSubject<Game> = new BehaviorSubject<Game>(new Game([], [], [], ""));
  playerCount: number = 1;
  catlordName: string = "lord";
  currentCatLordCard = new BehaviorSubject<string>("");
  lockedPlayerView: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  spielerListe: BehaviorSubject<Spieler[]> = new BehaviorSubject([new Spieler("dummy", 1, [], [], false)]);
  private currentCardNr: number = 1


  initMatch(roomId: string) {
    this.game.next(new Game(cardSet, answerSet, this.initPlayerArr(this.playerCount, this.catlordName), roomId, this.getRandomCurrentCatlordCard()));
    console.log("INIT:" + this.game.value)
    this.socketService.sendGameWithRoomID('setGame', roomId, this.game.value)
    console.log(this.game.value)

    this.game.pipe(distinctUntilChanged()).subscribe((game) => {
      if (game.spieler.length === 0 && game === this.game.value) {
        console.log("Just Default Game available or nothing to update")
        return
      }
      this.socketService.sendUpdateGame('updateGame', this.game.value)
    })
    this.socketService.getGame().pipe(distinctUntilChanged())
      .subscribe((gameFromServer) => {
        if (gameFromServer.spieler.length === 0 && gameFromServer === this.game.value) {
          console.log("Just Default Game available or nothing to update")
          return
        }
        this.game.next(gameFromServer)
      })

    //TODO:
    // generate gamehash + cookie + new MatchRoute with hash...
    // store set Game
    // this.store.dispatch()
    //    this.router.url.replace(this.router.url, this.router.url+this.game.gameHash)
  }


  initPlayerArr(anzahl: number, catlordname: string): Spieler[] {
    let spielerArr = [];
    spielerArr.push(new Spieler(catlordname, 0, [], [], true))
    for (let i = 1; i <= anzahl; i++) {
      spielerArr.push(new Spieler("Dude" + i, 0, [], [], false))
    }
    this.spielerKartenService.verteileKarten(spielerArr, answerSet);
    return spielerArr;
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

    if (!this.lockedPlayerView.value) {
      this.lockedPlayerView.next(true);
    } else {
      this.lockedPlayerView.next(false);
    }
  }

  generateRandomCardNummber(cardSet: string[]) {
    this.currentCardNr = parseInt((Math.random() * cardSet.length - 1).toFixed());
    return this.currentCardNr;
  }

  private getRandomCurrentCatlordCard() {
    this.currentCatLordCard.next(cardSet[this.generateRandomCardNummber(cardSet)]);
    return this.currentCatLordCard.value;
  }

  nextCard() {
    let catloardCardset: any[] = [];
    let cardNumber = 0;
    this.socketService.getGame().subscribe((game) => {
      catloardCardset = game.cardset;
    })

    if (catloardCardset.length < 1) {
      return;
    }
    if (catloardCardset.length === 1) {
      cardNumber = 1;
    }
    catloardCardset.splice(this.currentCardNr, 1);
    cardNumber = parseInt((Math.random() * catloardCardset.length - 1).toFixed());
    this.currentCardNr = cardNumber;
    if (catloardCardset[this.currentCardNr] === undefined) {
      cardNumber = parseInt((Math.random() * catloardCardset.length - 1).toFixed());
      this.currentCardNr = cardNumber;
    }
    this.currentCatLordCard?.next(catloardCardset[this.currentCardNr])
    this.changeCatLord();
  }

  changeCatLord() {
    const catlordPlayer = this.game.value.spieler.find((spieler) => spieler.catLord)
    const catlordPlayerIndex = this.game.value.spieler.indexOf(catlordPlayer!)
    this.game.value.spieler.forEach((value, index) => {
      if (index === catlordPlayerIndex) {
        value.catLord = false
      }
      if (index === catlordPlayerIndex + 1) {
        value.catLord = true
      }
    })
    // change Master
    this.fillSpielerCardStack()
  }

  initIoConnection(): void {
    this.listenOnEvents()
  }

  private listenOnEvents(): void {

    this.socketService.onEvent(SocketEvent.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });

    this.socketService.onEvent(SocketEvent.RECONNECT)
      .subscribe(() => {
        console.log('reconnection');
      });

    this.socketService.onEvent(SocketEvent.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });
  }
}
