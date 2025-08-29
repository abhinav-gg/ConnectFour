
export abstract class BotBase<GameState, Move> {
    protected game: GameState;

    constructor(game: GameState) {
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
