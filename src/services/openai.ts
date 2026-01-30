import OpenAI from "openai";
import type { IncidentKnowledge } from "../types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたはインシデント対応のナレッジを構造化するアシスタントです。
Slackスレッドの会話内容を分析し、以下のJSON形式でインシデント情報を抽出してください。

会話から読み取れない項目は空文字 "" を設定してください。
深刻度は会話の内容から判断し、「monitor」「action_required」「critical」のいずれかを選択してください。
サービスは会話中で言及されているサービス名やシステム名を配列で抽出してください。
発生日時は会話から推測できる場合はISO 8601形式で、不明な場合は空文字にしてください。
対応者は会話で主に対応にあたった人の名前を記載してください。`;

const INCIDENT_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "incident_knowledge",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "インシデントの簡潔なタイトル",
        },
        symptoms: {
          type: "string",
          description: "発生した症状の説明",
        },
        cause: {
          type: "string",
          description: "原因の説明",
        },
        resolution: {
          type: "string",
          description: "実施した対処方法",
        },
        severity: {
          type: "string",
          enum: ["monitor", "action_required", "critical"],
          description: "深刻度",
        },
        occurred_at: {
          type: "string",
          description: "発生日時（ISO 8601形式、不明な場合は空文字）",
        },
        responder: {
          type: "string",
          description: "主な対応者名",
        },
        services: {
          type: "array",
          items: { type: "string" },
          description: "関連するサービス名",
        },
        error_message: {
          type: "string",
          description: "エラーメッセージ（あれば）",
        },
      },
      required: [
        "title",
        "symptoms",
        "cause",
        "resolution",
        "severity",
        "occurred_at",
        "responder",
        "services",
        "error_message",
      ],
      additionalProperties: false,
    },
  },
};

export async function structureIncident(
  conversation: string
): Promise<IncidentKnowledge> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `以下のSlackスレッドの会話内容からインシデントナレッジを抽出してください。\n\n---\n${conversation}\n---`,
      },
    ],
    response_format: INCIDENT_SCHEMA,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(content) as IncidentKnowledge;
}
