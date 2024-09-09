import {Player} from "./player.js";

export interface JoinRoomEvent {
    roomId: string; // uuid v4
    player: Player
}

