import {Player} from "../model/player.js";

const map = new Map<string, Map<string, Player>>();

export function initPlayerMapFor(room: string) {
    map.set(room, new Map<string, Player>());
}
