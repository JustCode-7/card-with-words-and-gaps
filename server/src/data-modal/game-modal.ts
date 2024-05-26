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

export class Message {
    get spieler(): Spieler {
        return this._spieler;
    }

    set spieler(value: Spieler) {
        this._spieler = value;
    }
    constructor(private _spieler: Spieler, private content: string) {
    }
}

export class AnswerMessage extends Message{
    constructor(from: Spieler, content: string) {
        super(from, content);

    }
}

export class Game{
    cardset: string[] = []
    answerset: string[] = []
    spieler: Spieler[] = []
    gameHash: string
    constructor(cardset: string[],
                answerset: string[],
                spieler: Spieler[],
                gameHash: string) {
        this.cardset = cardset;
        this.answerset = answerset;
        this.spieler = spieler;
        this.gameHash = gameHash;
    }

}