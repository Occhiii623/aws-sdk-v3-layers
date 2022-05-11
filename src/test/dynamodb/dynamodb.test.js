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

// 複数のユーザーレコードを登録
function _putUsersData() {
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
  return Promise.all(promises);
}

// テーブルのレコード数を返却
async function _selectCount() {
  const { Count } = await testClient.send(
    new ScanCommand({
      TableName: tableName,
      Select: 'COUNT'
    })
  );
  return Count;
}

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
      group: 'group-test',
      name: 'Mayumi'
    };
    const res = await dynamo.put(tableName, params);
    expect(res.$metadata.httpStatusCode).toBe(200);

    const item = await dynamo.get(tableName, { id: user1_id });
    expect(item).toEqual({
      id: user1_id,
      group: 'group-test',
      name: 'Mayumi'
    });
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
    const count = await _selectCount();
    expect(count).toBe(0);
  });

  it('指定したgroupに合致するユーザーのレコードをqueryで取得できること', async () => {
    await _putUsersData();
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

  it('指定したgroupに合致するユーザーのレコードをscanで取得できること', async () => {
    const count = await _selectCount();
    if (count === 0) await _putUsersData();
    const filter = '#group = :group';
    const attr = {
      '#group': 'group'
    };
    const value = {
      ':group': 'group2'
    };
    const items = await dynamo.scan(tableName, filter, attr, value);
    expect(items.length).toBe(2);
    expect(items[0]).toEqual({
      id: '003',
      group: 'group2',
      name: 'Takeshi'
    });
  });
});
