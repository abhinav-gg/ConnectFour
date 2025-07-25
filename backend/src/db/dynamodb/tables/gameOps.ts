import { ddb } from "../dynamoClient";
import { PutCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GameTable, PlayerDataTable, ShortcodeGameTable } from "../dynamoTables";
import { GAME } from "@/db/models/Game";
import { uuidToBuffer } from "@/utils/binary";
import { DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

export const GameOperations = {

  async addGame(newGameItem: GAME)  {
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

  async GetGameByShortCode (shortcode: string) {
    const resp = await ddb.send(new GetItemCommand({
      TableName: ShortcodeGameTable,
      Key: { p: { S: shortcode } },
      ProjectionExpression: "g"
    }));
    return resp.Item?.g?.S || null;
  },

  async assignShortcode(shortcode: string, gameId: string) {
    try {
      await ddb.send(new PutCommand({
        TableName: ShortcodeGameTable,
        Item: { p: {S: shortcode}, g: {S: gameId} },
        ConditionExpression: 'attribute_not_exists(p)'
      }));
      return true; // unique assignment succeeded
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ConditionalCheckFailedException') {
        return false; // collision -- generate again
      }
      throw err;
    }
  },
  
  // On abort/backout
  async deleteShortcode(shortcode: string) {
    await ddb.send(new DeleteItemCommand({
      TableName: ShortcodeGameTable,
      Key: { p: {S: shortcode} }
    }));
  },



}