// TODO shared
interface Participant {
    id: number;
    name: string;
}

const rooms: Map<String, Participant[]> = new Map();

export function joinRoom(room: string, participant: Participant) {

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