export interface Player {
    id: string; // uuid v4
    name: string;
}

export function emptyPlayer(): Player {
    return {id: '', name: ''}
}
