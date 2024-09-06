import {Card} from "../model/card.js"

type PlayerCardMap = Map</* playerId */string, Card[]>
const playerCardState = new Map< /*roomId*/ string, /* playerCards */ PlayerCardMap>()

function getOrInitMap(roomId: string): PlayerCardMap {
    const room = playerCardState.get(roomId)
    if (room === undefined) {
        playerCardState.set(roomId, new Map())
    }
    return playerCardState.get(roomId)!
}

export function setCards(roomId: string, playerId: string, cards: Card[]) {
    getOrInitMap(roomId).set(playerId, cards)
}

export function addCard(roomId: string, playerId: string, card: Card) {
    const map = getOrInitMap(roomId);
    const existingCards = map.get(playerId) ?? []
    map.set(playerId, [...existingCards, card])
}

export function removeCard(roomId: string, playerId: string, card: Card) {
    const cards = getOrInitMap(roomId).get(playerId)
    if (cards === undefined) {
        return
    }
    const filtered = cards.filter(c => c.id !== card.id)
    playerCardState.get(roomId)?.set(playerId, filtered)
}

export function getPlayerCards(roomId: string) {
    return playerCardState.get(roomId)
}
