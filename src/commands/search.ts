import { searchIncidents } from "../services/notion";
import type { SearchCommandArgs } from "../types";

export async function handleSearch({
  keyword,
  respond,
}: SearchCommandArgs): Promise<void> {
  if (!keyword) {
    await respond({
      text: "使用方法: `/insh search <キーワード>`",
      response_type: "ephemeral",
    });
    return;
  }

  try {
    const results = await searchIncidents(keyword);

    if (results.length === 0) {
      await respond({
        text: `:mag: 「${keyword}」に一致するインシデントは見つかりませんでした。`,
        response_type: "ephemeral",
      });
      return;
    }

    const blocks = [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:mag: *「${keyword}」の検索結果: ${results.length}件*`,
        },
      },
      ...results.flatMap((r) => [
        { type: "divider" as const },
        {
          type: "section" as const,
          text: {
            type: "mrkdwn" as const,
            text: `*${r.title}*\n深刻度: ${r.severity} | ${r.occurred_at || "日時不明"}\n対処: ${r.resolution}`,
          },
          accessory: {
            type: "button" as const,
            text: { type: "plain_text" as const, text: "Notionで開く" },
            url: r.url,
          },
        },
      ]),
    ];

    await respond({
      text: `「${keyword}」の検索結果: ${results.length}件`,
      blocks,
      response_type: "in_channel",
    });
  } catch (error) {
    console.error("Search command error:", error);

    await respond({
      text: ":x: 検索中にエラーが発生しました。しばらくしてから再度お試しください。",
      response_type: "ephemeral",
    });
  }
}
