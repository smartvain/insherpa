import { fetchThreadMessages } from "../services/slack";
import { structureIncident } from "../services/openai";
import { saveIncident } from "../services/notion";
import type { SummaryCommandArgs } from "../types";

export async function handleSummary({
  command,
  respond,
  client,
}: SummaryCommandArgs): Promise<void> {
  if (!command.thread_ts) {
    await respond({
      text: ":warning: Please use this command inside a thread.",
      response_type: "ephemeral",
    });
    return;
  }

  try {
    const conversation = await fetchThreadMessages(
      client,
      command.channel_id,
      command.thread_ts
    );

    const incident = await structureIncident(conversation);

    const threadUrl = `https://${command.team_domain}.slack.com/archives/${command.channel_id}/p${command.thread_ts.replace(".", "")}`;
    const notionUrl = await saveIncident(incident, threadUrl);

    await respond({
      text: `Incident knowledge saved: ${notionUrl}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:white_check_mark: *Incident knowledge saved*`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Title:*\n${incident.title}` },
            { type: "mrkdwn", text: `*Severity:*\n${incident.severity}` },
            { type: "mrkdwn", text: `*Cause:*\n${incident.cause}` },
            { type: "mrkdwn", text: `*Resolution:*\n${incident.resolution}` },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open in Notion" },
              url: notionUrl,
            },
          ],
        },
      ],
      response_type: "in_channel",
    });
  } catch (error) {
    console.error("Summary command error:", error);

    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    await respond({
      text: `:x: エラー: ${message}`,
      response_type: "ephemeral",
    });
  }
}
