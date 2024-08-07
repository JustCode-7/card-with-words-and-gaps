// TODO shared
interface Player {
    id: number;
    name: string;
}

const rooms: Map<String, Player[]> = new Map();

export function joinRoom(room: string, participant: Player) {

    const existingRoom = rooms.get(room);
    if (existingRoom != undefined) {
        rooms.set(room, [...existingRoom, participant]);
    } else {
        rooms.set(room, [participant])
    }
}

export function createRoom(room: string) {
    rooms.set(room, [])
}

export function getRooms(): string[] {
    return [...rooms.keys()] as string[];
}