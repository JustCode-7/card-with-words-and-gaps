export class Spieler {
  name: string;
  points: number;
  cards: string[];
  selectedCards: string[];
  catLord: boolean;
  ready: boolean = false;

  constructor(name: string,
              points: number,
              cards: string[],
              selectedCards: string[],
              catLord: boolean,
              ready: boolean = false) {
    this.name = name;
    this.points = points;
    this.cards = cards;
    this.selectedCards = selectedCards;
    this.catLord = catLord;
    this.ready = ready;
  }
}
