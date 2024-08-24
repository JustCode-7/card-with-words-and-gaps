import {Player} from "./player.js";

// TODO shared
export interface Room {
    roomId: string;
    createdTimestampMilliseconds: number;
    players: Player[];
}
