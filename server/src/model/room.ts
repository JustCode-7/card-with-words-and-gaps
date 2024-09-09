import {Player} from "./player.js";

export enum RoomState {
    Waiting,
    Playing,
    Finished,
}

// TODO shared
export interface Room {
    roomId: string;
    createdTimestampMilliseconds: number;
    players: Player[];
    state: RoomState;
}
