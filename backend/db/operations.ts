import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { User } from '@/models/User';
import { UserOperations } from './userOps';
import * as DBError from './dbErrors';
import { GameOperations } from './gameOps';
import { OpeningOperations } from './openingOps';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";


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


  


};
