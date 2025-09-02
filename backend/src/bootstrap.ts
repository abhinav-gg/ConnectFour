import { checkRDSHealth } from './db/rds/rdsClient';
import { checkDynamoHealth } from './db/dynamodb/dynamoClient';
import { checkRedisHealth } from './redis/redisHelper';
import { setupGameMetaIndex } from './redis/repositories/gameOps';
import { getRedisClient } from './redis/redisClient';
import { setupAllAPIJobs, setupAllSocketJobs } from './jobs';
import { getConnect4Solver } from '@shared/WASM/con4Solver.node';

async function bootstrap() {

    if (!await checkRedisHealth())
        throw new Error("No Redis :(")

    if (!await checkDynamoHealth())
        throw new Error("No Dynamo :(")

    if (!await checkRDSHealth())
        throw new Error("No RDS :(")

    await setupGameMetaIndex(await getRedisClient()); // temporary, change to setup all redis schema indexes
}

export async function bootstrapAPI() {

    await bootstrap();

    await setupAllAPIJobs(); // creates all empty job sets

    console.log("[Bootstrap complete]   All services are up and running!");

}

export async function bootstrapSocket() {

    await bootstrap();

    await setupAllSocketJobs(); // creates all empty job sets

    await getConnect4Solver(); // warm up the WASM module

    console.log("[Bootstrap complete]   All services are up and running!");

}

