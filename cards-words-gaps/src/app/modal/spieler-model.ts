export class Spieler {
  name:string;
  points: number;
  cards : string[];
  selectedCards: string[];
  catLord: boolean;

 constructor(name:string,
             points: number,
             cards : string[],
             selectedCards: string[],
             catLord: boolean) {
    this.name = name;
    this.points = 0;
    this.cards = cards;
    this.selectedCards = selectedCards;
    this.catLord = catLord;
 }
}
