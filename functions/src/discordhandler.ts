import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import * as logger from "firebase-functions/logger";

const sendDiscordMessage = async (
  webhookUrl: string,
  data: RESTPostAPIWebhookWithTokenJSONBody
) => {
  logger.debug("sendDiscordMessage");
  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const sendDiscordBillingMessage = async (message: string) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;
  await sendDiscordMessage(webhookUrl, {
    username: "Firebase Billing",
    content: message,
    avatar_url:
      "https://firebase.google.com/static/images/brand-guidelines/logo-logomark.png",
  });
};
