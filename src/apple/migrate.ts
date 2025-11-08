// import { getSupabaseClientForUser } from '@/supabase';
// import { AppleBlobRepository } from './blobs';
// import { getDynamoDBClient, getS3Client } from '@/dynamodb';

// const migrate = async () => {
//   const supabaseClient = getSupabaseClientForUser('123');
//   const dynamodbclient = getDynamoDBClient();
//   const s3Client = getS3Client();

//   const appleBlobRepository = new AppleBlobRepository(
//     dynamodbclient,
//     supabaseClient,
//     s3Client
//   );

//   await appleBlobRepository.migrateAllSupabaseUsersToDynamoDB();
// };

// migrate();
