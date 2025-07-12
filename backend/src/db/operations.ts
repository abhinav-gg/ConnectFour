import { UserOperations } from './repositories/userOps';
import * as DBError from './dbErrors';

const databaseOps = new UserOperations();

export const dbOperations = {
  user: UserOperations,


  // // Custom Operations
  // registerToICHACK25: eventOps.registerToICHACK25.bind(eventOps),
  // getAllICHackers: eventOps.getAllICHackers.bind(eventOps),
};
