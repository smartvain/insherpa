# insherpa Specification

## Overview
A Slack bot that extracts incident knowledge from Slack thread conversations using LLM, structures it, and saves it to a Notion database for searchable incident history.

## Tech Stack
- TypeScript + pnpm
- AWS Lambda (Node.js 20.x) + API Gateway (production)
- Slack Bolt (`AwsLambdaReceiver` for Lambda, Socket Mode for local dev)
- OpenAI API (gpt-4o-mini)
- Notion API (@notionhq/client v2.x)
- esbuild (single-file bundling)

## Commands

### `/insh summary`
- Must be invoked inside a Slack thread
- Fetches all messages in the thread via Slack API
- Sends conversation to OpenAI with structured output (JSON Schema)
- Saves structured incident knowledge to Notion database
- Responds in Slack with summary and Notion link

### `/insh search <keyword>`
- Searches Notion database across 5 fields (Title, Symptoms, Cause, Resolution, Error Message) using OR compound filter with `contains`
- Returns up to 5 most recent matching incidents
- Displays title, severity, resolution, and Notion link

## Directory Structure
```
insherpa/
├── src/
│   ├── app.ts                # Shared command registration
│   ├── handler.ts            # Lambda entry point (AwsLambdaReceiver)
│   ├── local.ts              # Local dev entry point (Socket Mode)
│   ├── commands/
│   │   ├── summary.ts        # /insh summary handler
│   │   └── search.ts         # /insh search handler
│   ├── services/
│   │   ├── slack.ts          # Thread message fetching
│   │   ├── openai.ts         # LLM conversation structuring
│   │   └── notion.ts         # Notion save/search
│   └── types.ts              # Type definitions
├── .claude/
│   └── spec.md               # This file
├── .github/
│   └── workflows/
│       └── release.yml       # Build → zip → GitHub Releases
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md                 # English (default)
└── README.ja.md              # Japanese
```

## Notion Database Schema

| Property | Type | Description |
|---|---|---|
| Title | Title | Concise incident title |
| Symptoms | Text | Description of observed symptoms |
| Cause | Text | Root cause explanation |
| Resolution | Text | How it was resolved |
| Severity | Select | `monitor` / `action_required` / `critical` |
| Occurred At | Date | When the incident occurred (ISO 8601) |
| Responder | Text | Primary responder name |
| Slack Thread | URL | Link to original Slack thread |
| Services | Multi-select | Related service/system names |
| Error Message | Text | Raw error message if available |

## OpenAI Integration
- Model: `gpt-4o-mini`
- System prompt: Japanese (to correctly interpret Japanese Slack conversations)
- Response format: JSON Schema with `strict: true` (structured output)
- Temperature: `0.2` (deterministic extraction)
- Fields extracted: title, symptoms, cause, resolution, severity, occurred_at, responder, services, error_message
- Unknown fields default to empty string `""`

## Key Design Decisions

### Each incident is saved separately
Even if the same error message occurs multiple times, each incident is stored as a separate record. The same error may have different causes and resolutions.

### Slack 3-second timeout
- `processBeforeResponse: true` is used in Lambda (required for Lambda environment)
- gpt-4o-mini is fast (~1s) so total processing fits within 3 seconds
- If exceeded, Lambda still completes processing; the data is saved to Notion

### Notion rich_text 2000-char limit
All text fields are truncated to 2000 characters before saving to Notion.

### Search behavior
- Substring match (`contains` filter) across 5 fields with OR logic
- Case-insensitive for Latin characters, exact match for Japanese
- Returns up to 5 results sorted by creation time descending

## Deployment

### Production (AWS Lambda)
- esbuild bundles all dependencies into a single `dist/index.js`
- GitHub Actions builds and attaches `insherpa.zip` to GitHub Releases on tag push
- Users download zip → upload to Lambda → set environment variables → connect API Gateway

### Local Development (Socket Mode)
- `pnpm dev` runs via tsx with dotenv
- Requires `SLACK_APP_TOKEN` (xapp-...) in addition to other env vars
- No URL exposure needed; connects via WebSocket

## Environment Variables

| Variable | Required For | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Both | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Both | Slack App Signing Secret |
| `SLACK_APP_TOKEN` | Local only | App-Level Token for Socket Mode (`xapp-...`) |
| `OPENAI_API_KEY` | Both | OpenAI API Key |
| `NOTION_TOKEN` | Both | Notion Integration Token |
| `NOTION_DATABASE_ID` | Both | Notion Database ID |

## Slack App Configuration
- Bot Token Scopes: `commands`, `channels:history`, `groups:history`, `chat:write`
- Slash Command: `/insh` (Usage Hint: `summary | search <keyword>`)
- Socket Mode: enabled (for local development)
