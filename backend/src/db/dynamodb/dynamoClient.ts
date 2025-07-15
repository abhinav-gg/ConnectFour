import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { myConfig } from "@/config/env";

// Create low-level DynamoDB client
const client = new DynamoDBClient({
  region: "us-east-1", // or your region
  credentials: {
    accessKeyId: myConfig.DYNAMODB_ACCESS,
    secretAccessKey: myConfig.DYNAMODB_PWD,
  }
});

// Wrap it for high-level DocumentClient operations (auto-marshals JS objects)
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
    convertEmptyValues: true,
  }
});

