import { ddb } from "../dynamoClient";
import { PutCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GameTable, PlayerDataTable, ModeEloPrefix } from "../dynamoTables";
import { Game } from "@/db/models/Game";
import { keyWithPrefix, uuidToBuffer } from "@/utils/binary";

export const GameOperations = {

  async addGame(newGameItem: Game)  {
    try {
      const params = {
        TableName: GameTable,
        Item: newGameItem
      };

      await ddb.send(new PutCommand(params));
      console.log('✅ Game item with short field names added.');
    } catch (err) {
      console.error('❌ Error adding game item:', err);
    }
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

  async writeDeltaElo(playerId: string, gameUuid: string, deltaElo:number) {
    const item = {
      p: uuidToBuffer(playerId),         // PK: binary with 'p' prefix
      s: keyWithPrefix('g', uuidToBuffer(gameUuid)),        // SK: binary with 'g' prefix + UUID
      d: deltaElo
    };
  
    await ddb.send(new PutCommand({
      TableName: GameTable,
      Item: item
    }));
  },
  
  async writeCurrentElo(playerId: string, gameModeBin: Buffer, elo: number) {
    const item = {
      p: uuidToBuffer(playerId),     // PK: binary with 'p' prefix
      s: keyWithPrefix(ModeEloPrefix, gameModeBin),                // SK: binary with ModeEloPrefix prefix + game mode
      d: elo
    };
  
    await ddb.send(new PutCommand({
      TableName: GameTable,
      Item: item
    }));
  },


  /**
   * Write aggregated ELO with binary keys stored as array of {k, v}
   * 
   * @param {string} playerUuid - player UUID string
   * @param {string} dateStr - date string in YYYYMMDD
   * @param {Map<Buffer, number>} eloMap - Map with Buffer keys and number values
   */
  async writeAggregatedElo(playerUuid: string, dateStr: string, eloMap: Map<Buffer, number> ) {
    const item = {
      p: uuidToBuffer(playerUuid),
      s: keyWithPrefix('a', Buffer.from(dateStr)),
      m: Array.from(eloMap.entries()).map(([k, v]) => ({ k, v }))
    };

    await ddb.send(new PutCommand({
      TableName: PlayerDataTable,
      Item: item
    }));
  },
  
  async getDeltaEloForGame(playerId: string, gameId: string) {
    const pKey = uuidToBuffer(playerId);
    const sKey = keyWithPrefix('g', uuidToBuffer(gameId));

    const result = await ddb.send(new QueryCommand({
      TableName: PlayerDataTable,
      KeyConditionExpression: 'p = :p AND s = :s',
      ExpressionAttributeValues: {
        ':p': pKey,
        ':s': sKey
      },
      ProjectionExpression: 'd'
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    return result.Items[0].d ?? null; // Return delta or null if not found
  },

  /**
   * Query all current Elo data for a player UUID
   * @param {string} playerUuid - UUID string
   * @returns {Promise<Array>} - list of items matching current Elo (s starting with ModeEloPrefix)
   */
  async queryCurrentElo(playerUuid: string) {
    const pkBuffer = uuidToBuffer(playerUuid);

    const params = {
      TableName: PlayerDataTable,
      KeyConditionExpression: '#p = :p AND begins_with(#s, :sPrefix)',
      ExpressionAttributeNames: {
        '#p': 'p',
        '#s': 's'
      },
      ExpressionAttributeValues: {
        ':p': pkBuffer,
        ':sPrefix': Buffer.from(ModeEloPrefix, 'utf8')
      }
    };

    const data = await ddb.send(new QueryCommand(params));
    return data.Items;
  },

  /**
   * Update current Elo value for player and gamemode
   * @param {string} playerUuid - player UUID string
   * @param {Buffer} gamemodeBuffer - Buffer representing the gamemode binary key (without prefix)
   * @param {number} newElo - new Elo rating to set
   */
  async updateCurrentElo(playerUuid: string, gamemodeBuffer: Buffer, newElo: number) {
    const pkBuffer = uuidToBuffer(playerUuid);
    const sortKey = keyWithPrefix(ModeEloPrefix, gamemodeBuffer);

    const params = {
      TableName: PlayerDataTable,
      Key: {
        p: pkBuffer,
        s: sortKey
      },
      UpdateExpression: 'SET d = :elo',
      ExpressionAttributeValues: {
        ':elo': newElo
      }
    };

    await ddb.send(new UpdateCommand(params));
  },

  async changeCurrentElo(playerUuid: string, gamemodeBuffer: Buffer, delta: number) {
    const pkBuffer = uuidToBuffer(playerUuid);
    const sortKey = keyWithPrefix(ModeEloPrefix, gamemodeBuffer);
  
    const params = {
      TableName: PlayerDataTable,
      Key: {
        p: pkBuffer,
        s: sortKey
      },
      UpdateExpression: 'ADD d :delta',
      ExpressionAttributeValues: {
        ':delta': delta
      }
    };
  
    await ddb.send(new UpdateCommand(params));
  }

}