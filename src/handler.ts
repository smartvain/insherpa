import { App, AwsLambdaReceiver } from "@slack/bolt";
import type {
  APIGatewayProxyEvent,
  Context,
  Callback,
  APIGatewayProxyResult,
} from "aws-lambda";
import { registerCommands } from "./app";

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true,
});

registerCommands(app);

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => {
  const lambdaHandler = await awsLambdaReceiver.start();
  return lambdaHandler(event, context, callback);
};
