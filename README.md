# AWS SDK v3 - Operation Layers

`AWS SDK for JavaScript v3`での操作レイヤーをTypeScriptコードで用意しています。(in progress)
主にServerless開発で利用するサービス中心。自身の利用幅が広がれば拡張予定。
Lambdaでの使用を想定しています。

### Layer Codes
```text
src
├─test-handler  // optional trial handler
└─layers
     ├─dynamodb // aws service layer
     ├─s3
     ├─sqs
     └─etc...
```
