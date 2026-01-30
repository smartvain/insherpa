import { App, AwsLambdaReceiver } from "@slack/bolt";
import type {
  APIGatewayProxyEvent,
  Context,
  Callback,
  APIGatewayProxyResult,
} from "aws-lambda";
import { handleSummary } from "./commands/summary";
import { handleSearch } from "./commands/search";

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true,
});

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
        text: "使用方法: `/insh summary` または `/insh search <キーワード>`",
      });
      break;
  }
});

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => {
  const lambdaHandler = await awsLambdaReceiver.start();
  return lambdaHandler(event, context, callback);
};
