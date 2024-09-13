"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMap = serializeMap;
/**
 * A Map is not serializable. The workaround is to create a tuple-like array
 * @param map
 */
function serializeMap(map) {
    if (map === undefined)
        return [];
    return Array.from(map.entries());
}
