"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeMap = deserializeMap;
/**
 * A Map is not serializable. The workaround is to create a tuple-like array
 * @param mapArray tuple-like array
 */
function deserializeMap(mapArray) {
    return new Map(mapArray);
}
