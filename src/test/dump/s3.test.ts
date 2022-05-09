// /**
//  * Memo -
//  * aws-sdk-client-mock利用の試験的なテストコード
//  * Mockでの利用はサービスへのアクセスを必要としない。
//  * AWSサービスとの疎通テストを行う目的の為、LocalStackでのテストをメインとする
//  */
//
// /***************************************************************
//  * Modules
//  ***************************************************************/
// import fs from 'fs';
// import path from 'path';
// import { S3Serializer } from '../../infrastructures/s3';
// import { mockClient } from 'aws-sdk-client-mock';
// import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
// import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
// import dotenv from 'dotenv';
// dotenv.config();
//
// // create Mock Instance
// const s3Mock = mockClient(S3Client);
//
// /***************************************************************
//  * Functions
//  ***************************************************************/
//
// // set constants
// const s3 = new S3Serializer('ap-northeast-1');
// const bucketName = process.env.S3_BUCKET;
//
// const getObject = async (bucketName: string, objectName: string) => {
//   try {
//     const file = await s3.get(bucketName, objectName);
//     if (!file) return 'NG';
//     return 'OK';
//   } catch (err: unknown) {
//     console.log(err);
//     if (err instanceof Error) {
//       throw err;
//     }
//   }
// };
//
// const getBinaryObject = async (bucketName: string, objectName: string) => {
//   try {
//     const file = await s3.getBinary(bucketName, objectName);
//     if (!file) return 'NG';
//     return 'OK';
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       throw err;
//     }
//   }
// };
//
// const putObject = async (
//   bucketName: string,
//   objectName: string,
//   data: PutObjectCommandInput['Body'],
//   contentType: string
// ) => {
//   try {
//     const result = await s3.put(bucketName, objectName, data, contentType);
//     if (result.$metadata.httpStatusCode && result.$metadata.httpStatusCode >= 400) {
//       return 'NG';
//     }
//     return 'OK';
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       throw err;
//     }
//   }
// };
//
// /***************************************************************
//  * Test codes
//  ***************************************************************/
//
// beforeEach(() => {
//   s3Mock.reset();
// });
//
// describe('S3 - 正常系テスト', () => {
//   // テスト用に使用するオブジェクト名
//   const objName = 'DummyObjectKey';
//
//   describe('S3のオブジェクトを取得できること', () => {
//     it('成功', async () => {
//       s3Mock
//         .on(GetObjectCommand, {
//           Bucket: bucketName,
//           Key: objName
//         })
//         .resolves({
//           $metadata: {
//             httpStatusCode: 200
//           },
//           Body: fs.createReadStream(path.resolve(__dirname, './data/dummy.png'))
//         });
//       const result = await getObject(bucketName, objName);
//       expect(result).toBe('OK');
//     });
//   });
//
//   describe('S3からバイナリのオブジェクトを取得できること', () => {
//     it('成功', async () => {
//       s3Mock
//         .on(GetObjectCommand, {
//           Bucket: bucketName,
//           Key: objName
//         })
//         .resolves({
//           $metadata: {
//             httpStatusCode: 200
//           },
//           Body: fs.createReadStream(path.resolve(__dirname, './data/dummy.png'))
//         });
//       const result = await getBinaryObject(bucketName, objName);
//       expect(result).toBe('OK');
//     });
//   });
//
//   describe('S3バケットに対してオブジェクトを保存できること', () => {
//     const putFileName = process.env.PUT_OBJECT_NAME;
//     const data = fs.createReadStream(path.resolve(__dirname, './data/dummy.png'));
//     it('成功', async () => {
//       s3Mock
//         .on(PutObjectCommand, {
//           Bucket: bucketName,
//           Key: putFileName,
//           Body: data,
//           ContentType: 'image/png'
//         })
//         .resolves({
//           $metadata: {
//             httpStatusCode: 200
//           }
//         });
//       const result = await putObject(bucketName, putFileName, data, 'image/png');
//       expect(result).toBe('OK');
//     });
//   });
// });
