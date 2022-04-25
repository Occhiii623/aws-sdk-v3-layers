import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3ClientConfig, GetObjectRequest, PutObjectRequest } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export class S3Serializer {
  private readonly s3: S3Client;
  constructor(readonly region: string, assumeRoleCredential?: Credentials) {
    const params: S3ClientConfig = {
      apiVersion: '2006-03-01',
      region: region
    };
    if (assumeRoleCredential) {
      params.credentials = assumeRoleCredential;
    }

    this.s3 = new S3Client(params);
  }

  /**
   * S3バケットから指定したファイルを取得する
   */
  async get(bucketName: string, objectName: string) {
    try {
      const params: GetObjectRequest = {
        Bucket: bucketName,
        Key: objectName
      };

      const output = await this.s3.send(new GetObjectCommand(params));
      // Convert Body from a Buffer to a String.
      return output.Body?.toString();
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

      const output = await this.s3.send(new GetObjectCommand(params));
      // return Body as a Buffer
      return output.Body;
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
    data: PutObjectRequest['Body'],
    contentType = 'application/json',
    storageClass = 'STANDARD'
  ) {
    const params: PutObjectRequest = {
      Bucket: bucketName,
      Key: objectName,
      Body: data,
      ContentType: contentType,
      StorageClass: storageClass
    };

    return this.s3.send(new PutObjectCommand(params));
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
