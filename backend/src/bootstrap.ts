import { checkRDSHealth } from './db/rds/rdsClient';
import { checkDynamoHealth } from './db/dynamodb/dynamoClient';
import { checkRedisHealth } from './redis/redisHelper';
import { setupGameMetaIndex } from './redis/repositories/gameOps';
import { getRedisClient } from './redis/redisClient';
import { OpeningManager } from './utils/opening-book';
import { setupAllJobs } from './jobs';

export async function bootstrap() {

    if (!await checkRedisHealth())
        throw new Error("No Redis :(")

    if (!await checkDynamoHealth())
        throw new Error("No Dynamo :(")

    if (!await checkRDSHealth())
        throw new Error("No RDS :(")

    await setupGameMetaIndex(await getRedisClient());

    await OpeningManager.initStore();

    await setupAllJobs();


    console.log("[Bootstrap complete]   All services are up and running!");
}