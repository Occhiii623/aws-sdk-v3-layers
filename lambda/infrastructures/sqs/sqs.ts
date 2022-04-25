import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import type { SendMessageRequest, ReceiveMessageRequest, DeleteMessageRequest } from '@aws-sdk/client-sqs';

export class Sqs {
  private readonly baseUrl: string;
  private readonly Sqs: SQSClient;

  constructor(region: string, baseUrl: string) {
    this.baseUrl = baseUrl;
    this.Sqs = new SQSClient({
      apiVersion: '2012-11-05',
      region: region
    });
  }

  /**
   * メッセージ送信
   * @param queueName - 送信先キュー名称
   * @param message - 送信メッセージ
   * @param delaySec - 配信遅延(秒)
   * @param groupId - メッセージグループID
   * @param duplicationId - メッセージ重複排除ID
   */
  sendMessage(queueName: string, message: string, delaySec?: number, groupId?: string, duplicationId?: string) {
    let delay = 0;
    if (delaySec) {
      delay = delaySec;
    }

    const params: SendMessageRequest = {
      MessageBody: message,
      QueueUrl: `${this.baseUrl}/${queueName}`,
      DelaySeconds: delay
    };

    if (groupId) {
      params.MessageGroupId = groupId;
    }
    if (duplicationId) {
      params.MessageDeduplicationId = duplicationId;
    }
    return this.Sqs.send(new SendMessageCommand(params));
  }

  /**
   * メッセージ受信
   * @param queueName - 受信先キュー名称
   * @param maxMessageNum - 最大受信数
   * @param time - 可視性タイムアウト(秒)
   */
  getMessage(queueName: string, maxMessageNum?: number, time?: number) {
    let maxReceiveMessages = 1;
    let visibilityTimeout = 40;

    if (maxMessageNum) {
      maxReceiveMessages = maxMessageNum;
    }
    if (time) {
      visibilityTimeout = time;
    }
    const params: ReceiveMessageRequest = {
      QueueUrl: `${this.baseUrl}/${queueName}`,
      MaxNumberOfMessages: maxReceiveMessages,
      VisibilityTimeout: visibilityTimeout
    };

    return this.Sqs.send(new ReceiveMessageCommand(params));
  }

  /**
   * メッセージ削除
   */
  deleteMessage(queueName: string, receiptHandle: string) {
    const params: DeleteMessageRequest = {
      QueueUrl: `${this.baseUrl}/${queueName}`,
      ReceiptHandle: receiptHandle
    };
    return this.Sqs.send(new DeleteMessageCommand(params));
  }
}
