/**
 * A Map is not serializable. The workaround is to create a tuple-like array
 * @param mapArray tuple-like array
 */
export function deserializeMap<T, U>(mapArray: [T, U][]): Map<T, U> {
    return new Map(mapArray)
}
