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
      Title: {
        title: [{ text: { content: truncate(incident.title) } }],
      },
      Symptoms: {
        rich_text: [{ text: { content: truncate(incident.symptoms) } }],
      },
      Cause: {
        rich_text: [{ text: { content: truncate(incident.cause) } }],
      },
      Resolution: {
        rich_text: [{ text: { content: truncate(incident.resolution) } }],
      },
      Severity: {
        select: { name: incident.severity },
      },
      "Occurred At": incident.occurred_at
        ? { date: { start: incident.occurred_at } }
        : { date: null },
      Responder: {
        rich_text: [{ text: { content: truncate(incident.responder) } }],
      },
      "Slack Thread": {
        url: slackThreadUrl,
      },
      Services: {
        multi_select: incident.services.map((s) => ({ name: s })),
      },
      "Error Message": {
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
        { property: "Title", title: { contains: keyword } },
        { property: "Symptoms", rich_text: { contains: keyword } },
        { property: "Cause", rich_text: { contains: keyword } },
        { property: "Resolution", rich_text: { contains: keyword } },
        { property: "Error Message", rich_text: { contains: keyword } },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 5,
  });

  return response.results.map((page: any) => ({
    title: page.properties["Title"].title[0]?.plain_text ?? "",
    resolution: page.properties["Resolution"].rich_text[0]?.plain_text ?? "",
    url: page.url,
    severity: page.properties["Severity"].select?.name ?? "",
    occurred_at: page.properties["Occurred At"].date?.start ?? "",
  }));
}
