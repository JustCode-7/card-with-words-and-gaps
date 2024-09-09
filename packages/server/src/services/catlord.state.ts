const catlordState = new Map< /*roomId*/ string, /*playerId*/ string>()

export function getCatlord(roomId: string): string | undefined {
    return catlordState.get(roomId)
}

export function setCatLord(roomId: string, playerId: string) {
    catlordState.set(roomId, playerId)
}
