export function shuffle<T>(array: T[]) {
    const newArr = [...array];
    shuffleInPlace(newArr)
    return newArr
}

/**
 * Durstenfeld shuffle in place
 */
function shuffleInPlace(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
