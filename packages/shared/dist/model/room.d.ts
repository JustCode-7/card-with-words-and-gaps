import { Player } from "./player.js";
export declare enum RoomState {
    Waiting = 0,
    Playing = 1,
    Finished = 2
}
export interface Room {
    roomId: string;
    createdTimestampMilliseconds: number;
    players: Player[];
    state: RoomState;
}
//# sourceMappingURL=room.d.ts.map