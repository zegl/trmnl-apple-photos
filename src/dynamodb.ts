import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const getDynamoDBClient = () => {
  return new DynamoDBClient({
    region: 'eu-north-1',
  });
};
