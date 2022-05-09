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
```bash
$ docker-compose up -d
```

- LocalStack終了
```bash
$ docker-compose down
```

- ログの確認
```bash
$ docker-compose logs
```

- ボリュームが不要になったら削除
```bash
$ docker volume ls // ボリューム一覧確認
RIVER    VOLUME NAME
local     localstack_localstack

$ docker volume rm localstack_localstack
localstack_localstack
```
## テストの実行

[ 前提 ] LocalStackを起動させていること
- `src/infrastructures`配下の`.ts`ファイルをコンパイル
- `src/build`配下にコンパイル結果の`.js`ファイル出力

```bash
$ yarn build
```

- `src/test`配下の全てのテストファイルを一括実行する

```bash
$ yarn test
```

- ファイルごとに実行したい場合は以下のように対象ファイル名を指定して下さい
```bash
$ yarn test src/test/d3/s3.test.js
```