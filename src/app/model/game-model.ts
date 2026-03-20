import {Spieler} from "./spieler-model";

export class Game {
  cardset: string[] = [];
  answerset: string[] = [];
  spieler: Spieler[] = [];
  gameHash: string;
  currentCatlordCard: string = "";
  roundStatus: 'WAITING_FOR_ANSWERS' | 'CZAR_DECIDING' | 'ROUND_FINISHED' = 'WAITING_FOR_ANSWERS';
  answersRevealed: boolean = false;
  isStarted: boolean = false;
  isEnded: boolean = false;
  lastWinnerFullText: string = "";
  lastRoundAnswers: any[] = [];

  constructor(cardset: string[],
              answerset: string[],
              spieler: Spieler[],
              gameHash: string,
              currentCatlordCard: string = "",
              roundStatus: 'WAITING_FOR_ANSWERS' | 'CZAR_DECIDING' | 'ROUND_FINISHED' = 'WAITING_FOR_ANSWERS',
              answersRevealed: boolean = false,
              isStarted: boolean = false,
              isEnded: boolean = false,
              lastWinnerFullText: string = "",
              lastRoundAnswers: any[] = []) {
    this.cardset = cardset;
    this.answerset = answerset;
    this.spieler = spieler;
    this.gameHash = gameHash;
    this.currentCatlordCard = currentCatlordCard;
    this.roundStatus = roundStatus;
    this.answersRevealed = answersRevealed;
    this.isStarted = isStarted;
    this.isEnded = isEnded;
    this.lastWinnerFullText = lastWinnerFullText;
    this.lastRoundAnswers = lastRoundAnswers;
  }

}
