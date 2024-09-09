import {Player} from "./player.js";

export enum RoomState {
    Waiting,
    Playing,
    Finished,
}

export interface Room {
    roomId: string;
    createdTimestampMilliseconds: number;
    players: Player[];
    state: RoomState;
}
