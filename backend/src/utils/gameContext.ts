import { redisOps } from "@/redis/ops";
import { GameMetadata, GameTimedata } from "@/redis/redisSchema";
import { Move } from "@shared/types/game";

// A context object to store the game state and reduce Redis calls
export class GameContext {
    userId: string;
    shortcode: string | null = null;
    gameId: string | null = null;
    
    // Cached data to avoid repeated Redis calls
    private _metadata: GameMetadata | null = null;
    private _timedata: GameTimedata | null = null;
    private _moves: Move[] | null = null;
    private _isPlayerInGame: boolean | null = null;
    private _playerIndex: number | null = null;

    constructor(userId: string, shortcode?: string, gameId?: string) {
        this.userId = userId;
        this.shortcode = shortcode || null;
        this.gameId = gameId || null;
    }

    // Static factory method to create context from shortcode
    static async fromShortcode(userId: string, shortcode: string): Promise<GameContext> {
        const context = new GameContext(userId, shortcode);
        await context.resolveGameId();
        return context;
    }

    // Static factory method to create context from gameId
    static async fromGameId(userId: string, gameId: string): Promise<GameContext> {
        const context = new GameContext(userId, undefined, gameId);
        await context.getMetadata(); // This will also resolve shortcode
        return context;
    }

    // Resolve gameId from shortcode
    async resolveGameId(): Promise<string | null> {
        if (this.gameId) return this.gameId;
        const r = await redisOps();
        this.gameId = await r.game.getUserQueueGameId(this.userId);
        if (!this.gameId && this.shortcode) {
            this.gameId = await r.game.findGameByShortcode(this.shortcode);
        }
        return this.gameId;
    }

    // Get metadata with caching
    async getMetadata(): Promise<GameMetadata | null> {
        if (this._metadata) return this._metadata;
        
        if (!this.gameId) {
            await this.resolveGameId();
            if (!this.gameId) return null;
        }

        const r = await redisOps();
        this._metadata = await r.game.getGameMetadata(this.gameId);
        
        // Cache shortcode if we got it from metadata
        if (this._metadata?.shortcode && !this.shortcode) {
            this.shortcode = this._metadata.shortcode;
        }
        
        return this._metadata;
    }

    // Get timedata with caching
    async getTimedata(): Promise<GameTimedata | null> {
        if (this._timedata) return this._timedata;
        
        if (!this.gameId) {
            await this.resolveGameId();
            if (!this.gameId) return null;
        }

        const r = await redisOps();
        this._timedata = await r.game.getGameTimes(this.gameId);
        return this._timedata;
    }

    // Get moves with caching
    async getMoves(): Promise<Move[]> {
        if (this._moves) return this._moves;
        
        if (!this.gameId) {
            await this.resolveGameId();
            if (!this.gameId) return [];
        }

        const r = await redisOps();
        this._moves = await r.game.getGameMoves(this.gameId);
        return this._moves;
    }

    // Check if user is a player in this game
    async isPlayerInGame(): Promise<boolean> {
        if (this._isPlayerInGame !== null) return this._isPlayerInGame;
        
        const metadata = await this.getMetadata();
        if (!metadata) {
            this._isPlayerInGame = false;
            return false;
        }

        this._isPlayerInGame = metadata.players.includes(this.userId);
        return this._isPlayerInGame;
    }

    // Get player index (0 or 1) for this user
    async getPlayerIndex(): Promise<number | null> {
        if (this._playerIndex !== null) return this._playerIndex;
        
        const metadata = await this.getMetadata();
        if (!metadata) return null;

        this._playerIndex = metadata.players.indexOf(this.userId);
        return this._playerIndex >= 0 ? this._playerIndex : null;
    }

    // Check if it's this user's turn
    async isCurrentPlayerTurn(): Promise<boolean> {
        const timedata = await this.getTimedata();
        const playerIndex = await this.getPlayerIndex();
        
        if (!timedata || playerIndex === null) return false;
        
        return timedata.cTurn === playerIndex;
    }

    // Get the opponent's userId
    async get2PlayerOpponentUserId(): Promise<string | null> {
        const metadata = await this.getMetadata();
        const playerIndex = await this.getPlayerIndex();
        
        if (!metadata || playerIndex === null || metadata.players.length < 2) return null;
        
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        return metadata.players[opponentIndex] || null;
    }

    // Validate that the user is in the correct game room
    async validatePlayerInRoom(): Promise<void> {
        if (!this.gameId) {
            await this.resolveGameId();
            if (!this.gameId) {
                throw new Error('Game not found');
            }
        }

        const isPlayer = await this.isPlayerInGame();
        if (!isPlayer) {
            throw new Error('User is not a player in this game');
        }
    }

    // Cache invalidation methods for when data changes
    invalidateMetadata(): void {
        this._metadata = null;
    }

    invalidateTimedata(): void {
        this._timedata = null;
    }

    invalidateMoves(): void {
        this._moves = null;
    }

    invalidatePlayerData(): void {
        this._isPlayerInGame = null;
        this._playerIndex = null;
    }

    invalidateAll(): void {
        this.invalidateMetadata();
        this.invalidateTimedata();
        this.invalidateMoves();
        this.invalidatePlayerData();
    }

    // Update cached data after Redis operations
    updateCachedMetadata(metadata: GameMetadata): void {
        this._metadata = metadata;
        if (metadata.shortcode && !this.shortcode) {
            this.shortcode = metadata.shortcode;
        }
    }

    updateCachedTimedata(timedata: GameTimedata): void {
        this._timedata = timedata;
    }

    addMoveToCache(move: Move): void {
        if (this._moves) {
            this._moves.push(move);
        }
    }

    // Utility method to get all data at once
    async getAllGameData(): Promise<{
        metadata: GameMetadata | null;
        timedata: GameTimedata | null;
        moves: Move[];
        gameId: string | null;
        shortcode: string | null;
    }> {
        const metadata = await this.getMetadata();
        const timedata = await this.getTimedata();
        const moves = await this.getMoves();

        return {
            metadata,
            timedata,
            moves,
            gameId: this.gameId,
            shortcode: this.shortcode
        };
    }
}
