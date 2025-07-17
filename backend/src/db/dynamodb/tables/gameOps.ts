import { ddb } from "../dynamoClient";
import { PutCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GameTable, PlayerDataTable, ModeEloPrefix } from "../dynamoTables";
import { Game } from "@/db/models/Game";
import { uuidToBuffer } from "@/utils/binary";

export const GameOperations = {

  async addGame(newGameItem: Game)  {
    const params = {
      TableName: GameTable,
      Item: newGameItem
    };

    await ddb.send(new PutCommand(params));
    console.log('✅ Game item with short field names added.');

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

  async GetGameByShortCode (shortCode: string) {
    
  },




}