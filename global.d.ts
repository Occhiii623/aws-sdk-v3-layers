// <reference types="node" />

namespace NodeJS {
  interface ProcessEnv {
    readonly S3_BUCKET: string;
    readonly TEST_OBJECT_NAME: string;
    readonly AWS_REGION: string;
  }
}
