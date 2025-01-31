export type Player = 0 | 1;
export type Cell = Player | null
export type Move = { player: Player; col: number }

export type DrawMatrix = {
    confirmAction: boolean,
    acceptAction: boolean,
    offerAction: boolean
}

// share the board and functionality as well in the future