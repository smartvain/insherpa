import type { App } from "@slack/bolt";
import { handleSummary } from "./commands/summary";
import { handleSearch } from "./commands/search";

export function registerCommands(app: App): void {
  app.command("/insh", async ({ command, ack, respond, client }) => {
    const text = command.text.trim();
    const [subcommand, ...args] = text.split(/\s+/);

    switch (subcommand) {
      case "summary":
        await ack();
        await handleSummary({ command, respond, client });
        break;

      case "search":
        await ack();
        await handleSearch({ keyword: args.join(" "), respond, client });
        break;

      default:
        await ack({
          text: "Usage: `/insh summary` or `/insh search <keyword>`",
        });
        break;
    }
  });
}
