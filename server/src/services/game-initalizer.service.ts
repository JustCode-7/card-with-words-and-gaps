import {drawAnswerCard, drawGapCard, setGapCard} from "./card.state.js";
import {getRoomById} from "./room.state.js";
import {addCard} from "./player-card.state.js";
import {getCatLord, setCatLord} from "./catlord.state.js";

function setNextGapCard(roomId: string) {
    const gapCard = drawGapCard(roomId);
    setGapCard(roomId, gapCard)
}

function assignAnswerCards(roomId: string) {
    const players = getRoomById(roomId)?.players
    if (players === undefined) {
        throw new Error('No players in room')
    }
    const numberOfCards = 5;
    players.forEach(player => {
        for (let i = 0; i < numberOfCards; i++) {
            const card = drawAnswerCard(roomId)
            addCard(roomId, player.id, card)
        }
    })
}

export function initGameObjects(roomId: string) {
    setNextCatlord(roomId)
    setNextGapCard(roomId)
    assignAnswerCards(roomId)
}

function setNextCatlord(roomId: string) {
    const catlord = getCatLord(roomId)
    if (catlord === undefined) {
        const players = getRoomById(roomId)?.players
        if (players === undefined) {
            throw new Error('No players in room')
        }
        const nextCatlord = players[0].id
        setCatLord(roomId, nextCatlord)
    } else {
        const players = getRoomById(roomId)?.players
        if (players === undefined) {
            throw new Error('No players in room')
        }
        const catlordIndex = players.findIndex(player => player.id === catlord)
        const nextCatlord = players[(catlordIndex + 1) % players.length].id
        setCatLord(roomId, nextCatlord)
    }
}
