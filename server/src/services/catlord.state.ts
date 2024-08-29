const catlordState = new Map< /*roomId*/ string, /*playerId*/ string>()

export function getCatLord(roomId: string): string | undefined {
    const catlord = catlordState.get(roomId)
    if (catlord === undefined) {
        return undefined
    }
    return catlord
}

export function setCatLord(roomId: string, playerId: string) {
    catlordState.set(roomId, playerId)
}
