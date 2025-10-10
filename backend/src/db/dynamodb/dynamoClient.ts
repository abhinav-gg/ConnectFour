import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { myConfig } from "@config/env";

// Create low-level DynamoDB client
const isProd = myConfig.NODE_ENV === "production";

const client = new DynamoDBClient({
  region: "us-east-1",
  ...(isProd ? {} : {
    credentials: {
      accessKeyId: myConfig.DYNAMODB_ACCESS,
      secretAccessKey: myConfig.DYNAMODB_PWD,
    }
  })
});

// Wrap it for high-level DocumentClient operations (auto-marshals JS objects)
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
    convertEmptyValues: true,
  }
});


export async function checkDynamoHealth(timeoutMs = 2000): Promise<boolean> {
  try {
    // Create a promise that rejects after timeoutMs to avoid hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DynamoDB health check timed out")), timeoutMs)
    );
    
    // List tables as a lightweight health check
    const listTablesPromise = client.send(new ListTablesCommand({ Limit: 1 }));
    
    await Promise.race([listTablesPromise, timeoutPromise]);
    console.log("[DynamoDB] Connected Successfully!")
  
    return true; // success
  } catch (err) {
    console.error("DynamoDB health check failed:", err);
    return false; // failure
  }
}

