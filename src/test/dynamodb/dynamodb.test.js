const { DynamoSerializer } = require('../../build/dynamodb');
const userData = require('./data/users.json');
const {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
  ScanCommand
} = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

/***************************************************************
 * Constants
 ***************************************************************/

const dynamo = new DynamoSerializer(process.env.AWS_REGION);
const tableName = process.env.TABLE_NAME;
const testDynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'dummy', secretAccessKey: 'dummy' }
});
const testClient = DynamoDBDocumentClient.from(testDynamo);

/***************************************************************
 * Test codes
 ***************************************************************/
jest.setTimeout(10000);

describe('DynamoDB - 正常系テスト', () => {
  beforeAll(async () => {
    const { TableNames } = await testClient.send(new ListTablesCommand({}));

    // テーブル存在確認
    if (!TableNames.includes(tableName)) {
      // テーブルが存在しない場合は作成
      await testClient.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            },
            {
              AttributeName: 'group',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          GlobalSecondaryIndexes: [
            {
              IndexName: 'group-index',
              KeySchema: [
                {
                  AttributeName: 'group',
                  KeyType: 'HASH'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ]
        })
      );
      console.log(`created ${tableName} on LocalStack.`);
    }
  });

  afterAll(async () => {
    // データクリアのため削除
    await testClient.send(
      new DeleteTableCommand({
        TableName: tableName
      })
    );
    console.log(`deleted ${tableName}.`);
  });

  const user1_id = 'test_001';
  it('ユーザーのレコードを1件登録してgetで取得できること', async () => {
    console.log('uuid', user1_id);
    const params = {
      id: user1_id,
      group: 'group_test',
      name: 'Mayumi'
    };
    const res = await dynamo.put(tableName, params);
    expect(res.$metadata.httpStatusCode).toBe(200);

    const item = await dynamo.get(tableName, { id: user1_id });
    expect(item.id).toBe(user1_id);
    expect(item.name).toBe('Mayumi');
  });

  it('ユーザー名を更新できること', async () => {
    const key = {
      id: user1_id
    };
    const expression = 'set #Name = :Name';
    const value = {
      ':Name': 'Kotetsu'
    };
    const attrNames = {
      '#Name': 'name'
    };
    const res = await dynamo.update(tableName, key, expression, value, attrNames);
    expect(res.$metadata.httpStatusCode).toBe(200);
    expect(res.Attributes.name).toBe('Kotetsu');
  });

  it('レコードを1件削除できること', async () => {
    const key = { id: user1_id };
    const res = await dynamo.delete(tableName, key);
    expect(res.$metadata.httpStatusCode).toBe(200);
    const { Count } = await testClient.send(
      new ScanCommand({
        TableName: tableName,
        Select: 'COUNT'
      })
    );
    expect(Count).toBe(0);
  });

  it('指定したgroupに合致するユーザーのレコードを取得できること', async () => {
    const count = 200;
    const promises = [];
    userData.items.forEach((user) => {
      promises.push(
        dynamo.put(tableName, {
          id: user.id,
          group: user.group,
          name: user.name
        })
      );
    });
    await Promise.all(promises);
    // クエリでgroup1のユーザーレコードを取得する
    const condition = '#Group = :Group';
    const attr = { '#Group': 'group' };
    const value = {
      ':Group': 'group1' // group1のユーザーを指定
    };
    const res = await dynamo.query(tableName, condition, attr, value, 'group-index');
    expect(res.Count).toBe(2);
    expect(res.Items[0]).toEqual({
      id: '001',
      group: 'group1',
      name: 'Hideki'
    });
    expect(res.Items[1].group).toBe('group1');
  });
});
