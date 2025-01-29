import { UserOperations } from './userOps';
import * as DBError from './dbErrors';
import { GameOperations } from './gameOps';
import { OpeningOperations } from './openingOps';

const databaseOps = new UserOperations();
const openingOps = new OpeningOperations();
const gameOps = new GameOperations();

export const dbOperations = {
  // User Operations
  __getAllUsers: databaseOps.__getAllUsers.bind(databaseOps),  // deprecated, remove ASAP
  createUser: databaseOps.createUser.bind(databaseOps),
  recordUserLogin: databaseOps.recordUserLogin.bind(databaseOps),
  getUserByUsername: databaseOps.getUserByUsername.bind(databaseOps),
  getUserByEmail: databaseOps.getUserByEmail.bind(databaseOps),
  getPasswordHashByUsername: databaseOps.getPasswordHashByUsername.bind(databaseOps),
  getPasswordHashByEmail: databaseOps.getPasswordHashByEmail.bind(databaseOps),
  getIDByUsername: databaseOps.getIDByUsername.bind(databaseOps),
  getIDByEmail: databaseOps.getIDByEmail.bind(databaseOps),
  getUserByID: databaseOps.getUserByID.bind(databaseOps),
  getAllUserTagNames: databaseOps.getAllUserTagNames.bind(databaseOps),
  getAnonymousUser: databaseOps.getAnonymousUser.bind(databaseOps),
  createUserSession: databaseOps.createUserSession.bind(databaseOps),
  revokeSessionByUID: databaseOps.revokeSessionByUID.bind(databaseOps),
  revokeSessionByToken: databaseOps.revokeSessionByToken.bind(databaseOps),
  getUserFromSession: databaseOps.getUserFromSession.bind(databaseOps),

  // Opening Operations
  GetOpening: openingOps.GetOpening.bind(openingOps),
  CreateOpening: openingOps.CreateOpening.bind(openingOps),

  // Game Operations
  GetGameByShortCode: gameOps.GetGameByShortCode.bind(gameOps),
  MakeMove: gameOps.MakeMove.bind(gameOps),
  BeginFindingGame: gameOps.BeginFindingGame.bind(gameOps),
  FinishedGameLookup: gameOps.FinishedGameLookup.bind(gameOps),
  GetGameByPlayerLookup: gameOps.GetGameByPlayerLookup.bind(gameOps),
  GetMovesByShortCode: gameOps.GetMovesByShortCode.bind(gameOps),
  GetGameByID: gameOps.GetGameByID.bind(gameOps),
  GetExactTimeControl: gameOps.GetExactTimeControl.bind(gameOps),
  GetGameModeID: gameOps.GetGameModeID.bind(gameOps),
  GetGameInfoID: gameOps.GetGameInfoID.bind(gameOps),
  CreateGame: gameOps.CreateGame.bind(gameOps),
  GetTimeControlFromShortCode: gameOps.GetTimeControlFromShortCode.bind(gameOps),
  GetGameModeFromShortCode: gameOps.GetGameModeFromShortCode.bind(gameOps),
  AssignGame: gameOps.AssignGame.bind(gameOps),
  UnassignGame: gameOps.UnassignGame.bind(gameOps),
  GetPlayerStats: gameOps.GetPlayerStats.bind(gameOps),
  SetPlayerElo: gameOps.SetPlayerElo.bind(gameOps),
  GetPlayersByShortCode: gameOps.GetPlayersByShortCode.bind(gameOps),
  UpdateElo: gameOps.UpdateElo.bind(gameOps),
  QueryMatckmaking: gameOps.QueryMatckmaking.bind(gameOps),
  UpdateGameStatusByShortCode: gameOps.UpdateGameStatusByShortCode.bind(gameOps),
  GetTimeSinceLastGameLookup: gameOps.GetTimeSinceLastGameLookup.bind(gameOps),
  UpdateRD: gameOps.UpdateRD.bind(gameOps),
};
