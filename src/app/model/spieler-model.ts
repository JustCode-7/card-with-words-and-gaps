export class Spieler {
  id: string;
  name: string;
  points: number;
  cards: string[];
  selectedCards: string[];
  catLord: boolean;
  ready: boolean = false;

  constructor(id: string,
              name: string,
              points: number,
              cards: string[],
              selectedCards: string[],
              catLord: boolean,
              ready: boolean = false) {
    this.id = id;
    this.name = name;
    this.points = points;
    this.cards = cards;
    this.selectedCards = selectedCards;
    this.catLord = catLord;
    this.ready = ready;
  }
}
