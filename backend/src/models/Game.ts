export interface Games {
    id: string
    short_id: string
    player1: string
    player2: string
    game_info: string
    elo_win: number
    elo_loss: number
    state: string
    created_at: string
}

export interface GameStates {
    id: string
    state: string
}

export interface Moves {
    id: string
    game_id: string
    player: string
    move: number
    col: number
    created_at: string
}