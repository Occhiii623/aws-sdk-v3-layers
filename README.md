# AWS SDK v3 - Operation Layers

`AWS SDK for JavsScript v3`での操作レイヤーをTypeScriptコードで作成。(in progress)
主にServerless開発で利用するサービス中心。自身の利用幅が広がれば拡張予定。
Lambdaでの使用を想定しています。

### Layer Codes
```text
src
├─test // test codes for Jest
│   ├─s3
│   ├─dynamodb
│   └─etc...
└─infrastructures
     ├─dynamodb // aws service layer
     ├─s3
     ├─sqs
     └─etc...
```

## Docker設定 (localstack)

- LocalStack起動
```
$ docker-compose up -d
```

- LocalStack終了
```
$ docker-compose down
```

- ログの確認
```
$ docker-compose logs
```

- ボリュームが不要になったら削除
```
$ docker volume ls // ボリューム一覧確認
RIVER    VOLUME NAME
local     localstack_localstack

$ docker volume rm localstack_localstack
localstack_localstack
```