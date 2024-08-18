// TODO shared
interface Player {
    id: string;
    name: string;
}

// TODO shared
interface Room {
    roomId: string;
    createdTimestampMilliseconds: number;
    players: Player[];
}

const roomState: Map<string, Room> = new Map();

export function roomExists(roomId: string): boolean {
    return roomState.get(roomId) !== undefined;
}

export function getRoomIds(): string[] {
    return [...roomState.keys()] as string[];
}

export function getRoomById(roomId: string): Room | undefined {
    return roomState.get(roomId)
}

export function createRoom(roomId: string) {
    if (roomState.get(roomId) !== undefined) {
        console.error(`room '${roomId}' already exists`)
        return
    }

    const newRoom: Room = {
        roomId: roomId,
        createdTimestampMilliseconds: Date.now(),
        players: [],
    }
    roomState.set(roomId, newRoom)
    console.debug(`created room ${roomId}`)
}

/**
 *
 * @param roomId
 * @param player
 * @return true if succeeded, otherwise false
 */
export function joinRoom(roomId: string, player: Player) {

    const existingRoom = roomState.get(roomId);
    if (existingRoom === undefined) {
        console.error(`room '${roomId}' does not exist`)
        return
    }
    if (existingRoom.players.find(it => it.id === player.id)) {
        console.debug(`Player ${player.id}/${player.name} is already in the room '${roomId}'`)
        return
    }

    const updatedRoom = {
        ...existingRoom,
        players: [
            ...existingRoom.players,
            player,
        ]
    }
    roomState.set(roomId, updatedRoom);
}
