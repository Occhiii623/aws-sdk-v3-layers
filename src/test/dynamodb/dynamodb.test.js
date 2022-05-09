const { DynamoSerializer } = require('../../build/dynamodb');
const { DynamoDBClient, ListTablesCommand, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

/***************************************************************
 * Constants
 ***************************************************************/

const dynamo = new DynamoSerializer(process.env.AWS_REGION);
const tableName = process.env.TABLE_NAME;
const testDynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: 'http://localhost:4566'
});
const testClient = DynamoDBDocumentClient.from(testDynamo);
const { v4: uuid4 } = require('uuid');

/***************************************************************
 * Test codes
 ***************************************************************/

beforeAll(async () => {
  const { TableNames } = await testClient.send(new ListTablesCommand({}));

  // テーブル存在確認
  if (TableNames.includes(tableName)) {
    await testClient.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      })
    );
  }
});
