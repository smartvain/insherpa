# insherpa

Slackスレッドのインシデント対応会話をAIで構造化し、Notionデータベースに保存・検索できるSlack Botです。

[English README](./README.md)

## 機能

- `/insh summary` — スレッド内で実行すると、会話内容をAIが分析し、症状・原因・対処などを構造化してNotionに保存します
- `/insh search <キーワード>` — 過去のインシデントをキーワードで検索し、対処方法を即座に確認できます

## セットアップ

### 1. Slack App の作成

1. [Slack API](https://api.slack.com/apps) で新しいアプリを作成
2. **OAuth & Permissions** で以下のBot Token Scopesを追加:
   - `commands`
   - `channels:history`
   - `groups:history`
   - `chat:write`
3. **Slash Commands** で `/insh` コマンドを作成:
   - Command: `/insh`
   - Request URL: `https://<your-api-gateway-url>/slack/events`
   - Short Description: `インシデントナレッジの保存・検索`
   - Usage Hint: `summary | search <keyword>`
4. ワークスペースにアプリをインストールし、Bot User OAuth Tokenを控える

### 2. Notion の準備

1. [Notion Integrations](https://www.notion.so/my-integrations) でインテグレーションを作成
2. 以下のプロパティを持つデータベースを作成:

| プロパティ名 | 種類 |
|---|---|
| Title | タイトル |
| Symptoms | テキスト |
| Cause | テキスト |
| Resolution | テキスト |
| Severity | セレクト（monitor / action_required / critical） |
| Occurred At | 日付 |
| Responder | テキスト |
| Slack Thread | URL |
| Services | マルチセレクト |
| Error Message | テキスト |

3. データベースページでインテグレーションにアクセスを許可（Share → Invite）

### 3. OpenAI

1. [OpenAI Platform](https://platform.openai.com/) でAPIキーを取得

### 4. AWS Lambda のデプロイ

1. [GitHub Releases](../../releases) から最新の `insherpa.zip` をダウンロード
2. AWS Lambda関数を作成:
   - ランタイム: Node.js 20.x
   - ハンドラー: `index.handler`
   - メモリ: 256MB
   - タイムアウト: 10秒
3. `insherpa.zip` をアップロード
4. 環境変数を設定（下記参照）
5. API Gateway（HTTP API）を作成し、POSTルートをLambdaに接続
6. API GatewayのURLをSlack AppのRequest URLに設定

## 環境変数

| 変数名 | 説明 |
|---|---|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Slack App Signing Secret |
| `OPENAI_API_KEY` | OpenAI API Key |
| `NOTION_TOKEN` | Notion Integration Token |
| `NOTION_DATABASE_ID` | Notion Database ID |

## 開発

### 必要なもの

- Node.js 20+
- pnpm

### ビルド

```sh
pnpm install
pnpm build
```

### 型チェック

```sh
pnpm typecheck
```

## ライセンス

MIT
