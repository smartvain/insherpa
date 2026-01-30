import { searchIncidents } from "../services/notion";
import type { SearchCommandArgs } from "../types";

export async function handleSearch({
  keyword,
  respond,
}: SearchCommandArgs): Promise<void> {
  if (!keyword) {
    await respond({
      text: "Usage: `/insh search <keyword>`",
      response_type: "ephemeral",
    });
    return;
  }

  try {
    const results = await searchIncidents(keyword);

    if (results.length === 0) {
      await respond({
        text: `:mag: No incidents found matching "${keyword}".`,
        response_type: "ephemeral",
      });
      return;
    }

    const blocks = [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:mag: *Search results for "${keyword}": ${results.length} found*`,
        },
      },
      ...results.flatMap((r) => [
        { type: "divider" as const },
        {
          type: "section" as const,
          text: {
            type: "mrkdwn" as const,
            text: `*${r.title}*\nSeverity: ${r.severity} | ${r.occurred_at || "Unknown"}\nResolution: ${r.resolution}`,
          },
          accessory: {
            type: "button" as const,
            text: { type: "plain_text" as const, text: "Open in Notion" },
            url: r.url,
          },
        },
      ]),
    ];

    await respond({
      text: `Search results for "${keyword}": ${results.length} found`,
      blocks,
      response_type: "in_channel",
    });
  } catch (error) {
    console.error("Search command error:", error);

    await respond({
      text: ":x: An error occurred while searching. Please try again later.",
      response_type: "ephemeral",
    });
  }
}
