import { UUID } from "crypto";
import { Game, Move, MoveClassification } from "@shared/types/game.types";
import { GameReview } from "../gameReview";

export abstract class BotBase {
    public static id: string;
    protected readonly game: Game;

    protected solver: GameReview | null = null;
    
    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Choose a move from a list of legal moves based on the game state.
     * Must be implemented by subclasses.
     */
    async chooseMove(): Promise<Move> {
        // return ANY legal move by default
        return this.game.getLegalMoves()[0];
    }

    /**
     * Optional: Reset the bot between games.
     * Subclasses can override this to clear internal state.
     */
    reset(): void {
        this.solver = null;
    }
}
