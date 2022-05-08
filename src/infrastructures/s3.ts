import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import type { S3ClientConfig, GetObjectRequest, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export class S3Serializer {
  private readonly s3: S3Client;
  constructor(readonly region: string, assumeRoleCredential?: Credentials) {
    let params: S3ClientConfig;

    params = {
      apiVersion: '2006-03-01',
      region: region,
      // ! Add to test on LocalStack (#endpoint & #forcePathStyle)
      endpoint: 'http://localhost:4566',
      forcePathStyle: true
    };
    if (assumeRoleCredential) {
      params.credentials = assumeRoleCredential;
    }
    this.s3 = new S3Client(params);
  }

  /**
   * 指定のS3バケット or バケット内にオブジェクト存在有無を返却する
   * @returns 存在する: true / 存在しない: false
   */
  async exists(bucketName: string, objectName?: string) {
    try {
      if (objectName) {
        await this.s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName
          })
        );
        return true;
      }

      await this.s3.send(
        new HeadBucketCommand({
          Bucket: bucketName
        })
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * バケット新規作成
   */
  createBucket(bucketName: string) {
    return this.s3.send(
      new CreateBucketCommand({
        Bucket: bucketName
      })
    );
  }

  /**
   * S3バケットから指定したテキストデータを取得する
   */
  async get(bucketName: string, objectName: string) {
    try {
      const params: GetObjectRequest = {
        Bucket: bucketName,
        Key: objectName
      };
      const { Body } = await this.s3.send(new GetObjectCommand(params));
      // v3ではBody.toString()でのテキスト抽出ができない為、Streamを変換します
      const body: Readable = Body as Readable;
      return Buffer.from(await body.read()).toString();
    } catch (err) {
      console.error('S3からオブジェクト取得中に例外発生', err);
      throw err;
    }
  }

  /**
   * S3バケットから指定したファイルをバイナリ形式で取得する
   */
  // eslint-disable-next-line consistent-return
  async getBinary(bucketName: string, objectName: string) {
    try {
      const params: GetObjectRequest = {
        Bucket: bucketName,
        Key: objectName
      };

      const { Body } = await this.s3.send(new GetObjectCommand(params));
      const body: Readable = Body as Readable;
      return Buffer.from(await body.read());
    } catch (err) {
      console.error('S3からオブジェクト取得中に例外発生', err);
    }
  }

  /**
   * S3バケットに対してオブジェクトを保存する
   * NOTE: Default値はよしなに変えてください
   */
  put(
    bucketName: string,
    objectName: string,
    data: PutObjectCommandInput['Body'],
    contentType = 'application/json',
    storageClass = 'STANDARD'
  ) {
    const params: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: objectName,
      Body: data,
      ContentType: contentType,
      StorageClass: storageClass
    };
    return this.s3.send(new PutObjectCommand(params));
  }

  /**
   * S3バケットから指定したオブジェクトを削除する
   */
  delete(bucketName: string, objectName: string) {
    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectName
      })
    );
  }

  /**
   * S3バケットの指定したファイルに対する署名付きURLを作成する
   * NOTE: 有効期限(expire)は秒単位での指定
   */
  getSignedUrl(bucketName: string, objectName: string, expire?: number) {
    const getObjectParams: GetObjectRequest = {
      Bucket: bucketName,
      Key: objectName
    };

    const command = new GetObjectCommand(getObjectParams);
    let expireOption;
    // default expiresIn at 900 seconds(15 minutes)
    if (expire) {
      expireOption = { expiresIn: expire };
    }
    return getSignedUrl(this.s3, command, expireOption);
  }
}
