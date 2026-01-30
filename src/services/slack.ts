import type { WebClient } from "@slack/web-api";

export async function fetchThreadMessages(
  client: WebClient,
  channelId: string,
  threadTs: string
): Promise<string> {
  const result = await client.conversations.replies({
    channel: channelId,
    ts: threadTs,
    limit: 100,
  });

  if (!result.messages || result.messages.length === 0) {
    throw new Error("スレッドにメッセージがありません。");
  }

  return result.messages
    .filter((msg) => !msg.bot_id)
    .map((msg) => {
      const user = msg.user ?? "unknown";
      const text = msg.text ?? "";
      return `[${user}] ${text}`;
    })
    .join("\n");
}
