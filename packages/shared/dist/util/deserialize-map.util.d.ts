/**
 * A Map is not serializable. The workaround is to create a tuple-like array
 * @param mapArray tuple-like array
 */
export declare function deserializeMap<T, U>(mapArray: [T, U][]): Map<T, U>;
//# sourceMappingURL=deserialize-map.util.d.ts.map