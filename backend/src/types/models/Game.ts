import { TimeControl } from "@shared/Models/gameInfo";
import { GameMode } from "@shared/Models/gameInfo";
import { UUID } from "crypto"

export type GameInfo = {
    id: UUID;
    gamemode: UUID;
    time_control: UUID;
};


export type Game = {
    id: string
    short_id: string
    game_info: string
    state: string
    created_at: number
}

export type GameStates = {
    id: string
    state: string
}

export type Move = {
    game_id: UUID,
    move: number,
    player: UUID,
    col: number,
    played_at: number,
    delta: number
}