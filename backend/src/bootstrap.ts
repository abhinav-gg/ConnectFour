import { checkRDSHealth } from './db/rds/rdsClient';
import { checkDynamoHealth } from './db/dynamodb/dynamoClient';
import { checkRedisHealth } from './redis/redisHelper';
import { setupGameMetaIndex } from './redis/repositories/gameOps';
import { getRedisClient } from './redis/redisClient';
import { OpeningManager } from './utils/opening-book';


export async function bootstrap() {

    if (!await checkRedisHealth())
        console.error("No Redis :(")

    if (!await checkDynamoHealth())
        console.error("No Dynamo :(")

    if (!await checkRDSHealth())
        console.error("No RDS :(")

    await setupGameMetaIndex(await getRedisClient());

    await OpeningManager.initStore();

}