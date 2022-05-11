import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import type {
  GetCommandInput,
  UpdateCommandInput,
  PutCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput
} from '@aws-sdk/lib-dynamodb';

/* eslint-disable @typescript-eslint/no-explicit-any */
type KeyType = {
  [p: string]: any;
};

type AttrNamesType = {
  [p: string]: string;
};

type QueryResult = {
  Count: number;
  Items: any[];
};

export class DynamoSerializer {
  private readonly client: DynamoDBDocumentClient;
  constructor(region: string) {
    const dbClient = new DynamoDBClient({
      apiVersion: '2012-08-10',
      region: region,
      // ! Add to test on LocalStack (#endpoint)
      endpoint: 'http://localhost:4566',
      credentials: { accessKeyId: 'dummy', secretAccessKey: 'dummy' }
    });

    const marshallOptions = {
      convertEmptyValues: true // 空の文字列、Blobなどの中身を自動的にnullへ変換する
    };

    this.client = DynamoDBDocumentClient.from(dbClient, { marshallOptions });
  }

  put(tableName: string, params: KeyType) {
    const data: PutCommandInput = {
      TableName: tableName,
      Item: params
    };
    return this.client.send(new PutCommand(data));
  }

  async get(tableName: string, key: KeyType, projection?: string) {
    try {
      const params: GetCommandInput = {
        TableName: tableName,
        Key: key
      };

      if (projection) {
        params.ProjectionExpression = projection;
      }

      const output = await this.client.send(new GetCommand(params));
      return output.Item;
    } catch (err) {
      console.error(`${tableName}からレコード取得中に例外発生`);
      throw err;
    }
  }

  update(tableName: string, key: KeyType, expression: string, values: KeyType, attrNames?: AttrNamesType) {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: key,
      UpdateExpression: expression,
      ExpressionAttributeValues: values,
      ReturnValues: 'UPDATED_NEW'
    };

    if (attrNames) {
      params.ExpressionAttributeNames = attrNames;
    }

    return this.client.send(new UpdateCommand(params));
  }

  delete(tableName: string, key: KeyType) {
    const params: DeleteCommandInput = {
      TableName: tableName,
      Key: key
    };
    return this.client.send(new DeleteCommand(params));
  }

  async query(
    tableName: string,
    condition: string,
    attrNames: AttrNamesType,
    values: KeyType,
    indexName?: string,
    filter?: string,
    projection?: string,
    limit?: number,
    indexForward?: boolean
  ) {
    const result: QueryResult = {
      Count: 0,
      Items: []
    };
    try {
      let recordsCount = 0;
      let lastEvaluatedKey = null;

      const params: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: condition,
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: values
      };

      if (indexName) {
        params.IndexName = indexName;
      }

      if (filter) {
        params.FilterExpression = filter;
      }

      if (projection) {
        params.ProjectionExpression = projection;
      }

      if (typeof indexForward === 'boolean') {
        params.ScanIndexForward = indexForward;
      }

      do {
        const output = await this.client.send(new QueryCommand(params));
        result.Items = result.Items.concat(output.Items);
        if (output.Count) {
          recordsCount += output.Count;
        }
        lastEvaluatedKey = output.LastEvaluatedKey;

        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        if (limit && recordsCount > limit) {
          lastEvaluatedKey = null;
        }
      } while (lastEvaluatedKey);

      result.Count = result.Items.length;
      return result;
    } catch (err) {
      console.error(`${tableName}へクエリ実行中に例外発生`, err);
      throw err;
    }
  }

  async scan(
    tableName: string,
    filter: string,
    attrNames: AttrNamesType,
    attrValues: KeyType,
    projection?: string,
    limit?: number
  ) {
    try {
      const params: ScanCommandInput = {
        TableName: tableName,
        FilterExpression: filter,
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues
      };
      if (projection) {
        params.ProjectionExpression = projection;
      }
      if (limit) {
        params.Limit = limit;
      }

      let results: any[] = [];
      let lastEvaluatedKey = null;
      /* eslint-enable */

      do {
        const output = await this.client.send(new ScanCommand(params));
        results = results.concat(output.Items);
        lastEvaluatedKey = output.LastEvaluatedKey;

        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }
      } while (lastEvaluatedKey);
      // eslint-disable-next-line  @typescript-eslint/no-unsafe-return
      return results;
    } catch (err) {
      console.error(`${tableName}へのスキャン実行中に例外発生`, err);
      throw err;
    }
  }
}
