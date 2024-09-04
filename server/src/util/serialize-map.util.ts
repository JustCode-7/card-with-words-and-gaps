/**
 * A Map is not serializable. The workaround is to create a tuple-like array
 * @param map
 */
export function serializeMap<T, U>(map: Map<T, U> | undefined): [T, U][] {
    if (map === undefined) return [];
    return Array.from(map.entries())
}
