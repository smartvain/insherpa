# insherpa

A Slack bot that extracts incident knowledge from conversation threads using AI, structures it, and saves it to a Notion database for searchable incident history.

[日本語版 README](./README.ja.md)

## Features

- `/insh summary` — Run inside a thread to analyze the conversation with AI, extract structured knowledge (symptoms, cause, resolution, etc.), and save it to Notion
- `/insh search <keyword>` — Search past incidents by keyword and instantly see how they were resolved

## Setup

### 1. Create a Slack App

1. Create a new app at [Slack API](https://api.slack.com/apps)
2. Add the following **Bot Token Scopes** under OAuth & Permissions:
   - `commands`
   - `channels:history`
   - `groups:history`
   - `chat:write`
3. Create a Slash Command under **Slash Commands**:
   - Command: `/insh`
   - Request URL: `https://<your-api-gateway-url>/slack/events`
   - Short Description: `Save and search incident knowledge`
   - Usage Hint: `summary | search <keyword>`
4. Install the app to your workspace and note the Bot User OAuth Token

### 2. Set Up Notion

1. Create an integration at [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a database with the following properties:

| Property | Type |
|---|---|
| Title | Title |
| Symptoms | Text |
| Cause | Text |
| Resolution | Text |
| Severity | Select (monitor / action_required / critical) |
| Occurred At | Date |
| Responder | Text |
| Slack Thread | URL |
| Services | Multi-select |
| Error Message | Text |

3. Share the database with your integration (Share → Invite)

### 3. OpenAI

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)

### 4. Deploy to AWS Lambda

1. Download the latest `insherpa.zip` from [GitHub Releases](../../releases)
2. Create an AWS Lambda function:
   - Runtime: Node.js 20.x
   - Handler: `index.handler`
   - Memory: 256MB
   - Timeout: 10 seconds
3. Upload `insherpa.zip`
4. Set environment variables (see below)
5. Create an API Gateway (HTTP API) and connect a POST route to the Lambda
6. Set the API Gateway URL as the Request URL in your Slack App

## Environment Variables

| Variable | Description |
|---|---|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Slack App Signing Secret |
| `OPENAI_API_KEY` | OpenAI API Key |
| `NOTION_TOKEN` | Notion Integration Token |
| `NOTION_DATABASE_ID` | Notion Database ID |

## Development

### Prerequisites

- Node.js 20+
- pnpm

### Build

```sh
pnpm install
pnpm build
```

### Type Check

```sh
pnpm typecheck
```

## License

MIT
