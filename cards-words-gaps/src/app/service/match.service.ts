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
    // First, try to get an existing game for this room
    this.socketService.sendGetGame('getGame', roomId);

    // If this client is the host, initialize a new game with the player as catlord
    if (this.socketService.isHost.value) {
      const playerName = localStorage.getItem('playerName') || this.catlordName;

      // Create a new game with the host as catlord
      const newGame = new Game(
        cardSet,
        answerSet,
        this.initPlayerArr(this.playerCount, playerName),
        roomId,
        this.getRandomCurrentCatlordCard()
      );

      console.log("INIT new game as host:" + newGame);
      this.game.next(newGame);
      this.socketService.sendGameWithRoomID('setGame', roomId, newGame);
    }

    console.log("Current game state:", this.game.value);

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
    // vergleichen und nicht vorhandene auff&#252;llen.
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
    // Use a deterministic method to select the initial card
    // This ensures all players will get the same initial card
    const timestamp = Date.now();
    this.currentCardNr = timestamp % cardSet.length;
    const initialCard = cardSet[this.currentCardNr];
    this.currentCatLordCard.next(initialCard);
    return initialCard;
  }

  nextCard() {
    // Get the current game state
    const currentGame = this.game.value;
    const catloardCardset = [...currentGame.cardset]; // Create a copy to avoid modifying the original

    if (catloardCardset.length < 1) {
      return;
    }

    // Remove the current card from the set
    if (this.currentCardNr >= 0 && this.currentCardNr < catloardCardset.length) {
      catloardCardset.splice(this.currentCardNr, 1);
    }

    // Select a new card using a deterministic method (based on timestamp)
    // This ensures all players will get the same card
    const timestamp = Date.now();
    const cardNumber = timestamp % catloardCardset.length;
    this.currentCardNr = cardNumber;

    // Make sure we have a valid card
    if (catloardCardset[this.currentCardNr] === undefined) {
      this.currentCardNr = 0; // Default to first card if invalid
    }

    // Update the current card
    const newCard = catloardCardset[this.currentCardNr];
    this.currentCatLordCard.next(newCard);

    // Update the game state with the new card
    currentGame.currentCatlordCard = newCard;
    currentGame.cardset = catloardCardset;

    // Change the catlord
    this.changeCatLord();

    // Broadcast the updated game state to all players
    this.socketService.sendUpdateGame('updateGame', currentGame);
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

  getCurrentCatLord(): Spieler | undefined {
    return this.game.value.spieler.find(player => player.catLord);
  }

  isPlayerCatLord(playername: string): boolean {
    const currentCatLord = this.getCurrentCatLord();
    return currentCatLord?.name === playername;
  }

  createRoom(creatorName: string): string {
    const roomId = this.generateRoomId();
    const initialPlayers = this.initPlayerArr(0, creatorName);
    const newGame = new Game(cardSet, [], initialPlayers, roomId);
    this.game.next(newGame);
    return roomId;
  }

  joinRoom(roomId: string, playerName: string): boolean {
    const currentGame = this.game.value;
    if (currentGame.gameHash !== roomId) {
      return false;
    }

    // Check if player already exists
    const existingPlayer = currentGame.spieler.find(p => p.name === playerName);
    if (existingPlayer) {
      return true; // Player rejoining
    }

    // Add new player
    const newPlayer = new Spieler(playerName, 0, [], [], false);
    currentGame.spieler.push(newPlayer);
    this.spielerKartenService.verteileKarten([newPlayer], answerSet);
    this.game.next(currentGame);
    return true;
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
