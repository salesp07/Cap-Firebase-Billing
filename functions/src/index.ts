import * as logger from "firebase-functions/logger";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import {
  BillingNode,
  BillingNotificationData,
  MIN_COST_DIFF_FOR_ALERT,
  _maybeDisableBilling,
} from "./billing";
import { sendDiscordBillingMessage } from "./discordhandler";
import { getDatabase } from "firebase-admin/database";
import { initializeApp } from "firebase-admin/app";

initializeApp();

exports.handleBillingAlert = onMessagePublished(
  "projects/cap-firebase-billing/topics/billing",
  async (event) => {
    logger.debug("handleBillingAlert");
    const eventData: BillingNotificationData = event.data.message.json;
    logger.debug(`eventData: ${JSON.stringify(eventData)}`);
    const billingRef = getDatabase().ref("billing");
    const billingData: BillingNode = (await billingRef.once("value")).val();
    logger.debug(`billingData: ${JSON.stringify(billingData)}`);
    let { lastReportedCost, lastReportedIntervalStart } = billingData;

    const isNewBillingCycle =
      eventData.costIntervalStart !== lastReportedIntervalStart;
    logger.debug(`isNewBillingCycle: ${isNewBillingCycle}`);
    if (isNewBillingCycle) lastReportedCost = 0;

    const budgetExceeded = eventData.costAmount >= eventData.budgetAmount;
    if (
      !budgetExceeded &&
      eventData.costAmount - lastReportedCost < MIN_COST_DIFF_FOR_ALERT
    )
      return;

    const promises: Array<Promise<any>> = [];
    if (budgetExceeded) {
      _maybeDisableBilling();
      promises.push(
        sendDiscordBillingMessage(
          `**CRITICAL**: 100% of your budget has been used. Your current bill is at $${eventData.costAmount} ${eventData.currencyCode}. \nBilling has been disabled.`
        )
      );
    } else {
      const percentageUsed = Math.floor(
        (eventData.costAmount / eventData.budgetAmount) * 100
      );
      promises.push(
        sendDiscordBillingMessage(
          `Your current bill is at $${eventData.costAmount} ${eventData.currencyCode}. \n${percentageUsed}% of your budget has been used.`
        )
      );
    }

    promises.push(
      billingRef.update({
        lastReportedCost: eventData.costAmount,
        lastReportedIntervalStart: eventData.costIntervalStart,
      })
    );
    await Promise.all(promises);
  }
);
