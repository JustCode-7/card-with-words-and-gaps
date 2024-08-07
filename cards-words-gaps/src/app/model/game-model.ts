import {Spieler} from "./spieler-model";

export class Game{
  cardset: string[] = []
  answerset: string[] = []
  spieler: Spieler[] = []
  gameHash: string
  currentCatlordCard: string = ""
  constructor(cardset: string[],
              answerset: string[],
              spieler: Spieler[],
              gameHash: string,
              currentCatlordCard: string = "") {
    this.cardset = cardset;
    this.answerset = answerset;
    this.spieler = spieler;
    this.gameHash = gameHash;
    this.currentCatlordCard = currentCatlordCard;
  }

}
