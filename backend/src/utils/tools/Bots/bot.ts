import { UUID } from "crypto";
import { Game } from "@shared/types/game.types";
import { Move } from '@shared/types/game.types';

export abstract class BotBase {
    public static id: string;
    protected game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Choose a move from a list of legal moves based on the game state.
     * Must be implemented by subclasses.
     */
    abstract chooseMove(): Promise<Move>;

    /**
     * Optional: Reset the bot between games.
     * Subclasses can override this to clear internal state.
     */
    reset(): void {
        // Default: do nothing
    }
}
