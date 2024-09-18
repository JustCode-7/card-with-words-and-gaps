export interface Card {
    id: string // uuid v4
    text: string
}

export function emptyCard() {
    return {id: '', text: ''}
}
