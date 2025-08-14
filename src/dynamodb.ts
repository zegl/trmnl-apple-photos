import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

export const getDynamoDBClient = () => {
  return new DynamoDBClient({
    region: 'eu-north-1',
  });
};

export const getS3Client = () => {
  return new S3Client({
    region: 'eu-north-1',
  });
};
