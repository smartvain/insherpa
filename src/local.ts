import { App } from "@slack/bolt";
import { registerCommands } from "./app";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN!,
});

registerCommands(app);

(async () => {
  await app.start();
  console.log("insherpa is running in Socket Mode");
})();
