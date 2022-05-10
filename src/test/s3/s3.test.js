const { S3Serializer } = require('../../build/s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/***************************************************************
 * Constants
 ***************************************************************/

const s3 = new S3Serializer(process.env.AWS_REGION, { accessKeyId: 'dummy', secretAccessKey: 'dummy' });
const bucketName = process.env.S3_BUCKET;
const imageName = process.env.GET_IMAGE_NAME;
const textFileName = process.env.GET_TEXT_NAME;
const putTargetObject = process.env.PUT_OBJECT_NAME;

/***************************************************************
 * Test codes
 ***************************************************************/

describe('S3 - 正常系テスト', () => {
  /**
   * 前準備
   */
  beforeAll(async () => {
    // テスト用のバケットがない場合は作成
    if (!(await s3.exists(bucketName))) {
      await s3.createBucket(bucketName);
      console.log(`created ${bucketName} on LocalStack.`);
    }

    // 署名URL発行対象のオブジェクトがない場合はアップロード
    if (!(await s3.exists(bucketName, imageName))) {
      const data = fs.createReadStream(path.resolve(__dirname, './data/dummy.png'));
      await s3.put(bucketName, imageName, data, 'image/png');
      console.log(`uploaded ${imageName} to ${bucketName}.`);
    }

    // テキストファイル取得テスト用のファイルをアップロード
    if (!(await s3.exists(bucketName, textFileName))) {
      const text = fs.readFileSync(path.resolve(__dirname, './data/test.txt'), 'utf8');
      await s3.put(bucketName, textFileName, text, 'text/plain');
      console.log(`uploaded ${textFileName} to ${bucketName}.`);
    }
  });

  /**
   * 後処理
   */
  afterAll(async () => {
    // テストで保存したオブジェクトを削除
    if (await s3.exists(bucketName, putTargetObject)) {
      await s3.delete(bucketName, putTargetObject);
      console.log(`deleted ${putTargetObject} from ${bucketName}.`);
    }
  });

  /**
   * テスト実行処理
   */
  it('S3バケットからテキストファイルを取得できること', async function () {
    const bodyContents = await s3.get(bucketName, textFileName);

    expect(bodyContents).toBe('This is text for the test.');
  });

  it('S3バケットからバイナリオブジェクトを取得できること', async function () {
    const file = await s3.getBinary(bucketName, imageName);

    expect(Buffer.isBuffer(file)).toBe(true);
  });

  it('S3バケットに対してオブジェクトを保存できること', async function () {
    const data = fs.createReadStream(path.resolve(__dirname, './data/put_dummy.jpg'));
    const res = await s3.put(bucketName, putTargetObject, data, 'image/jpg');

    expect(res.$metadata.httpStatusCode).toBe(200);
    expect(await s3.exists(bucketName, putTargetObject)).toBe(true);
  });

  it('署名付きURLを発行できること', async function () {
    const regex = new RegExp('^https?://');
    const url = await s3.getSignedUrl(bucketName, imageName, 15000);
    console.log('署名付きURLを発行しました', url);
    const isPublished = regex.test(url);

    expect(isPublished).toBe(true);
  });
});
