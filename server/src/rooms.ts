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

const rooms: Map<string, Room> = new Map();

export function joinRoom(roomId: string, player: Player) {

    const existingRoom = rooms.get(roomId);
    if (existingRoom === undefined) {
        throw new Error(`room ${roomId} does not exist`);
    }

    const updatedRoom = {
        ...existingRoom,
        players: [
            ...existingRoom.players,
            player,
        ]
    }
    rooms.set(roomId, updatedRoom);

}

export function createRoom(roomId: string) {
    const newRoom: Room = {
        roomId: roomId,
        createdTimestampMilliseconds: Date.now(),
        players: [],
    }
    rooms.set(roomId, newRoom)
}

export function getRoomIds(): string[] {
    return [...rooms.keys()] as string[];
}

export function getRoomById(roomId: string): Room {
    const room = rooms.get(roomId)
    if (room === undefined) {
        throw new Error(`room '${roomId}' not found`);
    }
    return room;
}