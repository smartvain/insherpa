import { Client } from "@notionhq/client";
import type { IncidentKnowledge, SearchResult } from "../types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID!;

function truncate(text: string, maxLength = 2000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function saveIncident(
  incident: IncidentKnowledge,
  slackThreadUrl: string
): Promise<string> {
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      タイトル: {
        title: [{ text: { content: truncate(incident.title) } }],
      },
      症状: {
        rich_text: [{ text: { content: truncate(incident.symptoms) } }],
      },
      原因: {
        rich_text: [{ text: { content: truncate(incident.cause) } }],
      },
      対処: {
        rich_text: [{ text: { content: truncate(incident.resolution) } }],
      },
      深刻度: {
        select: { name: incident.severity },
      },
      発生日時: incident.occurred_at
        ? { date: { start: incident.occurred_at } }
        : { date: null },
      対応者: {
        rich_text: [{ text: { content: truncate(incident.responder) } }],
      },
      Slackスレッド: {
        url: slackThreadUrl,
      },
      サービス: {
        multi_select: incident.services.map((s) => ({ name: s })),
      },
      エラーメッセージ: {
        rich_text: [{ text: { content: truncate(incident.error_message) } }],
      },
    },
  });

  return (response as any).url;
}

export async function searchIncidents(
  keyword: string
): Promise<SearchResult[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: [
        { property: "タイトル", title: { contains: keyword } },
        { property: "症状", rich_text: { contains: keyword } },
        { property: "原因", rich_text: { contains: keyword } },
        { property: "対処", rich_text: { contains: keyword } },
        { property: "エラーメッセージ", rich_text: { contains: keyword } },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 5,
  });

  return response.results.map((page: any) => ({
    title: page.properties["タイトル"].title[0]?.plain_text ?? "",
    resolution: page.properties["対処"].rich_text[0]?.plain_text ?? "",
    url: page.url,
    severity: page.properties["深刻度"].select?.name ?? "",
    occurred_at: page.properties["発生日時"].date?.start ?? "",
  }));
}
