import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card.js";

const map = new Map< /*roomId*/ string, Card>()

export function getGapCard(roomId: string): Card | undefined {
    return map.get(roomId)
}

export function setGapCard(roomId: string, card: Card) {
    map.set(roomId, card)
}
