import { ddb } from "../dynamoClient";
import { PutCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GameTable, PlayerDataTable, ShortcodeGameTable } from "../dynamoTables";
import { GAME_SCHEMA, GAMEPLAYERS_SCHEMA } from "@/db/models/Game";
import { uuidToBuffer } from "@/utils/binary";
import { DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { TimedStandardGame } from "@shared/utils/Games/timed-game";
import { GameState } from "@shared/constants/allgamestates";
import { genGameShortcode } from "@/utils/game";

export const GameOperations = {

  async checkShortcodeUniqueness(shortcode: string): Promise<boolean> {
    const params = {
      TableName: ShortcodeGameTable,
      Key: { p: { S: shortcode } },
    };
    try {
      const result = await ddb.send(new GetItemCommand(params));
      return !result.Item; // If no item found, shortcode is unique
    } catch (err) {
      console.error("Error checking shortcode uniqueness:", err);
      throw err;
    }
  },

  async assignShortcode(shortcode: string, gameId: Buffer) {
    
    await ddb.send(new PutCommand({
      TableName: ShortcodeGameTable,
      Item: { p: {S: shortcode}, g: {B: gameId} },
      ConditionExpression: 'attribute_not_exists(p)'
    }));
  
  },

  async storeGame(gameId: Buffer, players: string[], data: Buffer, gameInfo: number, result: GameState, shortcode?: string)  {

    // make the game
    const newGameItem = {
      p: gameId,
      c: shortcode || null,
      u: players,
      d: data,
      i: gameInfo,
      r: result,
    }

    const success = GAME_SCHEMA.safeParse(newGameItem);
    if (!success.success) {
      console.error("Invalid game item:", success.error);
      throw new Error("Invalid game item");
    }

    const params = {
      TableName: GameTable,
      Item: success.data,
    };

    await ddb.send(new PutCommand(params));
    console.log('✅ Game item with short field names added.');

  },

  async getUniqueShortcode(): Promise<string> {
    let shortcode: string;
    do {
      shortcode = genGameShortcode();
    } while (!(await this.checkShortcodeUniqueness(shortcode)));
    return shortcode;
  },

  async registerPlayerGame(user: string, gameId: Buffer, startTime: number, gameInfo: number, startElo?: number, deltaElo?: number) {

    const newPlayerData = {
      p: user,
      s: gameId,
      t: startTime,
      m: gameInfo,
      e: startElo || null,
      d: deltaElo || null,
    };

    const success = GAMEPLAYERS_SCHEMA.safeParse(newPlayerData);
    if (!success.success) {
      console.error("Invalid player data:", success.error);
      throw new Error("Invalid player data");
    }

    const params = {
      TableName: PlayerDataTable,
      Item: success.data,
    };
    await ddb.send(new PutCommand(params));
  },

  // Read all game items (scan entire table)
  async readAllGames() {
    try {
      const result = await ddb.send(
        new ScanCommand({
          TableName: GameTable,
        })
      );
      return result.Items || [];
    } catch (err) {
      console.error("Error reading games:", err);
      throw err;
    }
  },

  async getGameById(gameId: string) {
    const params = {
      TableName: GameTable,
      Key: {
        gameId: uuidToBuffer(gameId),
      },
    };

    try {
      const result = await ddb.send(new QueryCommand(params));
      return result.Items ? result.Items[0] : null;
    } catch (error) {
      console.error("Error getting game by ID:", error);
      throw error;
    }
  },

  async GetGameByShortCode (shortcode: string) {
    const resp = await ddb.send(new GetItemCommand({
      TableName: ShortcodeGameTable,
      Key: { p: { S: shortcode } },
      ProjectionExpression: "g"
    }));
    return resp.Item?.g?.S || null;
  },
  
  // On abort/backout
  async deleteShortcode(shortcode: string) {
    await ddb.send(new DeleteItemCommand({
      TableName: ShortcodeGameTable,
      Key: { p: {S: shortcode} }
    }));
  },



}