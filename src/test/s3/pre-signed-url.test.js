'use strict';

/**
 * Memo - 署名付きURL発行はaws-sdk-client-mockで非対応のためLocalStack使用
 * -- STEP --
 * 1) start LocalStack `docker-compose up -d` in Root
 * 2) `tsc src/infrastructures/s3.ts`
 * 3) `yarn test src/test/s3/pre-signed-url.test.js`
 */

const { S3Serializer } = require('../../infrastructures/s3.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bucketName = process.env.S3_BUCKET;
const objectName = process.env.TEST_OBJECT_NAME;
const s3 = new S3Serializer(process.env.AWS_REGION);

/***************************************************************
 * Functions
 ***************************************************************/

async function generateUrl() {
  try {
    const regex = new RegExp('^https?://');

    const url = await s3.getSignedUrl(bucketName, objectName, 15000);
    console.log('署名付きURLを発行しました', url);

    if (regex.test(url)) return 'OK';
    else return 'NG';
  } catch (err) {
    console.error(err);
  }
}

/***************************************************************
 * Test codes
 ***************************************************************/

beforeAll(async () => {
  console.log('start initial setup...');

  // テスト用のバケットがない場合は作成
  if (!(await s3.exists(bucketName))) {
    console.log('create s3-bucket...');
    await s3.createBucket(bucketName);
    console.log('created s3-bucket on LocalStack.');
  }

  // 署名URL発行対象のオブジェクトがない場合はアップロード
  if (!(await s3.exists(bucketName, objectName))) {
    console.log('set test-image.png');
    const data = fs.createReadStream(path.resolve(__dirname, './data/dummy.png'));
    await s3.put(bucketName, objectName, data, 'image/png');
    console.log('done initial setup.');
  }
});

describe('localstack上のS3アクセスの署名URLを発行できる', () => {
  it('成功', async function () {
    const result = await generateUrl();
    expect(result).toBe('OK');
  });
});
