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
      text: ":warning: このコマンドはスレッド内で使用してください。",
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
      text: `インシデントナレッジを保存しました: ${notionUrl}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:white_check_mark: *インシデントナレッジを保存しました*`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*タイトル:*\n${incident.title}` },
            { type: "mrkdwn", text: `*深刻度:*\n${incident.severity}` },
            { type: "mrkdwn", text: `*原因:*\n${incident.cause}` },
            { type: "mrkdwn", text: `*対処:*\n${incident.resolution}` },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Notionで開く" },
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
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    await respond({
      text: `:x: エラー: ${message}`,
      response_type: "ephemeral",
    });
  }
}
