import { UserOperations } from './repositories/userOps';

export const rdsDBOps = {
  user: UserOperations,


  // // Custom Operations
  // registerToICHACK25: eventOps.registerToICHACK25.bind(eventOps),
  // getAllICHackers: eventOps.getAllICHackers.bind(eventOps),
};
