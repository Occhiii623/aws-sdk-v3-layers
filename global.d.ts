// <reference types="node" />

namespace NodeJS {
  interface ProcessEnv {
    readonly S3_BUCKET: string;
    readonly GET_IMAGE_NAME: string;
    readonly GET_TEXT_NAME: string;
    readonly PUT_OBJECT_NAME: string;
    readonly AWS_REGION: string;
    readonly QUEUE_NAME: string;
    readonly BASE_ENDPOINT: string;
  }
}
