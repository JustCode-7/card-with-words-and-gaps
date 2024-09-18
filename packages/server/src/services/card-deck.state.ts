import {ANSWER_CARDS} from "../data/answer-cards.data.js";
import {GAP_CARDS} from "../data/gap-cards.data.js";
import {v4 as uuidv4} from 'uuid';
import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card.js";
import {shuffle} from "@cards-with-words-and-gaps/shared/dist/util/shuffle.util.js";

interface CardDeckState {
    answerCards: Card[];
    remainingAnswerCards: Card[];
    gapCards: Card[];
    remainingGapCards: Card[];
}

const map: Map<string, CardDeckState> = new Map();

export function initCardMapFor(room: string) {
    const answerCards = ANSWER_CARDS.map(toCard)
    const gapCards = GAP_CARDS.map(toCard)
    const cardState: CardDeckState = {
        answerCards: answerCards,
        gapCards: gapCards,
        remainingAnswerCards: shuffle(answerCards),
        remainingGapCards: shuffle(gapCards),
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
function drawCard(room: string, cardsAccessorFn: (c: CardDeckState) => Card[]): Card {
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


export function getCardDeck(roomId: string): CardDeckState | undefined {
    return map.get(roomId);
}

export function getAnswerCardById(room: string, cardId: string): Card | undefined {
    return map.get(room)?.answerCards.find(card => card.id === cardId)
}

export function getGapCardById(room: string, cardId: string): Card | undefined {
    return map.get(room)?.gapCards.find(card => card.id === cardId)
}
