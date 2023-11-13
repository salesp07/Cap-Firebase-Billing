import { CloudBillingClient } from "@google-cloud/billing";
import * as logger from "firebase-functions/logger";

const PROJECT_ID = process.env.GCLOUD_PROJECT;
const PROJECT_NAME = `projects/${PROJECT_ID}`;
const billing = new CloudBillingClient();
export const MIN_COST_DIFF_FOR_ALERT = 1;

export type BillingNotificationData = {
  budgetDisplayName: string;
  costAmount: number;
  costIntervalStart: string;
  budgetAmount: number;
  budgetAmountType:
    | "SPECIFIED_AMOUNT"
    | "LAST_MONTH_COST"
    | "LAST_PERIODS_COST";
  alertThresholdExceeded?: number;
  forecastThresholdExceeded?: number;
  currencyCode: string;
};

export type BillingNode = {
  lastReportedIntervalStart: string;
  lastReportedCost: number;
};

const _isBillingEnabled = async () => {
  try {
    const [res] = await billing.getProjectBillingInfo({ name: PROJECT_NAME });
    logger.debug(`projectBillingInfo: ${JSON.stringify(res)}`);
    return res.billingEnabled;
  } catch (err) {
    logger.error(
      `Unable to determine if billing is enabled on specified project, assuming billing is enabled: ${err}`
    );
    return false;
  }
};

export const _maybeDisableBilling = async () => {
  const billingEnabled = await _isBillingEnabled();
  if (!billingEnabled) return;
  try {
    await billing.updateProjectBillingInfo({
      name: PROJECT_NAME,
      projectBillingInfo: { billingAccountName: "" },
    });
    logger.debug("Billing was successfully disabled!");
  } catch (err) {
    logger.error(`Something went wrong while disabling billing: ${err}`);
  }
};
