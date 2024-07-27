export class Spieler {
    name: string;
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