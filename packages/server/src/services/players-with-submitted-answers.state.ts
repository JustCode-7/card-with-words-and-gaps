const map = new Map</*roomId*/string, /*playerIds*/ string[]>()

export function getPlayersWithSubmittedAnswer(room: string): string[] | undefined {
    return map.get(room)
}

export function addPlayerWithSubmittedAnswer(room: string, playerId: string) {
    if (map.has(room)) {
        map.get(room)?.push(playerId)
    } else {
        map.set(room, [playerId])
    }
}

export function clearPlayersWithSubmittedAnswer(room: string) {
    map.delete(room)
}
