import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { UserOperations } from './userOps';
import * as DBError from './dbErrors';
import { GameOperations } from './gameOps';
import { OpeningOperations } from './openingOps';

const databaseOps = new UserOperations();
const openingOps = new OpeningOperations();

export const dbOperations = {
  // deprecated, remove ASAP
  __getAllUsers: databaseOps.__getAllUsers.bind(databaseOps),
  // new
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

  GetOpening: openingOps.GetOpening.bind(openingOps),
  CreateOpening: openingOps.CreateOpening.bind(openingOps)

  
};
