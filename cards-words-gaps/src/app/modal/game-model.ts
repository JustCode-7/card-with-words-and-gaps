import {Spieler} from "./spieler-model";

export class Game{
  cardset: string[] = []
  answerset: string[] = []
  spieler: Spieler[] = []
  constructor(cardset: string[],
              answerset: string[],
              spieler: Spieler[]) {
    this.cardset = cardset;
    this.answerset = answerset;
    this.spieler = spieler;
  }

}
