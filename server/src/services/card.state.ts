import {shuffle} from "../util/shuffle.util.js";
import {answerCards} from "../data/answer-cards.js";
import {gapCards} from "../data/gap-cards.js";
import {v4 as uuidv4} from 'uuid';
import {Card} from "../model/card.js";

interface CardState {
    remainingAnswerCards: Card[];
    remainingGapCards: Card[];
}

const map: Map<string, CardState> = new Map();

export function initCardMapFor(room: string) {
    const cardState: CardState = {
        remainingAnswerCards: shuffle(answerCards).map(toCard),
        remainingGapCards: shuffle(gapCards).map(toCard),
    };
    map.set(room, cardState);
}

/**
 * map to Card, this will generate and add a random id
 * @param text of the card
 */
function toCard(text: string): Card {
    return {id: uuidv4(), text: text};
}

/**
 * Draw an answer card and modify the remaining cards in place
 * @param room
 */
export function drawAnswerCard(room: string): Card {
    return drawCard(room, (c) => c.remainingAnswerCards)
}

/**
 * Draw a gap card and modify the remaining cards in place
 * @param room
 */
export function drawGapCard(room: string): Card {
    return drawCard(room, (c) => c.remainingGapCards)
}

/**
 * Draw a card and modify the remaining cards in place
 * @param room to perform the action on
 * @param cardsAccessorFn function to access the desired array
 */
function drawCard(room: string, cardsAccessorFn: (c: CardState) => Card[]): Card {
    const cardState = map.get(room)
    if (cardState === undefined) {
        throw new Error(`Room '${room}' not found`);
    }
    const card = cardsAccessorFn(cardState).pop()
    if (card === undefined) {
        throw new Error('No answerCards remaining');
    }
    return card
}
