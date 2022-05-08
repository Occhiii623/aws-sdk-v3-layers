'use strict';

/**
 * Memo -
 * -- STEP --
 * 1) start LocalStack `docker-compose up -d` in Root
 * 2) `tsc src/infrastructures/sqs.ts`
 * 3) `yarn test src/test/sqs/sqs.test.js`
 */

const { Sqs } = require('../../infrastructures/sqs.js');
const {
  SQSClient,
  CreateQueueCommand,
  ListQueuesCommand,
  DeleteQueueCommand,
  GetQueueAttributesCommand,
  GetQueueAttributesCommandInput
} = require('@aws-sdk/client-sqs');
require('dotenv').config();

/***************************************************************
 * Constants
 ***************************************************************/

const sqs = new Sqs(process.env.AWS_REGION, process.env.BASE_ENDPOINT);
const targetQueueName = process.env.QUEUE_NAME;
const queueUrl = process.env.BASE_ENDPOINT + `/${targetQueueName}`;
const testSqs = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: 'http://localhost:4566'
});

/***************************************************************
 * Test codes
 ***************************************************************/

// 作成済みキュー一覧の取得
function _getListQueue(prefix) {
  const params = prefix ? { QueueNamePrefix: prefix } : {};
  return testSqs.send(new ListQueuesCommand(params));
}

// 指定したキューを削除
function _deleteQueue(queueUrl) {
  return testSqs.send(
    new DeleteQueueCommand({
      QueueUrl: queueUrl
    })
  );
}

// キュー作成
async function _createQueue(queueName) {
  const result = await testSqs.send(
    new CreateQueueCommand({
      QueueName: queueName
    })
  );
  return result.QueueUrl;
}

// 指定したキューにあるメッセージ数を返却する
async function _getNumberOfMessages(queueUrl) {
  return await testSqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages']
    })
  );
}

describe('SQS - 正常系テスト', () => {
  /**
   * 前準備
   */
  beforeAll(async () => {
    // テスト用のキューがない場合は作成
    const result = await _getListQueue(targetQueueName);

    if (!result.QueueUrls) {
      await _createQueue(targetQueueName);
      console.log(`created ${targetQueueName} on LocalStack.`);
    }
  });

  /**
   * 後処理
   */
  afterAll(async () => {
    // テストで作成したキューを削除
    await _deleteQueue(queueUrl);
    console.log(`deleted ${targetQueueName}.`);
  });

  /**
   * テスト実行処理
   */
  it('指定したキューへメッセージを送信できること', async function () {
    const message = 'Hello World ;)';
    const res = await sqs.sendMessage(targetQueueName, message);
    const { Attributes } = await _getNumberOfMessages(queueUrl);
    expect(res.$metadata.httpStatusCode).toBe(200);
    expect(!!res.MessageId).toBe(true);
    expect(Attributes.ApproximateNumberOfMessages).toBe('1');
  });

  it('指定したキューからメッセージを受信できること', async function () {
    const res = await sqs.receiveMessage(targetQueueName, 1, 30);

    expect(res.$metadata.httpStatusCode).toBe(200);
    expect(res.Messages.length).toBe(1);
    expect(res.Messages[0].Body).toBe('Hello World ;)');
  });

  /*  it('指定したメッセージを削除できること', async function () {
    const res = await sqs.deleteMessage(targetQueueName, receiptHandle);
    expect(res.$metadata.httpStatusCode).toBe(200);
  });*/
});
